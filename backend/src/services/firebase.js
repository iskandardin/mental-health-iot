const admin = require('firebase-admin');
const logger = require('./logger');
const fs = require('fs');
const path = require('path');

let db = null;

async function initializeFirebase() {
  try {
    const serviceAccountPath = process.env.FIREBASE_ADMIN_SDK_PATH || './firebase-admin-key.json';
    
    // Check if service account file exists
    if (!fs.existsSync(serviceAccountPath)) {
      logger.warn(`Firebase admin SDK key not found at ${serviceAccountPath}. Using default credentials.`);
      admin.initializeApp();
    } else {
      const serviceAccount = require(path.resolve(serviceAccountPath));
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: process.env.FIREBASE_DATABASE_URL
      });
    }
    
    db = admin.database();
    logger.info('Firebase initialized successfully');
    return db;
  } catch (error) {
    logger.error('Firebase initialization error:', error);
    throw error;
  }
}

function getDatabase() {
  if (!db) {
    throw new Error('Firebase database not initialized');
  }
  return db;
}

function getAuth() {
  return admin.auth();
}

function getStorage() {
  return admin.storage();
}

// Database helper functions
const firebaseHelpers = {
  // User operations
  async createUser(userId, userData) {
    const db = getDatabase();
    const ref = db.ref(`users/${userId}`);
    await ref.set({
      ...userData,
      createdAt: admin.database.ServerValue.TIMESTAMP,
      updatedAt: admin.database.ServerValue.TIMESTAMP
    });
    return userData;
  },

  async getUserData(userId) {
    const db = getDatabase();
    const snapshot = await db.ref(`users/${userId}`).once('value');
    return snapshot.val();
  },

  async updateUser(userId, userData) {
    const db = getDatabase();
    const ref = db.ref(`users/${userId}`);
    await ref.update({
      ...userData,
      updatedAt: admin.database.ServerValue.TIMESTAMP
    });
  },

  // Sensor data operations
  async saveSensorData(deviceId, sensorData) {
    const db = getDatabase();
    const ref = db.ref(`sensor_data/${deviceId}`).push();
    await ref.set({
      ...sensorData,
      timestamp: admin.database.ServerValue.TIMESTAMP
    });
    return ref.key;
  },

  async getLatestSensorData(deviceId) {
    const db = getDatabase();
    const snapshot = await db.ref(`sensor_data/${deviceId}`)
      .orderByChild('timestamp')
      .limitToLast(1)
      .once('value');
    
    const data = snapshot.val();
    if (data) {
      return Object.values(data)[0];
    }
    return null;
  },

  async getSensorDataHistory(deviceId, limit = 100) {
    const db = getDatabase();
    const snapshot = await db.ref(`sensor_data/${deviceId}`)
      .orderByChild('timestamp')
      .limitToLast(limit)
      .once('value');
    
    const data = snapshot.val();
    if (data) {
      return Object.values(data).sort((a, b) => a.timestamp - b.timestamp);
    }
    return [];
  },

  // Alert operations
  async createAlert(userId, alertData) {
    const db = getDatabase();
    const ref = db.ref(`alerts/${userId}`).push();
    await ref.set({
      ...alertData,
      createdAt: admin.database.ServerValue.TIMESTAMP,
      read: false
    });
    return { id: ref.key, ...alertData };
  },

  async getAlerts(userId, limit = 50) {
    const db = getDatabase();
    const snapshot = await db.ref(`alerts/${userId}`)
      .orderByChild('createdAt')
      .limitToLast(limit)
      .once('value');
    
    const data = snapshot.val();
    if (data) {
      return Object.entries(data).map(([id, alert]) => ({ id, ...alert }));
    }
    return [];
  },

  async markAlertAsRead(userId, alertId) {
    const db = getDatabase();
    await db.ref(`alerts/${userId}/${alertId}`).update({
      read: true,
      readAt: admin.database.ServerValue.TIMESTAMP
    });
  },

  // Analysis operations
  async saveStressAnalysis(deviceId, analysis) {
    const db = getDatabase();
    const ref = db.ref(`stress_analysis/${deviceId}`).push();
    await ref.set({
      ...analysis,
      timestamp: admin.database.ServerValue.TIMESTAMP
    });
    return ref.key;
  },

  async getLatestStressAnalysis(deviceId) {
    const db = getDatabase();
    const snapshot = await db.ref(`stress_analysis/${deviceId}`)
      .orderByChild('timestamp')
      .limitToLast(1)
      .once('value');
    
    const data = snapshot.val();
    if (data) {
      return Object.values(data)[0];
    }
    return null;
  },

  // Intervention operations
  async logIntervention(userId, intervention) {
    const db = getDatabase();
    const ref = db.ref(`interventions/${userId}`).push();
    await ref.set({
      ...intervention,
      timestamp: admin.database.ServerValue.TIMESTAMP
    });
    return ref.key;
  },

  async getInterventionHistory(userId, limit = 100) {
    const db = getDatabase();
    const snapshot = await db.ref(`interventions/${userId}`)
      .orderByChild('timestamp')
      .limitToLast(limit)
      .once('value');
    
    const data = snapshot.val();
    if (data) {
      return Object.values(data).sort((a, b) => a.timestamp - b.timestamp);
    }
    return [];
  }
};

module.exports = {
  initializeFirebase,
  getDatabase,
  getAuth,
  getStorage,
  firebaseHelpers,
  admin
};
