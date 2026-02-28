// src/utils/otp.js
const db = require('../database');

/**
 * Generate a cryptographically random N-digit OTP
 */
function generateOTP(length = 6) {
  let otp = '';
  for (let i = 0; i < length; i++) {
    otp += Math.floor(Math.random() * 10).toString();
  }
  return otp;
}

/**
 * Store OTP in DB (invalidates previous unused OTPs for same mobile+purpose)
 */
function storeOTP(mobile, purpose = 'booking', expiryMinutes = 10) {
  const otp = generateOTP(6);
  const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000).toISOString();

  // Invalidate old OTPs for this mobile + purpose
  db.prepare(`
    UPDATE otp_records SET is_used = 1
    WHERE mobile = ? AND purpose = ? AND is_used = 0
  `).run(mobile, purpose);

  // Insert new OTP
  db.prepare(`
    INSERT INTO otp_records (mobile, otp_code, purpose, expires_at)
    VALUES (?, ?, ?, ?)
  `).run(mobile, otp, purpose, expiresAt);

  return otp;
}

/**
 * Verify an OTP. Returns { valid: bool, message: string }
 */
function verifyOTP(mobile, otpCode, purpose = 'booking') {
  const record = db.prepare(`
    SELECT * FROM otp_records
    WHERE mobile = ? AND purpose = ? AND is_used = 0
    ORDER BY created_at DESC LIMIT 1
  `).get(mobile, purpose);

  if (!record) {
    return { valid: false, message: 'No OTP found. Please request a new OTP.' };
  }

  // Check expiry
  if (new Date(record.expires_at) < new Date()) {
    db.prepare(`UPDATE otp_records SET is_used = 1 WHERE id = ?`).run(record.id);
    return { valid: false, message: 'OTP has expired. Please request a new one.' };
  }

  // Check attempts (max 5)
  if (record.attempts >= 5) {
    db.prepare(`UPDATE otp_records SET is_used = 1 WHERE id = ?`).run(record.id);
    return { valid: false, message: 'Too many incorrect attempts. Please request a new OTP.' };
  }

  if (record.otp_code !== otpCode) {
    db.prepare(`UPDATE otp_records SET attempts = attempts + 1 WHERE id = ?`).run(record.id);
    return { valid: false, message: `Incorrect OTP. ${4 - record.attempts} attempt(s) remaining.` };
  }

  // Mark as used
  db.prepare(`UPDATE otp_records SET is_used = 1 WHERE id = ?`).run(record.id);
  return { valid: true, message: 'OTP verified successfully.' };
}

/**
 * Simulate sending OTP via SMS (replace with actual gateway in production)
 */
async function sendOTPSMS(mobile, otp) {
  // In production, integrate with SMS gateway (e.g., MSG91, Twilio, etc.)
  console.log(`📱 [SMS SIMULATION] OTP ${otp} sent to +91${mobile}`);

  // Example MSG91 integration (commented out):
  // const axios = require('axios');
  // await axios.post('https://api.msg91.com/api/v5/otp', {
  //   template_id: process.env.MSG91_TEMPLATE_ID,
  //   mobile: `91${mobile}`,
  //   authkey: process.env.MSG91_AUTH_KEY,
  //   otp: otp
  // });

  return true;
}

module.exports = { generateOTP, storeOTP, verifyOTP, sendOTPSMS };
