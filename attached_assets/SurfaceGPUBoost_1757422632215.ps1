<# 
SurfaceGPUBoost.ps1
Windows GPU optimization helper for Surface/Windows laptops & tablets.

What it does (idempotent, safe defaults):
 - Enables Game Mode (current user).
 - Requests Hardware-Accelerated GPU Scheduling (HAGS) if supported.
 - Activates the "Ultimate Performance" power plan.
 - Sets Battery Saver auto-on threshold to 0% (never).
 - (Optional) Forces selected apps to use the High performance GPU.
 - (Optional) Triggers Windows Update scan/install for drivers.
 - Logs all actions to SurfaceGPUBoost.log next to this script.
 - Checks for USB4 (Thunderbolt/USB4) controller presence (for eGPU hint).

Usage (run as Admin):
  Right-click -> Run with PowerShell  (or run the included .bat)
  Examples:
    powershell -ExecutionPolicy Bypass -File .\SurfaceGPUBoost.ps1
    powershell -ExecutionPolicy Bypass -File .\SurfaceGPUBoost.ps1 -AppsListPath .\apps.txt -RunWindowsUpdate

Parameters:
  -NoRestorePoint         Skip creating a system restore point.
  -AppsListPath <path>    Text file with one .exe path per line (default .\apps.txt).
  -EnableHAGS             Enable HAGS (default: on).
  -EnableGameMode         Enable Game Mode (default: on).
  -UltimatePower          Activate Ultimate Performance power plan (default: on).
  -DisableBatterySaverAuto Set Battery Saver auto threshold to 0% (default: on).
  -RunWindowsUpdate       Kick off Windows Update scan/download/install (optional).

Notes:
 - HAGS requires a supported GPU/driver and Windows version. We write the registry
   request and let Windows apply it if supported after reboot.
 - Per-app GPU preference uses the documented registry key
   HKCU\Software\Microsoft\DirectX\UserGpuPreferences with "GpuPreference=2;"
   to force High performance GPU.
 - Reboot recommended after running.
#>

param(
    [switch]$NoRestorePoint,
    [string]$AppsListPath = ".\apps.txt",
    [switch]$EnableHAGS = $true,
    [switch]$EnableGameMode = $true,
    [switch]$UltimatePower = $true,
    [switch]$DisableBatterySaverAuto = $true,
    [switch]$RunWindowsUpdate = $false
)

