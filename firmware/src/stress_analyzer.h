#ifndef STRESS_ANALYZER_H
#define STRESS_ANALYZER_H

#include "sensor_manager.h"
#include <vector>
#include <algorithm>

enum StressLevelEnum {
  STRESS_NORMAL = 0,
  STRESS_ALERT = 1,
  STRESS_HIGH = 2
};

struct StressLevel {
  float score;              // 0-100
  StressLevelEnum level;
  bool anomalyDetected;
  String recommendation;
};

struct PersonalBaseline {
  float avgHeartRate;
  float avgHRV;
  float avgSkinTemp;
  float avgGSR;
  bool established;
};

class StressAnalyzer {
private:
  PersonalBaseline baseline;
  std::vector<SensorData> dataHistory;  // Keep last 60 readings
  const int HISTORY_SIZE = 60;
  
  // Analysis thresholds
  const float HR_NORMAL_RANGE = 20.0;      // BPM variance
  const float TEMP_THRESHOLD = 0.5;       // Celsius increase
  const float HRV_THRESHOLD = 5.0;        // ms decrease
  const float GSR_THRESHOLD = 50000.0;    // Ohms increase
  
  // Calculate individual stress scores
  float calculateHeartRateScore(const SensorData& data);
  float calculateHRVScore(const SensorData& data);
  float calculateTemperatureScore(const SensorData& data);
  float calculateGSRScore(const SensorData& data);
  
  // Helper methods
  void updateBaseline(const SensorData& data);
  void detectAnomalies(StressLevel& result);
  String generateRecommendation(const StressLevel& stress);
  
public:
  StressAnalyzer();
  
  // Initialize analyzer
  void begin();
  
  // Analyze stress level
  StressLevel analyzeStress(const SensorData& data);
  
  // Get current baseline
  PersonalBaseline getBaseline() const { return baseline; }
  
  // Reset baseline
  void resetBaseline();
  
  // Get analysis history
  std::vector<SensorData> getHistory() const { return dataHistory; }
};

#endif // STRESS_ANALYZER_H
