const express = require('express');
const router = express.Router();
const healthController = require('../controllers/healthController');
const logger = require('../services/logger');

// Get latest sensor data
router.get('/latest', async (req, res, next) => {
  try {
    await healthController.getLatestData(req, res);
  } catch (error) {
    logger.error('Get latest data error:', error);
    next(error);
  }
});

// Submit sensor data
router.post('/data', async (req, res, next) => {
  try {
    await healthController.submitSensorData(req, res);
  } catch (error) {
    logger.error('Submit sensor data error:', error);
    next(error);
  }
});

// Get health history
router.get('/history', async (req, res, next) => {
  try {
    await healthController.getHistory(req, res);
  } catch (error) {
    logger.error('Get history error:', error);
    next(error);
  }
});

// Get health summary
router.get('/summary', async (req, res, next) => {
  try {
    await healthController.getSummary(req, res);
  } catch (error) {
    logger.error('Get summary error:', error);
    next(error);
  }
});

module.exports = router;
