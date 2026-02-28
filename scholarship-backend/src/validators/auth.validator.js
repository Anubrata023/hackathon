// src/validators/auth.validator.js
const Joi = require('joi');

const phone = Joi.string().pattern(/^[6-9]\d{9}$/).required().messages({
  'string.pattern.base': 'Enter a valid 10-digit Indian mobile number',
});

exports.sendOtp = Joi.object({ phone });

exports.verifyOtp = Joi.object({
  phone,
  otp: Joi.string().length(6).pattern(/^\d+$/).required().messages({
    'string.length': 'OTP must be 6 digits',
    'string.pattern.base': 'OTP must contain only digits',
  }),
});

exports.register = Joi.object({
  email:    Joi.string().email().required(),
  phone:    Joi.string().pattern(/^[6-9]\d{9}$/).required(),
  password: Joi.string().min(8).required().messages({ 'string.min': 'Password must be at least 8 characters' }),
  role:     Joi.string().valid('STUDENT', 'ADMIN', 'VERIFIER').default('STUDENT'),
});

exports.login = Joi.object({
  email:    Joi.string().email().required(),
  password: Joi.string().required(),
});

exports.refresh = Joi.object({
  refreshToken: Joi.string().required(),
});

exports.forgotPassword = Joi.object({
  email: Joi.string().email().required(),
});

exports.resetPassword = Joi.object({
  token:    Joi.string().uuid().required(),
  password: Joi.string().min(8).required(),
});
