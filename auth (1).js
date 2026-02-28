const express = require('express');
const { body } = require('express-validator');
const router  = express.Router();
const rateLimit = require('express-rate-limit');

const { signup, login, getMe } = require('../controllers/authController');
const { authenticate }         = require('../middleware/auth');
const { asyncHandler }         = require('../middleware/errorHandler');

// Stricter rate limit for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,   // 15 min
  max: 10,
  message: { success: false, message: 'Too many requests. Please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// ── Validation rules ─────────────────────────────────────────
const signupRules = [
  body('full_name').trim().notEmpty().withMessage('Full name is required.'),
  body('date_of_birth').isDate().withMessage('Valid date of birth is required.'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required.'),
  body('phone_number').optional()
    .matches(/^[6-9]\d{9}$/).withMessage('Enter a valid 10-digit Indian mobile number.'),
  body('aadhaar_last4').matches(/^\d{4}$/).withMessage('Aadhaar last 4 digits must be 4 numbers.'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters.')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter.')
    .matches(/[0-9]/).withMessage('Password must contain at least one number.'),
];

const loginRules = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required.'),
  body('password').notEmpty().withMessage('Password is required.'),
];

// Middleware to return first validation error
const validate = (req, res, next) => {
  const { validationResult } = require('express-validator');
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: errors.array()[0].msg });
  }
  next();
};

// ── Routes ───────────────────────────────────────────────────
router.post('/signup', authLimiter, signupRules, validate, asyncHandler(signup));
router.post('/login',  authLimiter, loginRules,  validate, asyncHandler(login));
router.get('/me',      authenticate,             asyncHandler(getMe));

module.exports = router;
