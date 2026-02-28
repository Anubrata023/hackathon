// src/utils/helpers.js

/**
 * Standard API response wrapper
 */
function successResponse(res, data, message = 'Success', statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    timestamp: new Date().toISOString()
  });
}

function errorResponse(res, message = 'An error occurred', statusCode = 400, details = null) {
  const body = {
    success: false,
    message,
    timestamp: new Date().toISOString()
  };
  if (details) body.details = details;
  return res.status(statusCode).json(body);
}

/**
 * Generate booking reference like OTP-26-GHY-67821
 */
function generateBookingRef(city = 'GHY') {
  const year = new Date().getFullYear().toString().slice(-2);
  const num = Math.floor(10000 + Math.random() * 90000);
  return `OTP-${year}-${city.toUpperCase()}-${num}`;
}

/**
 * Format mobile number (strip country code, ensure 10 digits)
 */
function normalizeMobile(mobile) {
  const cleaned = mobile.replace(/\D/g, '');
  if (cleaned.startsWith('91') && cleaned.length === 12) return cleaned.slice(2);
  return cleaned.slice(-10);
}

/**
 * Mask mobile number for display: 98XXXX1234
 */
function maskMobile(mobile) {
  if (!mobile || mobile.length < 10) return mobile;
  return mobile.slice(0, 2) + 'XXXX' + mobile.slice(-4);
}

/**
 * Log to audit table
 */
function auditLog(db, entity, entityId, action, details, ip = null) {
  try {
    db.prepare(`
      INSERT INTO audit_log (entity, entity_id, action, details, ip_address)
      VALUES (?, ?, ?, ?, ?)
    `).run(entity, entityId, action, JSON.stringify(details), ip);
  } catch (e) {
    console.error('Audit log error:', e.message);
  }
}

module.exports = {
  successResponse,
  errorResponse,
  generateBookingRef,
  normalizeMobile,
  maskMobile,
  auditLog
};
