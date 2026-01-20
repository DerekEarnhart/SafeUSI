#!/usr/bin/env python3
"""
Simple ESP32 Sensor Server - Local Testing Only
No external connections, completely self-contained
"""

import json
import time
import random
from datetime import datetime
from flask import Flask, request, jsonify, render_template_string
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# In-memory storage (no persistent files)
sensor_data = []
harmonic_data = []

# HTML Dashboard Template
DASHBOARD_HTML = """
<!DOCTYPE html>
<html>
<head>
    <title>ESP32 Sensor Dashboard</title>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f0f0f0; }
        .container { max-width: 1200px; margin: 0 auto; }
        .header { text-align: center; color: #333; margin-bottom: 30px; }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; }
        .card { background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .card h3 { color: #4CAF50; margin-bottom: 15px; }
        .value { font-size: 2em; font-weight: bold; color: #333; }
        .unit { color: #666; font-size: 0.8em; }
        .status { padding: 10px; border-radius: 5px; color: white; text-align: center; margin: 10px 0; }
        .stable { background: #4CAF50; }
        .oscillating { background: #FF9800; }
        .chaotic { background: #F44336; }
        .unknown { background: #9E9E9E; }
        .controls { text-align: center; margin: 20px 0; }
        .btn { padding: 10px 20px; margin: 5px; border: none; border-radius: 5px; cursor: pointer; }
        .btn-primary { background: #4CAF50; color: white; }
        .btn-secondary { background: #2196F3; color: white; }
        .log { background: #1e1e1e; color: #00ff00; padding: 15px; border-radius: 5px; font-family: monospace; max-height: 200px; overflow-y: auto; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🌊 ESP32 Harmonic Sensor Dashboard</h1>
            <p>Local Testing - No External Connections</p>
        </div>

        <div class="controls">
            <button class="btn btn-primary" onclick="startSimulation()">Start Simulation</button>
            <button class="btn btn-secondary" onclick="stopSimulation()">Stop Simulation</button>
            <button class="btn btn-secondary" onclick="sendTestData()">Send Test Data</button>
        </div>

        <div class="grid">
            <div class="card">
                <h3>🌡️ Temperature & Humidity</h3>
                <div class="value" id="temp">--<span class="unit">°C</span></div>
                <div class="value" id="humidity">--<span class="unit">%</span></div>
            </div>

            <div class="card">
                <h3>🌬️ Pressure & Light</h3>
                <div class="value" id="pressure">--<span class="unit">hPa</span></div>
                <div class="value" id="light">--<span class="unit">LUX</span></div>
            </div>

            <div class="card">
                <h3>🌀 Weyl State</h3>
                <div class="status unknown" id="weylState">Unknown</div>
                <div><strong>Frequency:</strong> <span id="freq">0.00</span></div>
                <div><strong>Amplitude:</strong> <span id="amp">0.00</span></div>
                <div><strong>Coherence:</strong> <span id="coh">0.00</span></div>
            </div>

            <div class="card">
                <h3>📊 System Status</h3>
                <div><strong>Readings:</strong> <span id="readings">0</span></div>
                <div><strong>Last Update:</strong> <span id="lastUpdate">Never</span></div>
                <div><strong>Status:</strong> <span id="status">Offline</span></div>
            </div>
        </div>

        <div class="card">
            <h3>📝 Activity Log</h3>
            <div id="log" class="log">System ready. Click "Start Simulation" to begin...</div>
        </div>
    </div>

    <script>
        let simulationInterval;
        let isRunning = false;

        function log(message) {
            const logDiv = document.getElementById('log');
            const timestamp = new Date().toLocaleTimeString();
            logDiv.innerHTML += `[${timestamp}] ${message}<br>`;
            logDiv.scrollTop = logDiv.scrollHeight;
        }

        function updateDisplay(data) {
            document.getElementById('temp').innerHTML = (data.temperature || 0).toFixed(1) + '<span class="unit">°C</span>';
            document.getElementById('humidity').innerHTML = (data.humidity || 0).toFixed(1) + '<span class="unit">%</span>';
            document.getElementById('pressure').innerHTML = (data.pressure || 0).toFixed(1) + '<span class="unit">hPa</span>';
            document.getElementById('light').innerHTML = (data.light || 0) + '<span class="unit">LUX</span>';
            
            if (data.harmonic_analysis) {
                const ha = data.harmonic_analysis;
                const weylState = document.getElementById('weylState');
                weylState.textContent = ha.weyl_state || 'unknown';
                weylState.className = 'status ' + (ha.weyl_state || 'unknown');
                
                document.getElementById('freq').textContent = (ha.harmonic_frequency || 0).toFixed(3);
                document.getElementById('amp').textContent = (ha.amplitude_modulation || 0).toFixed(3);
                document.getElementById('coh').textContent = (ha.phase_coherence || 0).toFixed(3);
            }
            
            document.getElementById('lastUpdate').textContent = new Date().toLocaleTimeString();
        }

        function startSimulation() {
            if (isRunning) return;
            isRunning = true;
            document.getElementById('status').textContent = 'Simulating';
            log('Starting sensor simulation...');
            
            simulationInterval = setInterval(() => {
                fetch('/simulate', {method: 'POST'})
                    .then(response => response.json())
                    .then(data => {
                        if (data.ok) {
                            updateDisplay(data.sensor_data);
                            document.getElementById('readings').textContent = data.total_readings;
                        }
                    })
                    .catch(error => log('Error: ' + error));
            }, 2000);
        }

        function stopSimulation() {
            if (!isRunning) return;
            isRunning = false;
            clearInterval(simulationInterval);
            document.getElementById('status').textContent = 'Stopped';
            log('Simulation stopped');
        }

        function sendTestData() {
            fetch('/test', {method: 'POST'})
                .then(response => response.json())
                .then(data => {
                    if (data.ok) {
                        updateDisplay(data.sensor_data);
                        document.getElementById('readings').textContent = data.total_readings;
                        log('Test data sent successfully');
                    }
                })
                .catch(error => log('Error: ' + error));
        }

        // Auto-start simulation after 2 seconds
        setTimeout(() => {
            log('Dashboard loaded. Ready for testing.');
        }, 1000);
    </script>
</body>
</html>
"""

