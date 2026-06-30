const { firebaseHelpers } = require('../services/firebase');
const logger = require('../services/logger');

const userController = {
  async getProfile(req, res) {
    try {
      const userId = req.userId;
      const userData = await firebaseHelpers.getUserData(userId);

      if (!userData) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      res.json({
        success: true,
        user: userData
      });
    } catch (error) {
      logger.error('Get profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve profile'
      });
    }
  },

  async updateProfile(req, res) {
    try {
      const userId = req.userId;
      const { name, age, gender, phone, emergencyContact } = req.body;

      await firebaseHelpers.updateUser(userId, {
        name,
        age,
        gender,
        phone,
        emergencyContact
      });

      res.json({
        success: true,
        message: 'Profile updated successfully'
      });
    } catch (error) {
      logger.error('Update profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update profile'
      });
    }
  },

  async getDevices(req, res) {
    try {
      const userId = req.userId;
      // In a real app, fetch from database
      const devices = [
        {
          id: 'device-1',
          name: 'My Wearable',
          type: 'wearable',
          status: 'active',
          lastSync: new Date().toISOString()
        }
      ];

      res.json({
        success: true,
        devices
      });
    } catch (error) {
      logger.error('Get devices error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve devices'
      });
    }
  },

  async registerDevice(req, res) {
    try {
      const userId = req.userId;
      const { deviceId, deviceName, deviceType } = req.body;

      if (!deviceId || !deviceName) {
        return res.status(400).json({
          success: false,
          message: 'Device ID and name are required'
        });
      }

      // Register device in database
      await firebaseHelpers.updateUser(userId, {
        registeredDevices: {
          [deviceId]: {
            name: deviceName,
            type: deviceType || 'wearable',
            registeredAt: new Date().toISOString()
          }
        }
      });

      res.status(201).json({
        success: true,
        message: 'Device registered successfully',
        device: {
          id: deviceId,
          name: deviceName,
          type: deviceType
        }
      });
    } catch (error) {
      logger.error('Register device error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to register device'
      });
    }
  },

  async updateSettings(req, res) {
    try {
      const userId = req.userId;
      const settings = req.body;

      await firebaseHelpers.updateUser(userId, {
        settings
      });

      res.json({
        success: true,
        message: 'Settings updated successfully'
      });
    } catch (error) {
      logger.error('Update settings error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update settings'
      });
    }
  },

  async changePassword(req, res) {
    try {
      const { oldPassword, newPassword } = req.body;
      const userId = req.userId;

      if (!oldPassword || !newPassword) {
        return res.status(400).json({
          success: false,
          message: 'Old password and new password are required'
        });
      }

      // In a real app, verify old password and update
      logger.info(`Password change requested for user ${userId}`);

      res.json({
        success: true,
        message: 'Password changed successfully'
      });
    } catch (error) {
      logger.error('Change password error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to change password'
      });
    }
  }
};

module.exports = userController;
