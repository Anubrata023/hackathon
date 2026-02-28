/**
 * Generate unique reference numbers for complaints, pickups, etc.
 */

function generateComplaintRef() {
  const year = new Date().getFullYear();
  const num = Math.floor(10000 + Math.random() * 90000);
  return `GUW-${year}-${num}`;
}

function generatePickupRef() {
  const year = new Date().getFullYear();
  const num = Math.floor(10000 + Math.random() * 90000);
  return `PKP-${year}-${num}`;
}

function generateAuditRef() {
  const year = new Date().getFullYear();
  const num = Math.floor(10000 + Math.random() * 90000);
  return `AUD-${year}-${num}`;
}

/**
 * Format date to readable string
 */
function formatDate(dateStr) {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric'
  });
}

/**
 * Mock SMS notification (replace with real SMS provider)
 */
async function sendSMS(mobile, message) {
  if (process.env.NODE_ENV !== 'production') {
    console.log(`📱 [SMS MOCK] To: ${mobile} | Message: ${message}`);
    return { success: true, mock: true };
  }
  // TODO: Integrate MSG91, Twilio, or similar
  return { success: false, message: 'SMS provider not configured' };
}

/**
 * Validate Indian mobile number
 */
function isValidMobile(mobile) {
  const cleaned = mobile.replace(/\D/g, '');
  return /^[6-9]\d{9}$/.test(cleaned.replace(/^91/, ''));
}

/**
 * Days of week names
 */
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

module.exports = {
  generateComplaintRef,
  generatePickupRef,
  generateAuditRef,
  formatDate,
  sendSMS,
  isValidMobile,
  DAY_NAMES,
};
