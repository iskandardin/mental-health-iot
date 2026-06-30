const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const logger = require('../services/logger');

// Register
router.post('/register', async (req, res, next) => {
  try {
    await authController.register(req, res);
  } catch (error) {
    logger.error('Register error:', error);
    next(error);
  }
});

// Login
router.post('/login', async (req, res, next) => {
  try {
    await authController.login(req, res);
  } catch (error) {
    logger.error('Login error:', error);
    next(error);
  }
});

// Refresh token
router.post('/refresh-token', async (req, res, next) => {
  try {
    await authController.refreshToken(req, res);
  } catch (error) {
    logger.error('Refresh token error:', error);
    next(error);
  }
});

// Logout
router.post('/logout', async (req, res, next) => {
  try {
    await authController.logout(req, res);
  } catch (error) {
    logger.error('Logout error:', error);
    next(error);
  }
});

module.exports = router;
