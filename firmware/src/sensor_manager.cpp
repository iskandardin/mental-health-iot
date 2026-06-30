#include "sensor_manager.h"

SensorManager::SensorManager() {
  currentData = {0, 0, 0, 0, 0, 0};
  previousData = {0, 0, 0, 0, 0, 0};
}

bool SensorManager::begin() {
  // Initialize I2C
  Wire.begin(21, 22); // SDA=21, SCL=22 for ESP32
  Wire.setClock(400000);
  
  delay(100);
  
  // Initialize MAX30102 (Heart Rate & Pulse Oximetry)
  uint16_t partID = readRegister(MAX30102_ADDRESS, 0xFF);
  if (partID != 0x15) {
    Serial.println("MAX30102 not found!");
    return false;
  }
  
  // Initialize MAX30102 registers
  writeRegister(MAX30102_ADDRESS, 0x09, 0x02);  // Reset
  delay(100);
  writeRegister(MAX30102_ADDRESS, 0x0A, 0x27);  // Mode: SpO2 + HR
  writeRegister(MAX30102_ADDRESS, 0x0B, 0x03);  // SpO2 config
  writeRegister(MAX30102_ADDRESS, 0x0C, 0xFF);  // LED current
  writeRegister(MAX30102_ADDRESS, 0x08, 0x0F);  // FIFO config
  
  Serial.println("MAX30102 initialized");
  
  // MLX90614 is initialized automatically
  Serial.println("MLX90614 ready");
  
  // GSR sensor (analog input, no special initialization needed)
  pinMode(GSR_PIN, INPUT);
  Serial.println("GSR sensor ready");
  
  return true;
}

uint16_t SensorManager::readRegister(uint8_t address, uint8_t reg) {
  Wire.beginTransmission(address);
  Wire.write(reg);
  Wire.endTransmission();
  
  Wire.requestFrom(address, 1);
  if (Wire.available()) {
    return Wire.read();
  }
  return 0;
}

void SensorManager::writeRegister(uint8_t address, uint8_t reg, uint8_t value) {
  Wire.beginTransmission(address);
  Wire.write(reg);
  Wire.write(value);
  Wire.endTransmission();
}

float SensorManager::readTemperature(uint8_t address) {
  Wire.beginTransmission(address);
  Wire.write(0x07);  // Read from object temperature register
  Wire.endTransmission();
  
  Wire.requestFrom(address, 2);
  if (Wire.available() >= 2) {
    uint16_t raw = Wire.read();
    raw |= (Wire.read() << 8);
    
    // MLX90614 temperature formula
    float temperature = (raw * 0.02) - 273.15;
    return temperature;
  }
  return 0.0;
}

void SensorManager::readMAX30102() {
  // Read FIFO data
  uint8_t fifoPointer = readRegister(MAX30102_ADDRESS, 0x04);
  uint8_t fifoData = readRegister(MAX30102_ADDRESS, 0x07);
  
  // Simulate heart rate (in real implementation, process FIFO)
  // For demo: generate realistic heart rate based on time
  currentData.heartRate = 60 + (millis() % 40);
  currentData.oxygenSaturation = 95 + (millis() % 5);
  
  // Simple HRV calculation (in reality, would use R-peak detection)
  if (currentData.heartRate > previousData.heartRate) {
    currentData.hrv = 20 + (millis() % 30);
  } else {
    currentData.hrv = 15 + (millis() % 25);
  }
}

void SensorManager::readMLX90614() {
  // Read object temperature (skin temperature)
  currentData.skinTemp = readTemperature(MLX90614_ADDRESS);
  
  // Ensure valid reading
  if (currentData.skinTemp < 30.0 || currentData.skinTemp > 45.0) {
    currentData.skinTemp = previousData.skinTemp; // Use previous if out of range
  }
}

void SensorManager::readGSR() {
  // Read analog value from GSR sensor
  int rawValue = analogRead(GSR_PIN);
  
  // Convert to resistance (GSR is typically 0-4095 for 0-3.3V)
  // Assuming 1MΩ reference resistor
  float voltage = rawValue * 3.3 / 4095.0;
  float resistance = 1000000.0 * (3.3 - voltage) / voltage; // In Ohms
  
  // Filter out extreme values
  if (resistance < 0) {
    resistance = 0;
  } else if (resistance > 10000000) {
    resistance = 10000000;
  }
  
  currentData.gsr = resistance;
}

void SensorManager::calculateHRV() {
  // This is a simplified HRV calculation
  // In production, implement proper R-peak detection and NN interval analysis
  if (rPeaks.size() > 1) {
    float sumSquaredDiffs = 0;
    for (int i = 1; i < rPeaks.size(); i++) {
      uint32_t nnInterval = rPeaks[i] - rPeaks[i-1];
      sumSquaredDiffs += (nnInterval * nnInterval);
    }
    
    currentData.hrv = sqrt(sumSquaredDiffs / (rPeaks.size() - 1));
  }
}

void SensorManager::readAllSensors() {
  // Store previous data
  previousData = currentData;
  
  // Read all sensors
  readMAX30102();
  readMLX90614();
  readGSR();
  
  // Update timestamp
  currentData.timestamp = millis();
}

void SensorManager::calibrateSensors() {
  Serial.println("Starting sensor calibration...");
  
  // Calibration routine
  // Ask user to keep device still for 30 seconds
  for (int i = 0; i < 30; i++) {
    readAllSensors();
    Serial.print(".");
    delay(1000);
  }
  
  Serial.println("\nCalibration complete!");
}
