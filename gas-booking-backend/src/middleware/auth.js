// src/middleware/auth.js
const jwt = require('jsonwebtoken');
const { errorResponse } = require('../utils/helpers');

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)
    : null;

  if (!token) {
    return errorResponse(res, 'Access token required', 401);
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return errorResponse(res, 'Token has expired. Please login again.', 401);
    }
    return errorResponse(res, 'Invalid token', 401);
  }
}

function requireAdmin(req, res, next) {
  if (!req.user || !['admin', 'superadmin'].includes(req.user.role)) {
    return errorResponse(res, 'Admin access required', 403);
  }
  next();
}

function requireSuperAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'superadmin') {
    return errorResponse(res, 'Super admin access required', 403);
  }
  next();
}

module.exports = { authenticateToken, requireAdmin, requireSuperAdmin };
