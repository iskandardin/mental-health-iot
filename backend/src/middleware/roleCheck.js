const logger = require('../services/logger');

const roleMiddleware = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.userRole || !allowedRoles.includes(req.userRole)) {
      logger.warn(`Unauthorized access attempt by user ${req.userId}`);
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
    }
    next();
  };
};

module.exports = roleMiddleware;
