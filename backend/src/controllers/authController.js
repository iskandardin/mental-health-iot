const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { getAuth, firebaseHelpers } = require('../services/firebase');
const logger = require('../services/logger');

const authController = {
  async register(req, res) {
    try {
      const { email, password, name } = req.body;

      if (!email || !password || !name) {
        return res.status(400).json({
          success: false,
          message: 'Email, password, and name are required'
        });
      }

      const auth = getAuth();
      const userRecord = await auth.createUser({
        email,
        password,
        displayName: name
      });

      // Store additional user data in database
      await firebaseHelpers.createUser(userRecord.uid, {
        email,
        name,
        role: 'user',
        createdAt: new Date().toISOString()
      });

      // Generate token
      const token = jwt.sign(
        { userId: userRecord.uid, role: 'user' },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE || '7d' }
      );

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        token,
        user: {
          id: userRecord.uid,
          email,
          name
        }
      });
    } catch (error) {
      logger.error('Registration error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Registration failed'
      });
    }
  },

  async login(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email and password are required'
        });
      }

      const auth = getAuth();
      // Note: In production, you would verify password against Firebase
      // This is a simplified example
      
      const user = await auth.getUserByEmail(email);

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      const token = jwt.sign(
        { userId: user.uid, role: 'user' },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE || '7d' }
      );

      res.json({
        success: true,
        message: 'Login successful',
        token,
        user: {
          id: user.uid,
          email: user.email,
          name: user.displayName
        }
      });
    } catch (error) {
      logger.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: 'Login failed'
      });
    }
  },

  async refreshToken(req, res) {
    try {
      const { token } = req.body;

      if (!token) {
        return res.status(400).json({
          success: false,
          message: 'Token is required'
        });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      const newToken = jwt.sign(
        { userId: decoded.userId, role: decoded.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE || '7d' }
      );

      res.json({
        success: true,
        token: newToken
      });
    } catch (error) {
      logger.error('Refresh token error:', error);
      res.status(401).json({
        success: false,
        message: 'Token refresh failed'
      });
    }
  },

  async logout(req, res) {
    try {
      // In a real application, you might invalidate the token here
      res.json({
        success: true,
        message: 'Logout successful'
      });
    } catch (error) {
      logger.error('Logout error:', error);
      res.status(500).json({
        success: false,
        message: 'Logout failed'
      });
    }
  }
};

module.exports = authController;
