// src/routes/otp.js
const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const db = require('../database');
const { storeOTP, verifyOTP, sendOTPSMS } = require('../utils/otp');
const { successResponse, errorResponse, normalizeMobile, maskMobile, auditLog } = require('../utils/helpers');
const { validateSendOTP, validateVerifyOTP } = require('../middleware/validate');
const jwt = require('jsonwebtoken');

// Rate limit: max 5 OTP requests per mobile per 15 min
const otpSendLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  keyGenerator: (req) => req.body.mobile || req.ip,
  message: { success: false, message: 'Too many OTP requests. Please wait 15 minutes.' }
});

// Rate limit: max 10 verify attempts per IP per 15 min
const otpVerifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Too many verification attempts. Please wait 15 minutes.' }
});

/**
 * POST /api/otp/send
 * Step 1: Validate consumer and send OTP
 */
router.post('/send', otpSendLimiter, validateSendOTP, async (req, res) => {
  try {
    const mobile = normalizeMobile(req.body.mobile);
    const { consumer_id } = req.body;

    // Check consumer exists and is active
    const consumer = db.prepare(`
      SELECT * FROM consumers WHERE consumer_id = ? AND is_active = 1
    `).get(consumer_id);

    if (!consumer) {
      return errorResponse(res, 'Consumer ID not found. Please check your LPG Consumer ID.', 404);
    }

    // Check mobile matches registered mobile
    if (consumer.mobile !== mobile) {
      auditLog(db, 'otp', null, 'SEND_FAILED_MOBILE_MISMATCH', { consumer_id, mobile }, req.ip);
      return errorResponse(res, 'Mobile number does not match our records. Please use your registered mobile number.');
    }

    // Check subsidy eligibility
    const eligibility = {
      subsidy_eligible: !!consumer.subsidy_eligible,
      consumer_name: consumer.name,
      city: consumer.city
    };

    // Store and send OTP
    const otp = storeOTP(mobile, 'booking', parseInt(process.env.OTP_EXPIRY_MINUTES) || 10);
    await sendOTPSMS(mobile, otp);

    auditLog(db, 'otp', null, 'OTP_SENT', { consumer_id, mobile: maskMobile(mobile) }, req.ip);

    return successResponse(res, {
      mobile_masked: maskMobile(mobile),
      consumer_name: consumer.name,
      consumer_id: consumer.consumer_id,
      otp_expires_in: (parseInt(process.env.OTP_EXPIRY_MINUTES) || 10) * 60,
      // In DEV mode: return OTP directly (remove in production!)
      ...(process.env.NODE_ENV === 'development' && { dev_otp: otp })
    }, `OTP sent to ${maskMobile(mobile)}`);

  } catch (err) {
    console.error('Send OTP error:', err);
    return errorResponse(res, 'Failed to send OTP. Please try again.', 500);
  }
});

/**
 * POST /api/otp/verify
 * Step 2: Verify OTP and return a session token
 */
router.post('/verify', otpVerifyLimiter, validateVerifyOTP, (req, res) => {
  try {
    const mobile = normalizeMobile(req.body.mobile);
    const { otp } = req.body;

    const result = verifyOTP(mobile, otp, 'booking');

    if (!result.valid) {
      auditLog(db, 'otp', null, 'OTP_VERIFY_FAILED', { mobile: maskMobile(mobile), reason: result.message }, req.ip);
      return errorResponse(res, result.message, 400);
    }

    // Fetch consumer
    const consumer = db.prepare(`
      SELECT id, consumer_id, name, mobile, city, state, subsidy_eligible, bank_account
      FROM consumers WHERE mobile = ? AND is_active = 1
    `).get(mobile);

    if (!consumer) {
      return errorResponse(res, 'Consumer account not found.', 404);
    }

    // Issue session JWT (valid for 30 min for booking)
    const token = jwt.sign(
      {
        consumer_db_id: consumer.id,
        consumer_id: consumer.consumer_id,
        mobile: consumer.mobile,
        name: consumer.name,
        purpose: 'booking'
      },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '30m' }
    );

    auditLog(db, 'consumer', consumer.id, 'OTP_VERIFIED', { consumer_id: consumer.consumer_id }, req.ip);

    return successResponse(res, {
      token,
      consumer: {
        consumer_id: consumer.consumer_id,
        name: consumer.name,
        mobile_masked: maskMobile(consumer.mobile),
        city: consumer.city,
        state: consumer.state,
        subsidy_eligible: !!consumer.subsidy_eligible,
        bank_linked: !!consumer.bank_account
      }
    }, 'OTP verified successfully');

  } catch (err) {
    console.error('Verify OTP error:', err);
    return errorResponse(res, 'Verification failed. Please try again.', 500);
  }
});

/**
 * POST /api/otp/resend
 * Resend OTP (rate-limited)
 */
router.post('/resend', otpSendLimiter, async (req, res) => {
  try {
    const { mobile, consumer_id } = req.body;
    if (!mobile || !consumer_id) {
      return errorResponse(res, 'Mobile and Consumer ID are required');
    }

    const normalMobile = normalizeMobile(mobile);
    const consumer = db.prepare(`
      SELECT * FROM consumers WHERE consumer_id = ? AND mobile = ? AND is_active = 1
    `).get(consumer_id, normalMobile);

    if (!consumer) {
      return errorResponse(res, 'Invalid consumer details', 404);
    }

    const otp = storeOTP(normalMobile, 'booking', parseInt(process.env.OTP_EXPIRY_MINUTES) || 10);
    await sendOTPSMS(normalMobile, otp);

    return successResponse(res, {
      mobile_masked: maskMobile(normalMobile),
      otp_expires_in: (parseInt(process.env.OTP_EXPIRY_MINUTES) || 10) * 60,
      ...(process.env.NODE_ENV === 'development' && { dev_otp: otp })
    }, 'OTP resent successfully');

  } catch (err) {
    console.error('Resend OTP error:', err);
    return errorResponse(res, 'Failed to resend OTP.', 500);
  }
});

module.exports = router;
