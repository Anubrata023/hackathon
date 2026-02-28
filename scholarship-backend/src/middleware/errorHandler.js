// src/middleware/errorHandler.js
const logger = require('../config/logger');

// Custom application error class
class AppError extends Error {
  constructor(message, statusCode = 500, code = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

// 404 handler
const notFoundHandler = (req, res, next) => {
  next(new AppError(`Route ${req.method} ${req.path} not found`, 404));
};

// Central error handler
const errorHandler = (err, req, res, next) => {
  // Prisma errors
  if (err.code === 'P2025') {
    return res.status(404).json({ success: false, message: 'Record not found' });
  }
  if (err.code === 'P2002') {
    const field = err.meta?.target?.join(', ') || 'field';
    return res.status(409).json({ success: false, message: `Duplicate value for: ${field}` });
  }
  if (err.code === 'P2003') {
    return res.status(400).json({ success: false, message: 'Related record not found' });
  }

  // Validation errors (express-validator / joi)
  if (err.name === 'ValidationError') {
    return res.status(400).json({ success: false, message: 'Validation failed', errors: err.details });
  }

  const statusCode = err.statusCode || err.status || 500;
  const message    = err.isOperational ? err.message : 'An unexpected error occurred. Please try again.';

  // Log non-operational errors
  if (!err.isOperational) {
    logger.error('Unexpected error:', {
      message: err.message,
      stack:   err.stack,
      url:     req.url,
      method:  req.method,
      userId:  req.user?.id,
    });
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && !err.isOperational
      ? { stack: err.stack }
      : {}),
  });
};

module.exports = { AppError, errorHandler, notFoundHandler };
