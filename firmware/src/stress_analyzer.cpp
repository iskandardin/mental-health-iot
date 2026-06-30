#include "stress_analyzer.h"

StressAnalyzer::StressAnalyzer() {
  baseline = {60.0, 20.0, 36.5, 100000.0, false};
}

void StressAnalyzer::begin() {
  Serial.println("Stress Analyzer initialized");
}

float StressAnalyzer::calculateHeartRateScore(const SensorData& data) {
  if (!baseline.established) {
    return 0.0;
  }
  
  float deviation = abs(data.heartRate - baseline.avgHeartRate);
  float score = (deviation / HR_NORMAL_RANGE) * 100.0;
  
  // Cap at 100
  return min(100.0f, score);
}

float StressAnalyzer::calculateHRVScore(const SensorData& data) {
  if (!baseline.established) {
    return 0.0;
  }
  
  // Lower HRV indicates higher stress
  float deviation = baseline.avgHRV - data.hrv;
  float score = (deviation / HRV_THRESHOLD) * 100.0;
  
  return min(100.0f, max(0.0f, score));
}

float StressAnalyzer::calculateTemperatureScore(const SensorData& data) {
  if (!baseline.established) {
    return 0.0;
  }
  
  float deviation = data.skinTemp - baseline.avgSkinTemp;
  float score = (deviation / TEMP_THRESHOLD) * 100.0;
  
  return min(100.0f, max(0.0f, score));
}

float StressAnalyzer::calculateGSRScore(const SensorData& data) {
  if (!baseline.established) {
    return 0.0;
  }
  
  float deviation = data.gsr - baseline.avgGSR;
  float score = (deviation / GSR_THRESHOLD) * 100.0;
  
  return min(100.0f, max(0.0f, score));
}

void StressAnalyzer::updateBaseline(const SensorData& data) {
  // Exponential moving average for baseline
  float alpha = 0.1; // Smoothing factor
  
  if (!baseline.established) {
    baseline.avgHeartRate = data.heartRate;
    baseline.avgHRV = data.hrv;
    baseline.avgSkinTemp = data.skinTemp;
    baseline.avgGSR = data.gsr;
    
    if (dataHistory.size() > 30) {
      baseline.established = true;
    }
  } else {
    baseline.avgHeartRate = alpha * data.heartRate + (1 - alpha) * baseline.avgHeartRate;
    baseline.avgHRV = alpha * data.hrv + (1 - alpha) * baseline.avgHRV;
    baseline.avgSkinTemp = alpha * data.skinTemp + (1 - alpha) * baseline.avgSkinTemp;
    baseline.avgGSR = alpha * data.gsr + (1 - alpha) * baseline.avgGSR;
  }
}

void StressAnalyzer::detectAnomalies(StressLevel& result) {
  if (dataHistory.size() < 2) {
    result.anomalyDetected = false;
    return;
  }
  
  SensorData current = dataHistory.back();
  SensorData previous = dataHistory[dataHistory.size() - 2];
  
  // Detect sudden changes
  bool hrChange = abs(current.heartRate - previous.heartRate) > 20;
  bool gsrChange = abs(current.gsr - previous.gsr) > 200000;
  bool tempChange = abs(current.skinTemp - previous.skinTemp) > 1.0;
  
  result.anomalyDetected = (hrChange || gsrChange || tempChange);
}

String StressAnalyzer::generateRecommendation(const StressLevel& stress) {
  if (stress.level == STRESS_NORMAL) {
    return "Your stress levels are normal. Keep up the healthy habits!";
  } else if (stress.level == STRESS_ALERT) {
    return "You might be experiencing some stress. Try a quick breathing exercise or take a short break.";
  } else {
    return "High stress detected. Consider contacting a healthcare provider or using immediate interventions.";
  }
}

StressLevel StressAnalyzer::analyzeStress(const SensorData& data) {
  StressLevel result;
  
  // Add to history
  dataHistory.push_back(data);
  if (dataHistory.size() > HISTORY_SIZE) {
    dataHistory.erase(dataHistory.begin());
  }
  
  // Update baseline
  updateBaseline(data);
  
  // Calculate stress scores
  float hrScore = calculateHeartRateScore(data);
  float hrvScore = calculateHRVScore(data);
  float tempScore = calculateTemperatureScore(data);
  float gsrScore = calculateGSRScore(data);
  
  // Weighted average (HRV and GSR are more indicative)
  result.score = (hrScore * 0.2 + hrvScore * 0.3 + tempScore * 0.2 + gsrScore * 0.3);
  
  // Determine stress level
  if (result.score < 40) {
    result.level = STRESS_NORMAL;
  } else if (result.score < 70) {
    result.level = STRESS_ALERT;
  } else {
    result.level = STRESS_HIGH;
  }
  
  // Detect anomalies
  detectAnomalies(result);
  
  // Generate recommendation
  result.recommendation = generateRecommendation(result);
  
  return result;
}

void StressAnalyzer::resetBaseline() {
  baseline = {60.0, 20.0, 36.5, 100000.0, false};
  dataHistory.clear();
  Serial.println("Baseline reset");
}
