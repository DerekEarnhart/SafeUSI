@echo off
echo ========================================
echo ESP32 Harmonic Sensor System Setup
echo ========================================
echo.

echo [1/4] Installing Python dependencies...
pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo ERROR: Failed to install Python dependencies
    pause
    exit /b 1
)
echo ✓ Python dependencies installed
echo.

echo [2/4] Starting sensor ingestion server...
echo Starting server on http://localhost:5000
echo Press Ctrl+C to stop the server
echo.
start "ESP32 Sensor Server" python ingest_server.py
echo ✓ Server started in background
echo.

echo [3/4] ESP32 Firmware Setup Instructions:
echo.
echo 1. Install Arduino IDE with ESP32 support:
echo    - Download Arduino IDE from https://www.arduino.cc/
echo    - Add ESP32 board support via Board Manager
echo    - Install required libraries:
echo      * DHT sensor library
echo      * Adafruit BMP280 library
echo      * ArduinoJson library
echo.
echo 2. Hardware Connections:
echo    - DHT22: Pin 4 (Data), 3.3V, GND
echo    - BMP280: SDA (Pin 21), SCL (Pin 22), 3.3V, GND
echo    - LDR: Pin 34 (Analog), 3.3V, GND (with 10k pull-down)
echo    - PIR: Pin 2 (Digital), 5V, GND
echo    - LED: Pin 5 (Digital), 3.3V, GND (with 220Ω resistor)
echo.
echo 3. Configure WiFi and Server:
echo    - Edit esp32_harmonic_sensor.ino
echo    - Update WiFi credentials (ssid, password)
echo    - Update server URL with your computer's IP address
echo.
echo 4. Upload firmware to ESP32
echo.

echo [4/4] Testing the System:
echo.
echo Open a new command prompt and run:
echo curl -X POST http://localhost:5000/ingest -H "Content-Type: application/json" -d "{\"device_id\":\"test\",\"temperature\":23.5,\"humidity\":45.2,\"pressure\":1013.25,\"light\":850}"
echo.
echo Or visit: http://localhost:5000/health
echo.

echo ========================================
echo Setup Complete!
echo ========================================
echo.
echo Next Steps:
echo 1. Configure your ESP32 with the provided firmware
echo 2. Update WiFi and server settings in the Arduino code
echo 3. Upload the firmware to your ESP32
echo 4. Monitor the server logs for incoming sensor data
echo 5. Check harmonic analysis at: http://localhost:5000/harmonic/stats
echo.
echo The system will automatically analyze sensor data using your
echo Harmonic Unification Framework (HUF) and Weyl State Machine (WSM)
echo.

pause
