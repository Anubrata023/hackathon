const { verifyToken } = require('../utils/helpers');
const db = require('../config/database-simple');

/**
 * Authentication Middleware
 * Verifies JWT token and attaches user to request
 */
exports.authenticate = (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No token provided. Please login.'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const decoded = verifyToken(token);

    // Check if user exists and is active
    const user = db.findOne('users', { id: decoded.id });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated. Please contact support.'
      });
    }

    // Attach user to request
    req.user = user;
    next();

  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
      error: error.message
    });
  }
};

/**
 * Optional Authentication
 * Attaches user if token is valid, but doesn't block request
 */
exports.optionalAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = verifyToken(token);
      
      const user = db.findOne('users', { id: decoded.id });

      if (user) {
        req.user = user;
      }
    }
  } catch (error) {
    // Silently fail for optional auth
  }
  
  next();
};

/**
 * Role-based Authorization Middleware
 */
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to access this resource'
      });
    }

    next();
  };
};
