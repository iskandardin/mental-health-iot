#ifndef SENSOR_MANAGER_H
#define SENSOR_MANAGER_H

#include <Arduino.h>
#include <Wire.h>
#include <vector>

// MAX30102 I2C address
#define MAX30102_ADDRESS 0x57

// MLX90614 I2C address
#define MLX90614_ADDRESS 0x5A

// GSR Sensor pin (ADC)
#define GSR_PIN 34

// Structure to hold sensor data
struct SensorData {
  float heartRate;           // BPM
  float hrv;                // ms (Heart Rate Variability)
  float skinTemp;           // Celsius
  float gsr;                // Ohms (Galvanic Skin Response)
  float oxygenSaturation;   // %
  unsigned long timestamp;
};

class SensorManager {
private:
  SensorData currentData;
  SensorData previousData;
  std::vector<uint32_t> rPeaks;  // Store R-peaks for HRV calculation
  
  // Sensor read functions
  void readMAX30102();
  void readMLX90614();
  void readGSR();
  
  // HRV calculation
  void calculateHRV();
  
  // Helper functions
  uint16_t readRegister(uint8_t address, uint8_t reg);
  void writeRegister(uint8_t address, uint8_t reg, uint8_t value);
  float readTemperature(uint8_t address);
  
public:
  SensorManager();
  
  // Initialize sensors
  bool begin();
  
  // Read all sensors
  void readAllSensors();
  
  // Get sensor data
  SensorData getLatestData() const { return currentData; }
  SensorData getPreviousData() const { return previousData; }
  
  // Calibration
  void calibrateSensors();
};

#endif // SENSOR_MANAGER_H
