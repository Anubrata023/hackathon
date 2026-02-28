// src/routes/auth.routes.js

const express    = require('express');
const router     = express.Router();
const rateLimit  = require('express-rate-limit');

const authController = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth');
const validate   = require('../middleware/validate');
const authSchema = require('../validators/auth.validator');

// Strict rate limit for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,   // 15 minutes
  max: parseInt(process.env.AUTH_RATE_LIMIT_MAX) || 10,
  message: { success: false, message: 'Too many auth attempts. Please wait 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// OTP-based login (Aadhaar-linked phone)
router.post('/otp/send',   authLimiter, validate(authSchema.sendOtp),   authController.sendOtp);
router.post('/otp/verify', authLimiter, validate(authSchema.verifyOtp), authController.verifyOtp);

// Password-based login (admin / verifiers)
router.post('/register', authLimiter, validate(authSchema.register), authController.register);
router.post('/login',    authLimiter, validate(authSchema.login),    authController.login);

// Token management
router.post('/refresh', validate(authSchema.refresh), authController.refreshToken);
router.post('/logout',  authenticate, authController.logout);

// Current user
router.get('/me', authenticate, authController.getMe);

// Password reset
router.post('/forgot-password', authLimiter, validate(authSchema.forgotPassword), authController.forgotPassword);
router.post('/reset-password',  authLimiter, validate(authSchema.resetPassword),  authController.resetPassword);

module.exports = router;
