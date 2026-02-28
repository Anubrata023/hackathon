// src/middleware/auth.js
// JWT authentication & role-based authorization middleware

const jwt   = require('jsonwebtoken');
const prisma = require('../config/database').prisma;
const { AppError } = require('./errorHandler');

/**
 * authenticate — validates Bearer JWT, attaches req.user
 */
exports.authenticate = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      throw new AppError('Authentication required. Please login.', 401);
    }

    const token = header.split(' ')[1];
    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') throw new AppError('Session expired. Please login again.', 401);
      throw new AppError('Invalid authentication token', 401);
    }

    const user = await prisma.user.findUnique({
      where:  { id: payload.sub },
      select: { id: true, role: true, isActive: true },
    });

    if (!user)           throw new AppError('User not found', 401);
    if (!user.isActive)  throw new AppError('Your account has been suspended', 403);

    req.user = user;
    next();
  } catch (err) { next(err); }
};

/**
 * authorize — role guard (use after authenticate)
 * Usage: authorize('ADMIN', 'SUPER_ADMIN')
 */
exports.authorize = (...roles) => (req, res, next) => {
  if (!req.user) return next(new AppError('Authentication required', 401));
  if (!roles.includes(req.user.role)) {
    return next(new AppError(`Access restricted to: ${roles.join(', ')}`, 403));
  }
  next();
};
