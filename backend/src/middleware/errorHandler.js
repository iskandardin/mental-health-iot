const logger = require('../services/logger');

const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.message = err.message || 'Internal Server Error';

  // Logging
  logger.error(`${err.statusCode} - ${err.message}`);

  // Wrong MongoDB ID error
  if (err.name === 'CastError') {
    const message = `Resource not found. Invalid: ${err.path}`;
    err = { statusCode: 400, message };
  }

  // JWT error
  if (err.name === 'JsonWebTokenError') {
    const message = 'JSON Web Token is invalid, Try again!';
    err = { statusCode: 400, message };
  }

  // JWT EXPIRED error
  if (err.name === 'TokenExpiredError') {
    const message = 'JSON Web Token is expired, Try again!';
    err = { statusCode: 400, message };
  }

  res.status(err.statusCode).json({
    success: false,
    message: err.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = errorHandler;
