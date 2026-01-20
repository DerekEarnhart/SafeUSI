/*
 * ESP32 Simple Test Firmware
 * Easy setup for testing the harmonic sensor system
 * 
 * Hardware needed:
 * - ESP32 board
 * - Optional: DHT22 sensor (pin 4)
 * - Optional: LDR light sensor (pin 34)
 * - Optional: PIR motion sensor (pin 2)
 * 
 * If you don't have sensors, it will generate simulated data
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// ===== CONFIGURATION =====
// Update these with your WiFi details
const char* ssid = "YOUR_WIFI_NAME";
const char* password = "YOUR_WIFI_PASSWORD";

// Update this with your computer's IP address
// Find it by running: ipconfig (Windows) or ifconfig (Mac/Linux)
const char* serverURL = "http://192.168.1.100:5000/ingest";  // Change IP here

// ===== SENSOR PINS =====
#define DHT_PIN 4
#define LDR_PIN 34
#define PIR_PIN 2
#define LED_PIN 5

// ===== TIMING =====
const unsigned long SEND_INTERVAL = 10000;  // Send data every 10 seconds
unsigned long lastSend = 0;

// ===== VARIABLES =====
bool wifiConnected = false;
int sendCount = 0;

void setup() {
  Serial.begin(115200);
  Serial.println();
  Serial.println("ESP32 Harmonic Sensor - Simple Test");
  Serial.println("===================================");
  
  // Initialize pins
  pinMode(LED_PIN, OUTPUT);
  pinMode(PIR_PIN, INPUT);
  pinMode(LDR_PIN, INPUT);
  
  // Connect to WiFi
  connectToWiFi();
  
  Serial.println("Setup complete!");
  blinkLED(3, 200);  // 3 blinks = ready
}

void loop() {
  // Check WiFi connection
  if (WiFi.status() != WL_CONNECTED) {
    if (millis() - lastSend > 30000) {  // Retry every 30 seconds
      connectToWiFi();
      lastSend = millis();
    }
    return;
  }
  
  // Send data at intervals
  if (millis() - lastSend >= SEND_INTERVAL) {
    sendSensorData();
    lastSend = millis();
  }
  
  delay(100);
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
    Serial.print("Server URL: ");
    Serial.println(serverURL);
    blinkLED(2, 500);  // 2 long blinks = WiFi connected
  } else {
    wifiConnected = false;
    Serial.println();
    Serial.println("WiFi connection failed");
    blinkLED(5, 100);  // 5 quick blinks = WiFi failed
  }
}

void sendSensorData() {
  if (!wifiConnected) {
    Serial.println("Cannot send: WiFi not connected");
    return;
  }
  
  HTTPClient http;
  http.begin(serverURL);
  http.addHeader("Content-Type", "application/json");
  
  // Create sensor data
  DynamicJsonDocument doc(1024);
  doc["device_id"] = "esp32_test";
  doc["send_count"] = sendCount;
  
  // Read sensors (or generate simulated data if sensors not available)
  float temperature = readTemperature();
  float humidity = readHumidity();
  float pressure = readPressure();
  int light = readLight();
  bool motion = readMotion();
  
  doc["temperature"] = temperature;
  doc["humidity"] = humidity;
  doc["pressure"] = pressure;
  doc["light"] = light;
  doc["motion"] = motion;
  doc["sound_level"] = random(30, 80);  // Simulated
  doc["vibration"] = random(0, 100) / 1000.0;  // Simulated
  doc["magnetic_field"] = random(20, 30);  // Simulated
  
  String jsonString;
  serializeJson(doc, jsonString);
  
  Serial.println("Sending data...");
  Serial.println(jsonString);
  
  int httpResponseCode = http.POST(jsonString);
  
  if (httpResponseCode > 0) {
    String response = http.getString();
    Serial.print("HTTP Response Code: ");
    Serial.println(httpResponseCode);
    Serial.print("Response: ");
    Serial.println(response);
    
    if (httpResponseCode == 200) {
      sendCount++;
      Serial.println("Data sent successfully!");
      blinkLED(1, 1000);  // 1 long blink = success
      
      // Parse response for Weyl state
      parseResponse(response);
    } else {
      Serial.println("Send failed");
    }
  } else {
    Serial.print("HTTP Error: ");
    Serial.println(httpResponseCode);
  }
  
  http.end();
}

void parseResponse(String response) {
  DynamicJsonDocument doc(1024);
  deserializeJson(doc, response);
  
  if (doc["ok"]) {
    String weylState = doc["weyl_state"];
    Serial.print("Weyl State: ");
    Serial.println(weylState);
    
    // Visual feedback based on Weyl state
    if (weylState == "stable") {
      blinkLED(1, 200);  // 1 short blink
    } else if (weylState == "oscillating") {
      blinkLED(2, 200);  // 2 short blinks
    } else if (weylState == "chaotic") {
      blinkLED(3, 200);  // 3 short blinks
    }
  }
}

// ===== SENSOR READING FUNCTIONS =====

float readTemperature() {
  // If you have a DHT22 sensor connected to pin 4, uncomment this:
  // return dht.readTemperature();
  
  // Otherwise, generate simulated temperature
  return 20 + random(-50, 100) / 10.0;  // 15-30°C
}

float readHumidity() {
  // If you have a DHT22 sensor connected to pin 4, uncomment this:
  // return dht.readHumidity();
  
  // Otherwise, generate simulated humidity
  return 40 + random(-20, 40);  // 20-80%
}

float readPressure() {
  // If you have a BMP280 sensor, uncomment this:
  // return bmp.readPressure() / 100.0;
  
  // Otherwise, generate simulated pressure
  return 1013 + random(-20, 20);  // 993-1033 hPa
}

int readLight() {
  // Read LDR sensor on pin 34
  int lightValue = analogRead(LDR_PIN);
  
  // If no LDR connected, generate simulated light
  if (lightValue < 10) {
    return random(100, 1000);
  }
  
  return lightValue;
}

bool readMotion() {
  // Read PIR sensor on pin 2
  return digitalRead(PIR_PIN) == HIGH;
}

void blinkLED(int times, int duration) {
  for (int i = 0; i < times; i++) {
    digitalWrite(LED_PIN, HIGH);
    delay(duration);
    digitalWrite(LED_PIN, LOW);
    delay(duration);
  }
}

// ===== UTILITY FUNCTIONS =====

void printSystemInfo() {
  Serial.println("=== System Info ===");
  Serial.print("WiFi Status: ");
  Serial.println(wifiConnected ? "Connected" : "Disconnected");
  Serial.print("Send Count: ");
  Serial.println(sendCount);
  Serial.print("Free Heap: ");
  Serial.println(ESP.getFreeHeap());
  Serial.print("Uptime: ");
  Serial.println(millis() / 1000);
  Serial.println("==================");
}

