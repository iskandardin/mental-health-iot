const mqtt = require('mqtt');
const logger = require('./logger');
const { firebaseHelpers } = require('./firebase');

let mqttClient = null;

async function initializeMQTT() {
  return new Promise((resolve, reject) => {
    try {
      const brokerUrl = process.env.MQTT_BROKER || 'mqtt://localhost';
      const options = {
        port: process.env.MQTT_PORT || 1883,
        username: process.env.MQTT_USERNAME,
        password: process.env.MQTT_PASSWORD,
        reconnectPeriod: 1000,
        connectTimeout: 30 * 1000,
        clean: true,
        clientId: `mindwear-backend-${Date.now()}`
      };

      mqttClient = mqtt.connect(brokerUrl, options);

      mqttClient.on('connect', () => {
        logger.info('MQTT connected');
        mqttClient.subscribe(process.env.MQTT_TOPIC_SENSOR || 'mindwear/sensors/data', (err) => {
          if (err) {
            logger.error('Failed to subscribe to topic:', err);
          } else {
            logger.info('Subscribed to sensor data topic');
          }
        });
        resolve(mqttClient);
      });

      mqttClient.on('message', handleMQTTMessage);

      mqttClient.on('error', (error) => {
        logger.error('MQTT error:', error);
        reject(error);
      });

      mqttClient.on('disconnect', () => {
        logger.warn('MQTT disconnected');
      });
    } catch (error) {
      logger.error('Failed to initialize MQTT:', error);
      reject(error);
    }
  });
}

async function handleMQTTMessage(topic, message) {
  try {
    const payload = JSON.parse(message.toString());
    logger.debug(`Received MQTT message on ${topic}:`, payload);

    if (topic === (process.env.MQTT_TOPIC_SENSOR || 'mindwear/sensors/data')) {
      // Store sensor data in Firebase
      const deviceId = payload.deviceId;
      
      // Save sensor data
      await firebaseHelpers.saveSensorData(deviceId, {
        heartRate: payload.sensors.heartRate,
        hrv: payload.sensors.hrv,
        skinTemp: payload.sensors.skinTemp,
        gsr: payload.sensors.gsr,
        oxygenSaturation: payload.sensors.oxygenSaturation
      });

      // Save stress analysis if available
      if (payload.analysis) {
        await firebaseHelpers.saveStressAnalysis(deviceId, {
          stressScore: payload.analysis.stressScore,
          stressLevel: payload.analysis.stressLevel,
          anomalyDetected: payload.analysis.anomalyDetected
        });
      }
    }
  } catch (error) {
    logger.error('Error handling MQTT message:', error);
  }
}

function getMQTTClient() {
  if (!mqttClient) {
    throw new Error('MQTT client not initialized');
  }
  return mqttClient;
}

function publishMessage(topic, message) {
  const client = getMQTTClient();
  return new Promise((resolve, reject) => {
    client.publish(topic, JSON.stringify(message), { qos: 1 }, (error) => {
      if (error) {
        logger.error('Failed to publish message:', error);
        reject(error);
      } else {
        logger.debug(`Published message to ${topic}`);
        resolve();
      }
    });
  });
}

module.exports = {
  initializeMQTT,
  getMQTTClient,
  publishMessage
};
