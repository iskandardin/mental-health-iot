#include <Arduino.h>
#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <Wire.h>
#include "sensor_manager.h"
#include "stress_analyzer.h"
#include "wifi_manager.h"

// WiFi Configuration
const char* WIFI_SSID = "YOUR_SSID";
const char* WIFI_PASSWORD = "YOUR_PASSWORD";

// MQTT Configuration
const char* MQTT_SERVER = "YOUR_MQTT_BROKER_IP";
const int MQTT_PORT = 1883;
const char* MQTT_USER = "mqtt_user";
const char* MQTT_PASS = "mqtt_password";
const char* MQTT_TOPIC_PUBLISH = "mindwear/sensors/data";
const char* MQTT_TOPIC_SUBSCRIBE = "mindwear/device/config";

// Global objects
WiFiClient espClient;
PubSubClient mqttClient(espClient);
SensorManager sensorManager;
StressAnalyzer stressAnalyzer;

// Timing
unsigned long lastSensorRead = 0;
const unsigned long SENSOR_READ_INTERVAL = 1000; // 1 second

unsigned long lastMQTTPublish = 0;
const unsigned long MQTT_PUBLISH_INTERVAL = 5000; // 5 seconds

// Device ID
String deviceId = "";

void setupDeviceId() {
  uint64_t chipid = ESP.getEfuseMac();
  deviceId = String((uint32_t)(chipid >> 32), HEX);
  deviceId += String((uint32_t)chipid, HEX);
  Serial.print("Device ID: ");
  Serial.println(deviceId);
}

void setupWiFi() {
  Serial.println("\n\nStarting WiFi connection...");
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nWiFi connected");
    Serial.print("IP address: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\nFailed to connect to WiFi");
  }
}

void reconnectMQTT() {
  while (!mqttClient.connected()) {
    Serial.print("Attempting MQTT connection... ");
    
    if (mqttClient.connect(deviceId.c_str(), MQTT_USER, MQTT_PASS)) {
      Serial.println("connected");
      mqttClient.subscribe(MQTT_TOPIC_SUBSCRIBE);
    } else {
      Serial.print("failed, rc=");
      Serial.print(mqttClient.state());
      Serial.println(" try again in 5 seconds");
      delay(5000);
    }
  }
}

void mqttCallback(char* topic, byte* payload, unsigned int length) {
  Serial.print("Message arrived [")
  Serial.print(topic);
  Serial.print("] ");
  
  // Parse JSON configuration
  DynamicJsonDocument doc(512);
  deserializeJson(doc, payload, length);
  
  if (doc.containsKey("sensorInterval")) {
    // Update sensor reading interval if needed
    Serial.println("Config update received");
  }
}

void publishSensorData() {
  if (millis() - lastMQTTPublish < MQTT_PUBLISH_INTERVAL) {
    return;
  }
  
  SensorData sensorData = sensorManager.getLatestData();
  StressLevel stressLevel = stressAnalyzer.analyzeStress(sensorData);
  
  DynamicJsonDocument doc(512);
  doc["deviceId"] = deviceId;
  doc["timestamp"] = millis();
  doc["sensors"]["heartRate"] = sensorData.heartRate;
  doc["sensors"]["hrv"] = sensorData.hrv;
  doc["sensors"]["skinTemp"] = sensorData.skinTemp;
  doc["sensors"]["gsr"] = sensorData.gsr;
  doc["sensors"]["oxygenSaturation"] = sensorData.oxygenSaturation;
  
  doc["analysis"]["stressScore"] = stressLevel.score;
  doc["analysis"]["stressLevel"] = stressLevel.level;
  doc["analysis"]["anomalyDetected"] = stressLevel.anomalyDetected;
  
  String jsonString;
  serializeJson(doc, jsonString);
  
  if (mqttClient.publish(MQTT_TOPIC_PUBLISH, jsonString.c_str())) {
    Serial.println("Data published successfully");
    lastMQTTPublish = millis();
  } else {
    Serial.println("Failed to publish data");
  }
}

void readSensors() {
  if (millis() - lastSensorRead < SENSOR_READ_INTERVAL) {
    return;
  }
  
  sensorManager.readAllSensors();
  lastSensorRead = millis();
  
  // Log current readings
  SensorData data = sensorManager.getLatestData();
  Serial.print("HR: ");
  Serial.print(data.heartRate);
  Serial.print(" HRV: ");
  Serial.print(data.hrv);
  Serial.print(" Temp: ");
  Serial.print(data.skinTemp);
  Serial.print(" GSR: ");
  Serial.println(data.gsr);
}

void setup() {
  Serial.begin(115200);
  delay(1000);
  
  Serial.println("\n\nStarting MindWear Device");
  
  // Initialize
  setupDeviceId();
  
  // Initialize sensors
  if (!sensorManager.begin()) {
    Serial.println("Failed to initialize sensors!");
    while(1) {
      delay(1000);
    }
  }
  Serial.println("Sensors initialized successfully");
  
  // Initialize stress analyzer
  stressAnalyzer.begin();
  
  // Setup WiFi
  setupWiFi();
  
  // Setup MQTT
  mqttClient.setServer(MQTT_SERVER, MQTT_PORT);
  mqttClient.setCallback(mqttCallback);
  reconnectMQTT();
  
  Serial.println("Setup complete!");
}

void loop() {
  // Reconnect WiFi if needed
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi disconnected. Attempting to reconnect...");
    setupWiFi();
  }
  
  // Reconnect MQTT if needed
  if (!mqttClient.connected()) {
    reconnectMQTT();
  }
  
  // Process MQTT messages
  mqttClient.loop();
  
  // Read sensors
  readSensors();
  
  // Publish data to MQTT
  publishSensorData();
  
  delay(100);
}
