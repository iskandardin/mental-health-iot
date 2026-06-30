const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const logger = require('../services/logger');

// Get user profile
router.get('/profile', async (req, res, next) => {
  try {
    await userController.getProfile(req, res);
  } catch (error) {
    logger.error('Get profile error:', error);
    next(error);
  }
});

// Update user profile
router.put('/profile', async (req, res, next) => {
  try {
    await userController.updateProfile(req, res);
  } catch (error) {
    logger.error('Update profile error:', error);
    next(error);
  }
});

// Get user devices
router.get('/devices', async (req, res, next) => {
  try {
    await userController.getDevices(req, res);
  } catch (error) {
    logger.error('Get devices error:', error);
    next(error);
  }
});

// Register device
router.post('/devices', async (req, res, next) => {
  try {
    await userController.registerDevice(req, res);
  } catch (error) {
    logger.error('Register device error:', error);
    next(error);
  }
});

// Update user settings
router.put('/settings', async (req, res, next) => {
  try {
    await userController.updateSettings(req, res);
  } catch (error) {
    logger.error('Update settings error:', error);
    next(error);
  }
});

// Change password
router.post('/change-password', async (req, res, next) => {
  try {
    await userController.changePassword(req, res);
  } catch (error) {
    logger.error('Change password error:', error);
    next(error);
  }
});

module.exports = router;