def analyze_harmonic(data):
    """Simple harmonic analysis for testing"""
    temp = data.get('temperature', 20)
    humidity = data.get('humidity', 50)
    pressure = data.get('pressure', 1013)
    
    # Simple harmonic calculations
    freq = (temp - 20) * 0.1
    amp = humidity / 100.0
    coh = (pressure - 1013) / 1013.0
    
    # Determine Weyl state
    if abs(coh) < 0.1:
        state = "stable"
    elif abs(coh) < 0.3:
        state = "oscillating"
    else:
        state = "chaotic"
    
    return {
        "harmonic_frequency": freq,
        "amplitude_modulation": amp,
        "phase_coherence": coh,
        "quantum_resonance": 0.5,
        "weyl_state": state
    }

@app.route('/')
def dashboard():
    return render_template_string(DASHBOARD_HTML)

@app.route('/health')
def health():
    return jsonify({
        "status": "ok",
        "time": datetime.now().isoformat(),
        "readings": len(sensor_data),
        "local_only": True
    })

@app.route('/ingest', methods=['POST'])
def ingest():
    """Main sensor data endpoint"""
    try:
        data = request.get_json() or {}
        
        # Add timestamp
        data['timestamp'] = datetime.now().isoformat()
        data['source'] = 'esp32'
        
        # Perform harmonic analysis
        harmonic = analyze_harmonic(data)
        data['harmonic_analysis'] = harmonic
        
        # Store in memory
        sensor_data.append(data)
        harmonic_data.append(harmonic)
        
        # Keep only last 100 readings
        if len(sensor_data) > 100:
            sensor_data.pop(0)
            harmonic_data.pop(0)
        
        return jsonify({
            "ok": True,
            "harmonic_analysis": harmonic,
            "weyl_state": harmonic['weyl_state'],
            "total_readings": len(sensor_data)
        })
        
    except Exception as e:
        return jsonify({"ok": False, "error": str(e)}), 400

