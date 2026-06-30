const { firebaseHelpers } = require('../services/firebase');
const logger = require('../services/logger');

const healthController = {
  async getLatestData(req, res) {
    try {
      const { deviceId } = req.query;

      if (!deviceId) {
        return res.status(400).json({
          success: false,
          message: 'Device ID is required'
        });
      }

      const data = await firebaseHelpers.getLatestSensorData(deviceId);

      if (!data) {
        return res.status(404).json({
          success: false,
          message: 'No sensor data found'
        });
      }

      res.json({
        success: true,
        data
      });
    } catch (error) {
      logger.error('Get latest data error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve data'
      });
    }
  },

  async submitSensorData(req, res) {
    try {
      const { deviceId, sensors, analysis } = req.body;

      if (!deviceId || !sensors) {
        return res.status(400).json({
          success: false,
          message: 'Device ID and sensor data are required'
        });
      }

      const dataId = await firebaseHelpers.saveSensorData(deviceId, sensors);

      // Emit real-time update
      const io = req.app.get('io');
      if (io) {
        io.to(`device-${deviceId}`).emit('sensor-update', {
          deviceId,
          ...sensors,
          timestamp: new Date().toISOString()
        });
      }

      res.status(201).json({
        success: true,
        message: 'Sensor data saved successfully',
        dataId
      });
    } catch (error) {
      logger.error('Submit sensor data error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to save sensor data'
      });
    }
  },

  async getHistory(req, res) {
    try {
      const { deviceId, limit = 100 } = req.query;

      if (!deviceId) {
        return res.status(400).json({
          success: false,
          message: 'Device ID is required'
        });
      }

      const history = await firebaseHelpers.getSensorDataHistory(deviceId, parseInt(limit));

      res.json({
        success: true,
        data: history,
        count: history.length
      });
    } catch (error) {
      logger.error('Get history error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve history'
      });
    }
  },

  async getSummary(req, res) {
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
          summary: {
            avgHeartRate: 0,
            avgTemp: 0,
            avgHRV: 0,
            avgGSR: 0,
            dataPoints: 0
          }
        });
      }

      const summary = {
        avgHeartRate: (history.reduce((sum, d) => sum + (d.heartRate || 0), 0) / history.length).toFixed(2),
        avgTemp: (history.reduce((sum, d) => sum + (d.skinTemp || 0), 0) / history.length).toFixed(2),
        avgHRV: (history.reduce((sum, d) => sum + (d.hrv || 0), 0) / history.length).toFixed(2),
        avgGSR: (history.reduce((sum, d) => sum + (d.gsr || 0), 0) / history.length).toFixed(2),
        maxHeartRate: Math.max(...history.map(d => d.heartRate || 0)),
        minHeartRate: Math.min(...history.map(d => d.heartRate || 0)),
        dataPoints: history.length
      };

      res.json({
        success: true,
        summary
      });
    } catch (error) {
      logger.error('Get summary error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate summary'
      });
    }
  }
};

module.exports = healthController;
