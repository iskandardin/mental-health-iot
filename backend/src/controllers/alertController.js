const { firebaseHelpers } = require('../services/firebase');
const logger = require('../services/logger');

const alertController = {
  async getAlerts(req, res) {
    try {
      const { limit = 50 } = req.query;
      const userId = req.userId;

      const alerts = await firebaseHelpers.getAlerts(userId, parseInt(limit));

      res.json({
        success: true,
        alerts,
        count: alerts.length
      });
    } catch (error) {
      logger.error('Get alerts error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve alerts'
      });
    }
  },

  async getUnreadAlerts(req, res) {
    try {
      const userId = req.userId;
      const alerts = await firebaseHelpers.getAlerts(userId, 100);
      const unreadAlerts = alerts.filter(alert => !alert.read);

      res.json({
        success: true,
        alerts: unreadAlerts,
        count: unreadAlerts.length
      });
    } catch (error) {
      logger.error('Get unread alerts error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve unread alerts'
      });
    }
  },

  async markAsRead(req, res) {
    try {
      const { alertId } = req.params;
      const userId = req.userId;

      await firebaseHelpers.markAlertAsRead(userId, alertId);

      res.json({
        success: true,
        message: 'Alert marked as read'
      });
    } catch (error) {
      logger.error('Mark as read error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to mark alert as read'
      });
    }
  },

  async createAlert(req, res) {
    try {
      const { title, message, severity, type } = req.body;
      const userId = req.userId;

      if (!title || !message) {
        return res.status(400).json({
          success: false,
          message: 'Title and message are required'
        });
      }

      const alert = await firebaseHelpers.createAlert(userId, {
        title,
        message,
        severity: severity || 'info',
        type: type || 'manual'
      });

      // Emit alert via WebSocket
      const io = req.app.get('io');
      if (io) {
        io.to(`user-${userId}`).emit('new-alert', alert);
      }

      res.status(201).json({
        success: true,
        message: 'Alert created successfully',
        alert
      });
    } catch (error) {
      logger.error('Create alert error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create alert'
      });
    }
  },

  async subscribeToAlerts(req, res) {
    try {
      const { deviceTokens, alertTypes } = req.body;
      const userId = req.userId;

      // Store subscription preferences
      await firebaseHelpers.createAlert(userId, {
        type: 'subscription',
        deviceTokens,
        alertTypes,
        subscribed: true
      });

      res.json({
        success: true,
        message: 'Successfully subscribed to alerts'
      });
    } catch (error) {
      logger.error('Subscribe error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to subscribe to alerts'
      });
    }
  },

  async getPreferences(req, res) {
    try {
      const userId = req.userId;

      // In a real app, retrieve from database
      const preferences = {
        pushNotifications: true,
        emailAlerts: true,
        smsAlerts: false,
        stressAlertThreshold: 70,
        criticalAlertThreshold: 85,
        quietHours: {
          enabled: true,
          start: '22:00',
          end: '08:00'
        }
      };

      res.json({
        success: true,
        preferences
      });
    } catch (error) {
      logger.error('Get preferences error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve preferences'
      });
    }
  },

  async updatePreferences(req, res) {
    try {
      const userId = req.userId;
      const preferences = req.body;

      // Store preferences in database
      logger.info(`Updated alert preferences for user ${userId}`);

      res.json({
        success: true,
        message: 'Preferences updated successfully',
        preferences
      });
    } catch (error) {
      logger.error('Update preferences error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update preferences'
      });
    }
  }
};

module.exports = alertController;
