@echo off
title ESP32 Harmonic Sensor - Quick Start
color 0A
echo.
echo ===============================================
echo    ESP32 HARMONIC SENSOR - QUICK START
echo ===============================================
echo.
echo This will set up a local sensor system for testing
echo No data will be sent to external servers
echo.

echo [1/3] Installing dependencies...
pip install flask flask-cors --quiet
if %errorlevel% neq 0 (
    echo ERROR: Failed to install dependencies
    echo Please run: pip install flask flask-cors
    pause
    exit /b 1
)
echo ✓ Dependencies installed
echo.

echo [2/3] Starting local sensor server...
echo Server will run on: http://localhost:5000
echo Dashboard will be at: http://localhost:5000/dashboard
echo.
echo Press Ctrl+C to stop the server
echo.

start "Sensor Dashboard" cmd /c "timeout 3 && start http://localhost:5000/dashboard"

echo [3/3] Starting server...
python simple_sensor_server.py

