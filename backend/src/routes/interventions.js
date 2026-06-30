const express = require('express');
const router = express.Router();
const interventionController = require('../controllers/interventionController');
const logger = require('../services/logger');

// Get available interventions
router.get('/', async (req, res, next) => {
  try {
    await interventionController.getInterventions(req, res);
  } catch (error) {
    logger.error('Get interventions error:', error);
    next(error);
  }
});

// Get intervention recommendations
router.get('/recommendations', async (req, res, next) => {
  try {
    await interventionController.getRecommendations(req, res);
  } catch (error) {
    logger.error('Get recommendations error:', error);
    next(error);
  }
});

// Log intervention usage
router.post('/log', async (req, res, next) => {
  try {
    await interventionController.logIntervention(req, res);
  } catch (error) {
    logger.error('Log intervention error:', error);
    next(error);
  }
});

// Get intervention history
router.get('/history', async (req, res, next) => {
  try {
    await interventionController.getHistory(req, res);
  } catch (error) {
    logger.error('Get history error:', error);
    next(error);
  }
});

// Rate intervention effectiveness
router.post('/:interventionId/rate', async (req, res, next) => {
  try {
    await interventionController.rateIntervention(req, res);
  } catch (error) {
    logger.error('Rate intervention error:', error);
    next(error);
  }
});

module.exports = router;
