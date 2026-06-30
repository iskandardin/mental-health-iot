const express = require('express');
const router = express.Router();
const analysisController = require('../controllers/analysisController');
const logger = require('../services/logger');

// Get stress level
router.get('/stress-level', async (req, res, next) => {
  try {
    await analysisController.getStressLevel(req, res);
  } catch (error) {
    logger.error('Get stress level error:', error);
    next(error);
  }
});

// Get stress trends
router.get('/trends', async (req, res, next) => {
  try {
    await analysisController.getStressTrends(req, res);
  } catch (error) {
    logger.error('Get trends error:', error);
    next(error);
  }
});

// Get health insights
router.get('/insights', async (req, res, next) => {
  try {
    await analysisController.getHealthInsights(req, res);
  } catch (error) {
    logger.error('Get insights error:', error);
    next(error);
  }
});

// Anomaly report
router.get('/anomalies', async (req, res, next) => {
  try {
    await analysisController.getAnomalies(req, res);
  } catch (error) {
    logger.error('Get anomalies error:', error);
    next(error);
  }
});

module.exports = router;
