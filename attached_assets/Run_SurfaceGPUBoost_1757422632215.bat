@echo off
:: Run_SurfaceGPUBoost.bat - launches the PowerShell script as admin with sane defaults
setlocal
set SCRIPT=%~dp0SurfaceGPUBoost.ps1
powershell -NoProfile -ExecutionPolicy Bypass -File "%SCRIPT%"
echo.
echo Done. If no errors were shown, please restart Windows to apply HAGS and power plan changes.
pause
