# ESP32 Harmonic Sensor - Simple Test Setup

This is a **completely local, secure testing system** for your ESP32 harmonic sensor. No data leaves your computer.

## 🚀 Quick Start (2 minutes)

### Option 1: One-Click Setup
1. **Double-click `quick_start.bat`**
2. **Wait for the dashboard to open automatically**
3. **Click "Start Simulation" to see it working**

That's it! No ESP32 needed for initial testing.

### Option 2: With Real ESP32
1. **Run `quick_start.bat`** (starts the server)
2. **Update the ESP32 code:**
   - Open `esp32_simple_test.ino` in Arduino IDE
   - Change `YOUR_WIFI_NAME` and `YOUR_WIFI_PASSWORD`
   - Change the IP address in `serverURL` to your computer's IP
3. **Upload to ESP32**
4. **Watch the dashboard for real data**

## 🔧 What You Need

### For Testing (No Hardware Required)
- Windows computer
- Internet connection (for initial setup only)

### For Real ESP32 Testing
- ESP32 development board
- USB cable
- Arduino IDE with ESP32 support
- WiFi network

### Optional Sensors (for real data)
- DHT22 temperature/humidity sensor
- LDR light sensor
- PIR motion sensor
- Any other sensors you have

## 📊 What You'll See

The dashboard shows:
- **Real-time sensor data** (temperature, humidity, pressure, light)
- **Harmonic analysis** using your framework
- **Weyl State classification** (stable, oscillating, chaotic)
- **Activity log** of all events

## 🔒 Security Features

- **100% Local**: No external connections
- **No Data Leakage**: Everything stays on your computer
- **No Registration**: No accounts or sign-ups needed
- **No Tracking**: No analytics or data collection

## 🛠️ Troubleshooting

### Server Won't Start
```bash
pip install flask flask-cors
python simple_sensor_server.py
```

### ESP32 Can't Connect
1. Check WiFi credentials in the code
2. Find your computer's IP: `ipconfig` (Windows) or `ifconfig` (Mac/Linux)
3. Update the `serverURL` in the ESP32 code

### No Data Appearing
1. Make sure the server is running (check http://localhost:5000/health)
2. Check the ESP32 serial monitor for connection status
3. Try the "Send Test Data" button on the dashboard

## 📁 Files Created

- `simple_sensor_server.py` - Local server (no external connections)
- `esp32_simple_test.ino` - ESP32 firmware
- `quick_start.bat` - One-click setup
- `sensor_dashboard.html` - Web dashboard

## 🎯 Next Steps

Once you've tested the basic system:

1. **Add real sensors** to your ESP32
2. **Customize the harmonic analysis** in the server code
3. **Integrate with your VM system** for advanced processing
4. **Connect to your blockchain** for data immutability

## 💡 Tips

- The system works with **any sensors** you have
- **No sensors?** It generates realistic simulated data
- **Multiple ESP32s?** Each gets a unique device ID
- **Want to modify?** All code is clearly commented

## 🔗 API Endpoints

- `GET /` - Dashboard
- `POST /ingest` - Send sensor data
- `GET /health` - Server status
- `POST /simulate` - Generate test data
- `GET /recent` - Get recent readings
- `GET /harmonic/stats` - Get analysis statistics

---

**Ready to test? Just run `quick_start.bat` and you're good to go!**