# --- Elevation check: relaunch as admin if needed ---
$currUser = [Security.Principal.WindowsIdentity]::GetCurrent()
$principal = New-Object Security.Principal.WindowsPrincipal($currUser)
$admin = $principal.IsInRole([Security.Principal.WindowsBuiltinRole]::Administrator)
if (-not $admin) {
    Write-Host "This script needs Administrator rights. Relaunching elevated..."
    $argsQuoted = $MyInvocation.BoundParameters.GetEnumerator() | ForEach-Object {
        if ($_.Value -is [switch] -and $_.Value) { "-$($_.Key)" }
        elseif ($_.Value -isnot [switch]) { "-$($_.Key) `"$($_.Value)`"" }
    }
    $argLine = $argsQuoted -join ' '
    Start-Process -FilePath "powershell.exe" -ArgumentList "-NoProfile -ExecutionPolicy Bypass -File `"$PSCommandPath`" $argLine" -Verb RunAs
    exit
}

# --- Logging ---
$log = Join-Path $PSScriptRoot "SurfaceGPUBoost.log"
try { Start-Transcript -Path $log -Append | Out-Null } catch {}

function Set-RegistryDword {
    param([string]$Path,[string]$Name,[int]$Value)
    if (-not (Test-Path $Path)) { New-Item -Path $Path -Force | Out-Null }
    New-ItemProperty -Path $Path -Name $Name -PropertyType DWord -Value $Value -Force | Out-Null
}

Write-Host "== SurfaceGPUBoost starting =="

# --- Restore point (best-effort) ---
if (-not $NoRestorePoint) {
    try {
        Checkpoint-Computer -Description "SurfaceGPUBoost pre-change" -RestorePointType "MODIFY_SETTINGS"
        Write-Host "Created system restore point."
    } catch {
        Write-Warning "Couldn't create a restore point (System Protection may be off): $($_.Exception.Message)"
    }
}

# --- Enable Game Mode (current user) ---
if ($EnableGameMode) {
    try {
        $gb = "HKCU:\Software\Microsoft\GameBar"
        Set-RegistryDword -Path $gb -Name "AllowAutoGameMode" -Value 1
        Set-RegistryDword -Path $gb -Name "AutoGameModeEnabled" -Value 1
        Write-Host "Game Mode enabled for current user."
    } catch { Write-Warning "Failed to enable Game Mode: $($_.Exception.Message)" }
}

# --- Enable HAGS request (system-wide) ---
if ($EnableHAGS) {
    try {
        $gd = "HKLM:\SYSTEM\CurrentControlSet\Control\GraphicsDrivers"
        # HwSchMode: 2 enable, 1 disable, 0/default = system decides
        Set-RegistryDword -Path $gd -Name "HwSchMode" -Value 2
        Write-Host "Requested: Hardware-accelerated GPU scheduling = ENABLED (requires supported GPU/driver + restart)."
    } catch { Write-Warning "Failed to set HAGS registry value: $($_.Exception.Message)" }
}

# --- Activate Ultimate Performance plan ---
if ($UltimatePower) {
    try {
        $ultimateGuid = "e9a42b02-d5df-448d-aa00-03f14749eb61"
        $list = (powercfg /list) | Out-String
        if ($list -notmatch $ultimateGuid) {
            powercfg -duplicatescheme $ultimateGuid | Out-Null
        }
        # Retrieve the duplicated plan GUID with a label containing 'Ultimate performance'
        $match = (powercfg /list) | Select-String -Pattern "GUID:\s+([a-f0-9-]+)\s+\((Ultimate performance)\)" -IgnoreCase
        $guid = if ($match) { $match.Matches[0].Groups[1].Value } else { $ultimateGuid }
        powercfg /setactive $guid | Out-Null
        Write-Host "Ultimate Performance power plan set active."
    } catch { Write-Warning "Failed to set power plan: $($_.Exception.Message)" }
}

# --- Battery Saver auto threshold -> 0% (never) ---
if ($DisableBatterySaverAuto) {
    try {
        powercfg /setdcvalueindex SCHEME_CURRENT SUB_ENERGYSAVER ESBATTTHRESHOLD 0 | Out-Null
        Write-Host "Battery Saver automatic threshold set to 0% (never)."
    } catch { Write-Warning "Failed to change Battery Saver threshold: $($_.Exception.Message)" }
}

# --- Per-app GPU preferences ---
try {
    $reg = "HKCU:\Software\Microsoft\DirectX\UserGpuPreferences"
    if (-not (Test-Path $reg)) { New-Item $reg -Force | Out-Null }

    if (Test-Path $AppsListPath) {
        $apps = Get-Content $AppsListPath | Where-Object { $_ -and -not $_.StartsWith("#") }
        foreach ($app in $apps) {
            $resolved = $null
            try { $resolved = (Resolve-Path $app -ErrorAction Stop).Path } catch {}
            if (-not $resolved) {
                # Try expanding environment variables
                $candidate = [Environment]::ExpandEnvironmentVariables($app)
                if (Test-Path $candidate) { $resolved = (Resolve-Path $candidate).Path }
            }
            if ($resolved) {
                # REG_SZ "C:\path\app.exe"="GpuPreference=2;"
                New-ItemProperty -Path $reg -Name $resolved -PropertyType String -Value "GpuPreference=2;" -Force | Out-Null
                Write-Host "High-performance GPU forced for: $resolved"
            } else {
                Write-Warning "App path not found: $app"
            }
        }
    } else {
        Write-Host "No apps list found at $AppsListPath. Create this file with one .exe path per line to force High performance GPU."
    }
} catch { Write-Warning "Failed to set per-app GPU preferences: $($_.Exception.Message)" }

# --- Optional: trigger Windows Update scan/download/install for drivers ---
if ($RunWindowsUpdate) {
    try {
        Write-Host "Triggering Windows Update scan/download/install (best-effort)..."
        try { usoclient StartScan } catch {}
        Start-Sleep -Seconds 2
        try { usoclient StartDownload } catch {}
        Start-Sleep -Seconds 2
        try { usoclient StartInstall } catch {}
        Write-Host "Windows Update triggered. Check Settings > Windows Update for progress."
    } catch { Write-Warning "Windows Update trigger failed: $($_.Exception.Message)" }
}

# --- eGPU hint: check USB4/Thunderbolt presence ---
try {
    $usb4 = Get-PnpDevice -FriendlyName "*USB4*" -ErrorAction SilentlyContinue
    if ($usb4) {
        Write-Host "USB4 controller detected. eGPU over Thunderbolt/USB4 may be supported."
    } else {
        Write-Host "USB4/Thunderbolt controller not detected (or hidden). eGPU may not be supported on this device."
    }
} catch {}

Write-Host "== SurfaceGPUBoost finished. A restart is recommended. =="
try { Stop-Transcript | Out-Null } catch {}
