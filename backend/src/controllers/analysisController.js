const { firebaseHelpers } = require('../services/firebase');
const logger = require('../services/logger');

const analysisController = {
  async getStressLevel(req, res) {
    try {
      const { deviceId } = req.query;

      if (!deviceId) {
        return res.status(400).json({
          success: false,
          message: 'Device ID is required'
        });
      }

      const analysis = await firebaseHelpers.getLatestStressAnalysis(deviceId);

      if (!analysis) {
        return res.status(404).json({
          success: false,
          message: 'No stress analysis data found'
        });
      }

      // Determine stress category
      const stressCategory = analysis.stressScore < 40 ? 'Normal' :
                            analysis.stressScore < 70 ? 'Alert' : 'High';

      res.json({
        success: true,
        data: {
          ...analysis,
          category: stressCategory,
          recommendation: getRecommendation(stressCategory)
        }
      });
    } catch (error) {
      logger.error('Get stress level error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve stress level'
      });
    }
  },

  async getStressTrends(req, res) {
    try {
      const { deviceId, days = 7 } = req.query;

      if (!deviceId) {
        return res.status(400).json({
          success: false,
          message: 'Device ID is required'
        });
      }

      // Get data for the specified period
      const history = await firebaseHelpers.getSensorDataHistory(deviceId, 1000);
      
      if (!history || history.length === 0) {
        return res.json({
          success: true,
          trends: []
        });
      }

      // Group by date and calculate daily averages
      const trends = {};
      history.forEach(data => {
        const date = new Date(data.timestamp).toLocaleDateString();
        if (!trends[date]) {
          trends[date] = {
            heartRate: 0,
            hrv: 0,
            skinTemp: 0,
            gsr: 0,
            count: 0
          };
        }
        trends[date].heartRate += data.heartRate || 0;
        trends[date].hrv += data.hrv || 0;
        trends[date].skinTemp += data.skinTemp || 0;
        trends[date].gsr += data.gsr || 0;
        trends[date].count++;
      });

      // Calculate averages
      Object.keys(trends).forEach(date => {
        const count = trends[date].count;
        trends[date].heartRate = (trends[date].heartRate / count).toFixed(2);
        trends[date].hrv = (trends[date].hrv / count).toFixed(2);
        trends[date].skinTemp = (trends[date].skinTemp / count).toFixed(2);
        trends[date].gsr = (trends[date].gsr / count).toFixed(2);
        delete trends[date].count;
      });

      res.json({
        success: true,
        trends: Object.entries(trends).map(([date, data]) => ({ date, ...data }))
      });
    } catch (error) {
      logger.error('Get stress trends error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve trends'
      });
    }
  },

  async getHealthInsights(req, res) {
    try {
      const { deviceId } = req.query;

      if (!deviceId) {
        return res.status(400).json({
          success: false,
          message: 'Device ID is required'
        });
      }

      const history = await firebaseHelpers.getSensorDataHistory(deviceId, 100);

      if (!history || history.length === 0) {
        return res.json({
          success: true,
          insights: []
        });
      }

      const insights = [];

      // Heart rate analysis
      const avgHR = history.reduce((sum, d) => sum + (d.heartRate || 0), 0) / history.length;
      if (avgHR < 60) {
        insights.push({
          type: 'heart-rate',
          severity: 'info',
          message: 'Your average heart rate is lower than normal. Great for cardiovascular health!'
        });
      } else if (avgHR > 100) {
        insights.push({
          type: 'heart-rate',
          severity: 'warning',
          message: 'Your average heart rate is elevated. Consider stress management techniques.'
        });
      }

      // Temperature analysis
      const avgTemp = history.reduce((sum, d) => sum + (d.skinTemp || 0), 0) / history.length;
      if (avgTemp > 37.5) {
        insights.push({
          type: 'temperature',
          severity: 'warning',
          message: 'Your skin temperature is elevated. Make sure to stay hydrated.'
        });
      }

      // HRV analysis
      const avgHRV = history.reduce((sum, d) => sum + (d.hrv || 0), 0) / history.length;
      if (avgHRV < 10) {
        insights.push({
          type: 'hrv',
          severity: 'warning',
          message: 'Your HRV is low, indicating high stress. Try relaxation exercises.'
        });
      } else if (avgHRV > 30) {
        insights.push({
          type: 'hrv',
          severity: 'success',
          message: 'Your HRV is excellent! You are in good emotional balance.'
        });
      }

      res.json({
        success: true,
        insights
      });
    } catch (error) {
      logger.error('Get health insights error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve insights'
      });
    }
  },

  async getAnomalies(req, res) {
    try {
      const { deviceId, limit = 50 } = req.query;

      if (!deviceId) {
        return res.status(400).json({
          success: false,
          message: 'Device ID is required'
        });
      }

      const history = await firebaseHelpers.getSensorDataHistory(deviceId, parseInt(limit));

      const anomalies = [];
      for (let i = 1; i < history.length; i++) {
        const current = history[i];
        const previous = history[i - 1];

        // Detect sudden heart rate changes
        if (Math.abs(current.heartRate - previous.heartRate) > 20) {
          anomalies.push({
            type: 'sudden-hr-change',
            severity: 'warning',
            value: current.heartRate,
            timestamp: current.timestamp,
            message: `Sudden heart rate change detected: ${Math.abs(current.heartRate - previous.heartRate).toFixed(0)} BPM`
          });
        }

        // Detect sudden temperature changes
        if (Math.abs(current.skinTemp - previous.skinTemp) > 1.0) {
          anomalies.push({
            type: 'sudden-temp-change',
            severity: 'info',
            value: current.skinTemp,
            timestamp: current.timestamp,
            message: `Temperature change detected: ${Math.abs(current.skinTemp - previous.skinTemp).toFixed(1)}°C`
          });
        }

        // Detect sudden GSR changes
        if (Math.abs(current.gsr - previous.gsr) > 200000) {
          anomalies.push({
            type: 'sudden-gsr-change',
            severity: 'warning',
            value: current.gsr,
            timestamp: current.timestamp,
            message: `High skin conductance change detected`
          });
        }
      }

      res.json({
        success: true,
        anomalies: anomalies.slice(-parseInt(limit))
      });
    } catch (error) {
      logger.error('Get anomalies error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve anomalies'
      });
    }
  }
};

function getRecommendation(category) {
  const recommendations = {
    'Normal': 'Your stress levels are normal. Keep maintaining healthy habits!',
    'Alert': 'You might be experiencing some stress. Try a breathing exercise or take a break.',
    'High': 'High stress detected. Consider contacting a healthcare provider or use immediate interventions.'
  };
  return recommendations[category] || '';
}

module.exports = analysisController;
