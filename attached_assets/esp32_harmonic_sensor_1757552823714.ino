/*
 * ESP32 Harmonic Sensor Firmware
 * Integrates with Harmonic Unification Framework (HUF) and Weyl State Machine (WSM)
 * 
 * This firmware collects sensor data and transmits it to the harmonic analysis server
 * for real-time pattern recognition and Weyl state classification.
 * 
 * Hardware Requirements:
 * - ESP32 development board
 * - DHT22 temperature/humidity sensor
 * - BMP280 pressure sensor
 * - LDR light sensor
 * - PIR motion sensor
 * - Optional: Additional sensors for extended harmonic analysis
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <DHT.h>
#include <Wire.h>
#include <Adafruit_BMP280.h>
#include <EEPROM.h>

// WiFi Configuration
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// Server Configuration
const char* serverURL = "http://192.168.1.100:5000/ingest";  // Update with your server IP
const char* deviceID = "esp32_harmonic_001";

// Sensor Pins
#define DHT_PIN 4
#define DHT_TYPE DHT22
#define LDR_PIN 34
#define PIR_PIN 2
#define LED_PIN 5

// Sensor Objects
DHT dht(DHT_PIN, DHT_TYPE);
Adafruit_BMP280 bmp;

// Timing Configuration
const unsigned long SENSOR_INTERVAL = 5000;  // 5 seconds between readings
const unsigned long TRANSMIT_INTERVAL = 30000;  // 30 seconds between transmissions
const unsigned long WIFI_RETRY_INTERVAL = 30000;  // 30 seconds between WiFi retries

// Global Variables
unsigned long lastSensorRead = 0;
unsigned long lastTransmit = 0;
unsigned long lastWiFiRetry = 0;
bool wifiConnected = false;
int transmissionCount = 0;
int failedTransmissions = 0;

// Sensor Data Structure
struct SensorData {
  float temperature;
  float humidity;
  float pressure;
  int light;
  bool motion;
  float soundLevel;
  float vibration;
  float magneticField;
  unsigned long timestamp;
  int deviceID;
};

SensorData currentData;

void setup() {
  Serial.begin(115200);
  Serial.println("ESP32 Harmonic Sensor Starting...");
  Serial.println("Framework: Harmonic Unification Framework (HUF)");
  Serial.println("State Machine: Weyl State Machine (WSM)");
  
  // Initialize pins
  pinMode(LED_PIN, OUTPUT);
  pinMode(PIR_PIN, INPUT);
  pinMode(LDR_PIN, INPUT);
  
  // Initialize sensors
  initializeSensors();
  
  // Connect to WiFi
  connectToWiFi();
  
  // Initialize EEPROM for persistent storage
  EEPROM.begin(512);
  
  Serial.println("ESP32 Harmonic Sensor Ready!");
  blinkLED(3, 200);  // 3 quick blinks to indicate ready
}

void loop() {
  unsigned long currentTime = millis();
  
  // Read sensors at regular intervals
  if (currentTime - lastSensorRead >= SENSOR_INTERVAL) {
    readAllSensors();
    lastSensorRead = currentTime;
    
    // Display current readings
    displaySensorData();
  }
  
  // Transmit data at regular intervals
  if (currentTime - lastTransmit >= TRANSMIT_INTERVAL) {
    if (wifiConnected) {
      transmitSensorData();
    } else {
      Serial.println("WiFi not connected, storing data locally");
      storeDataLocally();
    }
    lastTransmit = currentTime;
  }
  
  // Retry WiFi connection if needed
  if (!wifiConnected && currentTime - lastWiFiRetry >= WIFI_RETRY_INTERVAL) {
    connectToWiFi();
    lastWiFiRetry = currentTime;
  }
  
  // Handle motion detection
  handleMotionDetection();
  
  delay(100);  // Small delay to prevent watchdog issues
}

void initializeSensors() {
  Serial.println("Initializing sensors...");
  
  // Initialize DHT22
  dht.begin();
  Serial.println("DHT22 initialized");
  
  // Initialize BMP280
  if (bmp.begin(0x76)) {  // Try different I2C address if needed
    Serial.println("BMP280 initialized");
  } else {
    Serial.println("BMP280 initialization failed");
  }
  
  // Initialize EEPROM
  EEPROM.begin(512);
  
  Serial.println("All sensors initialized");
}

void connectToWiFi() {
  Serial.print("Connecting to WiFi: ");
  Serial.println(ssid);
  
  WiFi.begin(ssid, password);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    wifiConnected = true;
    Serial.println();
    Serial.println("WiFi connected!");
    Serial.print("IP address: ");
    Serial.println(WiFi.localIP());
    blinkLED(2, 500);  // 2 long blinks for WiFi connected
  } else {
    wifiConnected = false;
    Serial.println();
    Serial.println("WiFi connection failed");
    blinkLED(5, 100);  // 5 quick blinks for WiFi failed
  }
}

void readAllSensors() {
  // Read temperature and humidity
  currentData.temperature = dht.readTemperature();
  currentData.humidity = dht.readHumidity();
  
  // Read pressure
  currentData.pressure = bmp.readPressure() / 100.0;  // Convert to hPa
  
  // Read light level (0-4095 for ESP32 ADC)
  currentData.light = analogRead(LDR_PIN);
  
  // Read motion
  currentData.motion = digitalRead(PIR_PIN) == HIGH;
  
  // Simulate additional sensors (replace with actual sensors if available)
  currentData.soundLevel = random(30, 80);  // Simulated sound level
  currentData.vibration = random(0, 100) / 1000.0;  // Simulated vibration
  currentData.magneticField = random(20, 30);  // Simulated magnetic field
  
  // Set timestamp
  currentData.timestamp = millis();
  currentData.deviceID = 1;  // Device identifier
  
  // Validate sensor readings
  if (isnan(currentData.temperature) || isnan(currentData.humidity)) {
    Serial.println("DHT sensor read failed");
    currentData.temperature = 0;
    currentData.humidity = 0;
  }
  
  if (isnan(currentData.pressure)) {
    Serial.println("BMP280 sensor read failed");
    currentData.pressure = 0;
  }
}

void displaySensorData() {
  Serial.println("=== Sensor Readings ===");
  Serial.print("Temperature: ");
  Serial.print(currentData.temperature);
  Serial.println(" °C");
  
  Serial.print("Humidity: ");
  Serial.print(currentData.humidity);
  Serial.println(" %");
  
  Serial.print("Pressure: ");
  Serial.print(currentData.pressure);
  Serial.println(" hPa");
  
  Serial.print("Light: ");
  Serial.println(currentData.light);
  
  Serial.print("Motion: ");
  Serial.println(currentData.motion ? "Detected" : "None");
  
  Serial.print("Sound Level: ");
  Serial.print(currentData.soundLevel);
  Serial.println(" dB");
  
  Serial.print("Vibration: ");
  Serial.print(currentData.vibration);
  Serial.println(" g");
  
  Serial.print("Magnetic Field: ");
  Serial.print(currentData.magneticField);
  Serial.println(" µT");
  
  Serial.println("=======================");
}

void transmitSensorData() {
  if (!wifiConnected) {
    Serial.println("Cannot transmit: WiFi not connected");
    return;
  }
  
  HTTPClient http;
  http.begin(serverURL);
  http.addHeader("Content-Type", "application/json");
  
  // Create JSON payload
  DynamicJsonDocument doc(1024);
  doc["device_id"] = deviceID;
  doc["temperature"] = currentData.temperature;
  doc["humidity"] = currentData.humidity;
  doc["pressure"] = currentData.pressure;
  doc["light"] = currentData.light;
  doc["motion"] = currentData.motion;
  doc["sound_level"] = currentData.soundLevel;
  doc["vibration"] = currentData.vibration;
  doc["magnetic_field"] = currentData.magneticField;
  doc["timestamp"] = currentData.timestamp;
  doc["transmission_count"] = transmissionCount;
  
  String jsonString;
  serializeJson(doc, jsonString);
  
  Serial.println("Transmitting data...");
  Serial.println(jsonString);
  
  int httpResponseCode = http.POST(jsonString);
  
  if (httpResponseCode > 0) {
    String response = http.getString();
    Serial.print("HTTP Response Code: ");
    Serial.println(httpResponseCode);
    Serial.print("Response: ");
    Serial.println(response);
    
    if (httpResponseCode == 200) {
      transmissionCount++;
      failedTransmissions = 0;
      Serial.println("Data transmitted successfully!");
      blinkLED(1, 1000);  // 1 long blink for successful transmission
      
      // Parse response for harmonic analysis
      parseHarmonicResponse(response);
    } else {
      failedTransmissions++;
      Serial.println("Transmission failed");
    }
  } else {
    failedTransmissions++;
    Serial.print("HTTP Error: ");
    Serial.println(httpResponseCode);
  }
  
  http.end();
}

void parseHarmonicResponse(String response) {
  DynamicJsonDocument doc(1024);
  deserializeJson(doc, response);
  
  if (doc["ok"]) {
    JsonObject harmonic = doc["harmonic_analysis"];
    String weylState = doc["weyl_state"];
    
    Serial.println("=== Harmonic Analysis ===");
    Serial.print("Weyl State: ");
    Serial.println(weylState);
    Serial.print("Harmonic Frequency: ");
    Serial.println(harmonic["harmonic_frequency"]);
    Serial.print("Amplitude Modulation: ");
    Serial.println(harmonic["amplitude_modulation"]);
    Serial.print("Phase Coherence: ");
    Serial.println(harmonic["phase_coherence"]);
    Serial.print("Quantum Resonance: ");
    Serial.println(harmonic["quantum_resonance"]);
    Serial.println("=========================");
    
    // Visual feedback based on Weyl state
    if (weylState == "stable") {
      blinkLED(1, 200);  // 1 short blink for stable
    } else if (weylState == "oscillating") {
      blinkLED(2, 200);  // 2 short blinks for oscillating
    } else if (weylState == "chaotic") {
      blinkLED(3, 200);  // 3 short blinks for chaotic
    }
  }
}

void storeDataLocally() {
  // Store data in EEPROM when WiFi is not available
  Serial.println("Storing data locally in EEPROM");
  
  int address = (transmissionCount % 10) * 50;  // Store last 10 readings
  
  EEPROM.put(address, currentData);
  EEPROM.commit();
  
  Serial.println("Data stored locally");
}

void handleMotionDetection() {
  static bool lastMotionState = false;
  bool currentMotionState = currentData.motion;
  
  if (currentMotionState != lastMotionState) {
    if (currentMotionState) {
      Serial.println("Motion detected!");
      blinkLED(1, 100);  // Quick blink for motion
    } else {
      Serial.println("Motion ended");
    }
    lastMotionState = currentMotionState;
  }
}

void blinkLED(int times, int duration) {
  for (int i = 0; i < times; i++) {
    digitalWrite(LED_PIN, HIGH);
    delay(duration);
    digitalWrite(LED_PIN, LOW);
    delay(duration);
  }
}

// Additional utility functions for extended sensor integration
void calibrateSensors() {
  Serial.println("Calibrating sensors...");
  
  // Calibrate light sensor
  int lightReadings[10];
  for (int i = 0; i < 10; i++) {
    lightReadings[i] = analogRead(LDR_PIN);
    delay(100);
  }
  
  int avgLight = 0;
  for (int i = 0; i < 10; i++) {
    avgLight += lightReadings[i];
  }
  avgLight /= 10;
  
  Serial.print("Average light reading: ");
  Serial.println(avgLight);
  
  Serial.println("Sensor calibration complete");
}

void printSystemStatus() {
  Serial.println("=== System Status ===");
  Serial.print("WiFi Status: ");
  Serial.println(wifiConnected ? "Connected" : "Disconnected");
  Serial.print("Transmissions: ");
  Serial.println(transmissionCount);
  Serial.print("Failed Transmissions: ");
  Serial.println(failedTransmissions);
  Serial.print("Free Heap: ");
  Serial.println(ESP.getFreeHeap());
  Serial.print("Uptime: ");
  Serial.println(millis() / 1000);
  Serial.println("====================");
}
