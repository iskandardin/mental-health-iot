const express = require('express');
const router = express.Router();
const alertController = require('../controllers/alertController');
const logger = require('../services/logger');

// Get all alerts
router.get('/', async (req, res, next) => {
  try {
    await alertController.getAlerts(req, res);
  } catch (error) {
    logger.error('Get alerts error:', error);
    next(error);
  }
});

// Get unread alerts
router.get('/unread', async (req, res, next) => {
  try {
    await alertController.getUnreadAlerts(req, res);
  } catch (error) {
    logger.error('Get unread alerts error:', error);
    next(error);
  }
});

// Mark alert as read
router.put('/:alertId/read', async (req, res, next) => {
  try {
    await alertController.markAsRead(req, res);
  } catch (error) {
    logger.error('Mark as read error:', error);
    next(error);
  }
});

// Create custom alert
router.post('/', async (req, res, next) => {
  try {
    await alertController.createAlert(req, res);
  } catch (error) {
    logger.error('Create alert error:', error);
    next(error);
  }
});

// Subscribe to alerts
router.post('/subscribe', async (req, res, next) => {
  try {
    await alertController.subscribeToAlerts(req, res);
  } catch (error) {
    logger.error('Subscribe error:', error);
    next(error);
  }
});

// Get alert preferences
router.get('/preferences', async (req, res, next) => {
  try {
    await alertController.getPreferences(req, res);
  } catch (error) {
    logger.error('Get preferences error:', error);
    next(error);
  }
});

// Update alert preferences
router.put('/preferences', async (req, res, next) => {
  try {
    await alertController.updatePreferences(req, res);
  } catch (error) {
    logger.error('Update preferences error:', error);
    next(error);
  }
});

module.exports = router;
