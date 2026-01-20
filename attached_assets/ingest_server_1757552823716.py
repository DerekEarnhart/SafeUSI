#!/usr/bin/env python3
"""
ESP32 Sensor Data Ingestion Server
Integrates with Harmonic Unification Framework (HUF) and Weyl State Machine (WSM)
"""

from __future__ import annotations
import json
import time
import logging
from pathlib import Path
from typing import Any, Dict, List, Optional
from datetime import datetime

from flask import Flask, request, jsonify
from flask_cors import CORS

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)  # Enable CORS for ESP32 communication

# File paths
LOG_PATH = Path("sensor_data_log.ndjson")
HARMONIC_LOG_PATH = Path("harmonic_analysis_log.ndjson")

def _now_ms() -> int:
    """Get current timestamp in milliseconds"""
    return int(time.time() * 1000)

def _analyze_harmonic_signature(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Analyze sensor data using Harmonic Unification Framework principles
    This implements basic harmonic analysis for sensor data patterns
    """
    harmonic_analysis = {
        "timestamp": _now_ms(),
        "harmonic_frequency": 0.0,
        "amplitude_modulation": 0.0,
        "phase_coherence": 0.0,
        "quantum_resonance": 0.0,
        "weyl_state": "unknown"
    }
    
    # Basic harmonic analysis based on sensor values
    if "temperature" in data:
        # Temperature affects harmonic frequency
        temp = float(data["temperature"])
        harmonic_analysis["harmonic_frequency"] = (temp - 20) * 0.1  # Normalize around 20°C
    
    if "humidity" in data:
        # Humidity affects amplitude modulation
        humidity = float(data["humidity"])
        harmonic_analysis["amplitude_modulation"] = humidity / 100.0
    
    if "pressure" in data:
        # Pressure affects phase coherence
        pressure = float(data["pressure"])
        harmonic_analysis["phase_coherence"] = (pressure - 1013.25) / 1013.25  # Normalize around sea level
    
    # Calculate quantum resonance based on multiple sensors
    sensor_count = len([k for k in data.keys() if k not in ["ts_ms", "source", "device_id"]])
    harmonic_analysis["quantum_resonance"] = sensor_count * 0.1
    
    # Determine Weyl State based on harmonic coherence
    coherence = abs(harmonic_analysis["phase_coherence"])
    if coherence < 0.1:
        harmonic_analysis["weyl_state"] = "stable"
    elif coherence < 0.3:
        harmonic_analysis["weyl_state"] = "oscillating"
    else:
        harmonic_analysis["weyl_state"] = "chaotic"
    
    return harmonic_analysis

@app.route("/health", methods=["GET"])
def health() -> Any:
    """Health check endpoint"""
    return jsonify({
        "status": "ok", 
        "time_ms": _now_ms(),
        "framework": "Harmonic Unification Framework",
        "version": "1.0.0"
    })

@app.route("/ingest", methods=["POST"])
def ingest() -> Any:
    """
    Main sensor data ingestion endpoint
    Accepts JSON data from ESP32 and other sensors
    """
    try:
        payload = request.get_json(force=True, silent=False)
    except Exception as e:
        logger.error(f"Invalid JSON received: {e}")
        return jsonify({"ok": False, "error": f"invalid json: {e}"}), 400

    # Validate payload structure
    if not isinstance(payload, dict):
        return jsonify({"ok": False, "error": "expected a JSON object"}), 400

    # Enrich payload with metadata
    payload.setdefault("ts_ms", _now_ms())
    payload.setdefault("source", "esp32")
    payload.setdefault("device_id", payload.get("device_id", "unknown"))
    
    # Perform harmonic analysis
    harmonic_analysis = _analyze_harmonic_signature(payload)
    payload["harmonic_analysis"] = harmonic_analysis
    
    # Log raw sensor data
    sensor_line = json.dumps(payload, ensure_ascii=False)
    if not LOG_PATH.exists():
        LOG_PATH.write_text("", encoding="utf-8")
    
    with LOG_PATH.open("a", encoding="utf-8") as f:
        f.write(sensor_line + "\n")
    
    # Log harmonic analysis separately
    harmonic_line = json.dumps({
        "timestamp": _now_ms(),
        "device_id": payload.get("device_id", "unknown"),
        "harmonic_analysis": harmonic_analysis
    }, ensure_ascii=False)
    
    if not HARMONIC_LOG_PATH.exists():
        HARMONIC_LOG_PATH.write_text("", encoding="utf-8")
    
    with HARMONIC_LOG_PATH.open("a", encoding="utf-8") as f:
        f.write(harmonic_line + "\n")
    
    logger.info(f"Sensor data ingested from {payload.get('device_id', 'unknown')}: {harmonic_analysis['weyl_state']} state")
    
    return jsonify({
        "ok": True, 
        "harmonic_analysis": harmonic_analysis,
        "weyl_state": harmonic_analysis["weyl_state"]
    })

@app.route("/recent", methods=["GET"])
def recent() -> Any:
    """Get recent sensor data"""
    n = int(request.args.get("n", 50))
    out: List[Dict[str, Any]] = []
    
    if LOG_PATH.exists():
        with LOG_PATH.open("r", encoding="utf-8") as f:
            for line in f.readlines()[-n:]:
                try:
                    out.append(json.loads(line))
                except json.JSONDecodeError:
                    pass
    
    return jsonify({"ok": True, "count": len(out), "items": out})

@app.route("/harmonic/recent", methods=["GET"])
def harmonic_recent() -> Any:
    """Get recent harmonic analysis data"""
    n = int(request.args.get("n", 50))
    out: List[Dict[str, Any]] = []
    
    if HARMONIC_LOG_PATH.exists():
        with HARMONIC_LOG_PATH.open("r", encoding="utf-8") as f:
            for line in f.readlines()[-n:]:
                try:
                    out.append(json.loads(line))
                except json.JSONDecodeError:
                    pass
    
    return jsonify({"ok": True, "count": len(out), "items": out})

@app.route("/harmonic/stats", methods=["GET"])
def harmonic_stats() -> Any:
    """Get harmonic analysis statistics"""
    stats = {
        "total_readings": 0,
        "weyl_states": {"stable": 0, "oscillating": 0, "chaotic": 0, "unknown": 0},
        "avg_frequency": 0.0,
        "avg_amplitude": 0.0,
        "avg_coherence": 0.0,
        "avg_resonance": 0.0
    }
    
    if HARMONIC_LOG_PATH.exists():
        frequencies = []
        amplitudes = []
        coherences = []
        resonances = []
        
        with HARMONIC_LOG_PATH.open("r", encoding="utf-8") as f:
            for line in f.readlines():
                try:
                    data = json.loads(line)
                    if "harmonic_analysis" in data:
                        ha = data["harmonic_analysis"]
                        stats["total_readings"] += 1
                        
                        # Count Weyl states
                        state = ha.get("weyl_state", "unknown")
                        if state in stats["weyl_states"]:
                            stats["weyl_states"][state] += 1
                        
                        # Collect values for averages
                        frequencies.append(ha.get("harmonic_frequency", 0))
                        amplitudes.append(ha.get("amplitude_modulation", 0))
                        coherences.append(ha.get("phase_coherence", 0))
                        resonances.append(ha.get("quantum_resonance", 0))
                        
                except json.JSONDecodeError:
                    pass
        
        # Calculate averages
        if frequencies:
            stats["avg_frequency"] = sum(frequencies) / len(frequencies)
            stats["avg_amplitude"] = sum(amplitudes) / len(amplitudes)
            stats["avg_coherence"] = sum(coherences) / len(coherences)
            stats["avg_resonance"] = sum(resonances) / len(resonances)
    
    return jsonify({"ok": True, "stats": stats})

@app.route("/devices", methods=["GET"])
def devices() -> Any:
    """Get list of connected devices"""
    devices = set()
    
    if LOG_PATH.exists():
        with LOG_PATH.open("r", encoding="utf-8") as f:
            for line in f.readlines():
                try:
                    data = json.loads(line)
                    device_id = data.get("device_id", "unknown")
                    devices.add(device_id)
                except json.JSONDecodeError:
                    pass
    
    return jsonify({"ok": True, "devices": list(devices)})

if __name__ == "__main__":
    logger.info("Starting ESP32 Sensor Ingestion Server with Harmonic Analysis")
    logger.info("Framework: Harmonic Unification Framework (HUF)")
    logger.info("State Machine: Weyl State Machine (WSM)")
    
    # Create log directories if they don't exist
    LOG_PATH.parent.mkdir(exist_ok=True)
    HARMONIC_LOG_PATH.parent.mkdir(exist_ok=True)
    
    # Run on localhost:5000
    app.run(host="0.0.0.0", port=5000, debug=False)
