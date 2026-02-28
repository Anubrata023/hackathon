// src/middleware/validate.js
const { errorResponse } = require('../utils/helpers');

function validateMobile(mobile) {
  return /^[6-9]\d{9}$/.test(mobile);
}

function validateOTP(otp) {
  return /^\d{6}$/.test(otp);
}

function validateConsumerID(id) {
  // LPG consumer IDs are typically 10-17 digit numbers
  return /^\d{10,17}$/.test(id);
}

function validateAadhaar(aadhaar) {
  return /^\d{12}$/.test(aadhaar.replace(/\s/g, ''));
}

// ── Request validators ──────────────────────────────────────────
function validateSendOTP(req, res, next) {
  const { mobile, consumer_id } = req.body;

  if (!mobile) return errorResponse(res, 'Mobile number is required');
  if (!validateMobile(mobile)) return errorResponse(res, 'Invalid mobile number. Must be a valid 10-digit Indian mobile number.');
  if (!consumer_id) return errorResponse(res, 'LPG Consumer ID is required');
  if (!validateConsumerID(consumer_id)) return errorResponse(res, 'Invalid Consumer ID. Must be 10-17 digits.');

  next();
}

function validateVerifyOTP(req, res, next) {
  const { mobile, otp } = req.body;

  if (!mobile) return errorResponse(res, 'Mobile number is required');
  if (!validateMobile(mobile)) return errorResponse(res, 'Invalid mobile number');
  if (!otp) return errorResponse(res, 'OTP is required');
  if (!validateOTP(otp)) return errorResponse(res, 'OTP must be exactly 6 digits');

  next();
}

function validateCreateBooking(req, res, next) {
  const { consumer_id, distributor_id, slot_id, cylinder_type, quantity } = req.body;

  if (!consumer_id) return errorResponse(res, 'Consumer ID is required');
  if (!distributor_id) return errorResponse(res, 'Distributor selection is required');

  const qty = parseInt(quantity);
  if (qty && (qty < 1 || qty > 2)) {
    return errorResponse(res, 'Quantity must be 1 or 2 cylinders per booking');
  }

  next();
}

module.exports = {
  validateMobile,
  validateOTP,
  validateConsumerID,
  validateAadhaar,
  validateSendOTP,
  validateVerifyOTP,
  validateCreateBooking
};
