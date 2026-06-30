const logger = require('./logger');

class RealtimeProcessor {
  constructor(io, mqttClient) {
    this.io = io;
    this.mqttClient = mqttClient;
    this.stressThreshold = parseInt(process.env.STRESS_ALERT_THRESHOLD) || 70;
    this.criticalThreshold = parseInt(process.env.STRESS_CRITICAL_THRESHOLD) || 85;
    this.userConnections = new Map();
  }

  async start() {
    logger.info('Realtime Processor started');
  }

  processSensorData(deviceId, sensorData, analysisData) {
    try {
      // Check for anomalies
      const anomalies = this.detectAnomalies(sensorData);
      if (anomalies.length > 0) {
        this.broadcastAnomalies(deviceId, anomalies);
      }

      // Check stress levels
      if (analysisData && analysisData.stressScore) {
        this.checkStressLevels(deviceId, analysisData);
      }

      // Broadcast to connected clients
      this.io.to(`device-${deviceId}`).emit('sensor-data-update', {
        deviceId,
        ...sensorData,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Error processing sensor data:', error);
    }
  }

  detectAnomalies(sensorData) {
    const anomalies = [];

    // Heart rate anomaly
    if (sensorData.heartRate > 120 || sensorData.heartRate < 40) {
      anomalies.push({
        type: 'abnormal-heart-rate',
        value: sensorData.heartRate,
        severity: 'high'
      });
    }

    // Temperature anomaly
    if (sensorData.skinTemp > 38.5 || sensorData.skinTemp < 35) {
      anomalies.push({
        type: 'abnormal-temperature',
        value: sensorData.skinTemp,
        severity: 'high'
      });
    }

    // Low oxygen saturation
    if (sensorData.oxygenSaturation < 90) {
      anomalies.push({
        type: 'low-oxygen',
        value: sensorData.oxygenSaturation,
        severity: 'critical'
      });
    }

    return anomalies;
  }

  checkStressLevels(deviceId, analysisData) {
    const { stressScore, stressLevel } = analysisData;

    if (stressScore >= this.criticalThreshold) {
      this.broadcastAlert(deviceId, {
        type: 'critical-stress',
        message: 'Critical stress level detected. Please consider immediate intervention.',
        severity: 'critical',
        score: stressScore
      });
    } else if (stressScore >= this.stressThreshold) {
      this.broadcastAlert(deviceId, {
        type: 'high-stress',
        message: 'High stress detected. Consider a relaxation intervention.',
        severity: 'warning',
        score: stressScore
      });
    }
  }

  broadcastAnomalies(deviceId, anomalies) {
    this.io.to(`device-${deviceId}`).emit('anomaly-detected', {
      deviceId,
      anomalies,
      timestamp: new Date().toISOString()
    });
  }

  broadcastAlert(deviceId, alertData) {
    this.io.to(`device-${deviceId}`).emit('stress-alert', {
      deviceId,
      ...alertData,
      timestamp: new Date().toISOString()
    });
  }

  registerUserConnection(userId, socketId) {
    if (!this.userConnections.has(userId)) {
      this.userConnections.set(userId, []);
    }
    this.userConnections.get(userId).push(socketId);
    logger.debug(`Registered connection for user ${userId}`);
  }

  removeUserConnection(userId, socketId) {
    if (this.userConnections.has(userId)) {
      const connections = this.userConnections.get(userId);
      const index = connections.indexOf(socketId);
      if (index > -1) {
        connections.splice(index, 1);
      }
      if (connections.length === 0) {
        this.userConnections.delete(userId);
      }
    }
  }

  getUserConnections(userId) {
    return this.userConnections.get(userId) || [];
  }
}

module.exports = RealtimeProcessor;