@app.route('/simulate', methods=['POST'])
def simulate():
    """Generate simulated sensor data for testing"""
    # Generate realistic sensor data
    data = {
        "device_id": "esp32_sim",
        "temperature": 20 + random.uniform(-5, 10),
        "humidity": 40 + random.uniform(-20, 30),
        "pressure": 1013 + random.uniform(-20, 20),
        "light": random.randint(100, 1000),
        "motion": random.choice([True, False]),
        "sound_level": random.uniform(30, 80),
        "vibration": random.uniform(0, 0.1),
        "magnetic_field": random.uniform(20, 30)
    }
    
    # Add timestamp
    data['timestamp'] = datetime.now().isoformat()
    data['source'] = 'simulation'
    
    # Perform harmonic analysis
    harmonic = analyze_harmonic(data)
    data['harmonic_analysis'] = harmonic
    
    # Store in memory
    sensor_data.append(data)
    harmonic_data.append(harmonic)
    
    # Keep only last 100 readings
    if len(sensor_data) > 100:
        sensor_data.pop(0)
        harmonic_data.pop(0)
    
    return jsonify({
        "ok": True,
        "sensor_data": data,
        "total_readings": len(sensor_data)
    })

@app.route('/test', methods=['POST'])
def test():
    """Send a single test data point"""
    data = {
        "device_id": "esp32_test",
        "temperature": 23.5,
        "humidity": 45.2,
        "pressure": 1013.25,
        "light": 850,
        "motion": False,
        "sound_level": 42.1,
        "vibration": 0.05,
        "magnetic_field": 25.3
    }
    
    # Add timestamp
    data['timestamp'] = datetime.now().isoformat()
    data['source'] = 'test'
    
    # Perform harmonic analysis
    harmonic = analyze_harmonic(data)
    data['harmonic_analysis'] = harmonic
    
    # Store in memory
    sensor_data.append(data)
    harmonic_data.append(harmonic)
    
    return jsonify({
        "ok": True,
        "sensor_data": data,
        "total_readings": len(sensor_data)
    })

@app.route('/recent')
def recent():
    """Get recent sensor data"""
    n = min(int(request.args.get('n', 10)), 50)
    return jsonify({
        "ok": True,
        "count": len(sensor_data),
        "items": sensor_data[-n:]
    })

@app.route('/harmonic/stats')
def harmonic_stats():
    """Get harmonic analysis statistics"""
    if not harmonic_data:
        return jsonify({"ok": True, "stats": {"total_readings": 0}})
    
    states = {"stable": 0, "oscillating": 0, "chaotic": 0, "unknown": 0}
    for h in harmonic_data:
        state = h.get('weyl_state', 'unknown')
        if state in states:
            states[state] += 1
    
    return jsonify({
        "ok": True,
        "stats": {
            "total_readings": len(harmonic_data),
            "weyl_states": states,
            "avg_frequency": sum(h.get('harmonic_frequency', 0) for h in harmonic_data) / len(harmonic_data),
            "avg_amplitude": sum(h.get('amplitude_modulation', 0) for h in harmonic_data) / len(harmonic_data),
            "avg_coherence": sum(h.get('phase_coherence', 0) for h in harmonic_data) / len(harmonic_data)
        }
    })

if __name__ == '__main__':
    print("=" * 50)
    print("ESP32 HARMONIC SENSOR SERVER")
    print("=" * 50)
    print("Local testing server - No external connections")
    print("Dashboard: http://localhost:5000")
    print("API: http://localhost:5000/ingest")
    print("=" * 50)
    print("Press Ctrl+C to stop")
    print()
    
    app.run(host='127.0.0.1', port=5000, debug=False)

