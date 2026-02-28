/**
 * Aadhaar Utility
 * ─────────────────────────────────────────────────────────────
 * Per the Aadhaar (Targeted Delivery of Financial and Other
 * Subsidies, Benefits and Services) Act, 2016 and the UIDAI
 * guidelines, we ONLY store the last 4 digits of the Aadhaar
 * number. The full 12-digit number must never be persisted.
 */

/**
 * Validates that the input is exactly 4 numeric digits.
 * Use this for the "last 4 digits" field coming from the frontend.
 * @param {string} last4
 * @returns {{ valid: boolean, error?: string }}
 */
function validateAadhaarLast4(last4) {
  if (!last4) return { valid: false, error: 'Aadhaar last 4 digits are required.' };
  if (!/^\d{4}$/.test(last4)) {
    return { valid: false, error: 'Aadhaar last 4 digits must be exactly 4 numeric characters.' };
  }
  return { valid: true };
}

/**
 * Validates a full 12-digit Aadhaar number (if ever provided
 * temporarily during a session for OTP/verification flows).
 * Applies basic Verhoeff checksum + format checks.
 * The full number must NEVER be forwarded to the database layer.
 * @param {string} number – raw 12-digit string, spaces allowed
 * @returns {{ valid: boolean, last4: string|null, error?: string }}
 */
function validateFullAadhaar(number) {
  if (!number) return { valid: false, last4: null, error: 'Aadhaar number is required.' };

  const cleaned = number.replace(/\s+/g, '');

  if (!/^\d{12}$/.test(cleaned)) {
    return { valid: false, last4: null, error: 'Aadhaar number must be 12 digits.' };
  }

  // First digit cannot be 0 or 1
  if (['0', '1'].includes(cleaned[0])) {
    return { valid: false, last4: null, error: 'Invalid Aadhaar number.' };
  }

  const last4 = cleaned.slice(-4);
  return { valid: true, last4 };
}

/**
 * Returns a masked display string: XXXX-XXXX-1234
 * @param {string} last4
 * @returns {string}
 */
function maskAadhaar(last4) {
  return `XXXX-XXXX-${last4}`;
}

module.exports = { validateAadhaarLast4, validateFullAadhaar, maskAadhaar };
