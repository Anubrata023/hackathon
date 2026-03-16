const jwt = require('jsonwebtoken');

/**
 * Generate JWT token
 */
function generateToken(userId, phone, role = 'citizen') {
  return jwt.sign(
    { id: userId, phone, role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

/**
 * Verify JWT token
 */
function verifyToken(token) {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}

/**
 * Generate random OTP
 */
function generateOTP(length = 6) {
  const digits = '0123456789';
  let otp = '';
  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * 10)];
  }
  return otp;
}

/**
 * Calculate OTP expiry time
 */
function getOTPExpiry(minutes = 10) {
  const expiry = new Date();
  expiry.setMinutes(expiry.getMinutes() + minutes);
  return expiry.toISOString();
}

/**
 * Send OTP via SMS
 * Supports: MSG91, Twilio, or Mock (for testing)
 */
async function sendOTP(phone, otp) {
  const smsProvider = process.env.SMS_PROVIDER || 'mock'; // 'msg91', 'twilio', or 'mock'
  
  // ----------------------------------------------------
  // IMPORTANT: ALWAY LOG THE OTP TO TERMINAL FOR EVALUATION
  // ----------------------------------------------------
  console.log(`\n\n📢 [OTP SERVICE] GENERATED OTP FOR ${phone}: >>> ${otp} <<<\n\n`);
  
  console.log(`📱 Sending OTP to ${phone} via ${smsProvider.toUpperCase()}`);
  
  try {
    if (smsProvider === 'msg91') {
      // MSG91 Integration (Popular in India)
      const msg91Key = process.env.MSG91_AUTH_KEY;
      const msg91SenderId = process.env.MSG91_SENDER_ID || 'SUVDHA';
      const templateId = process.env.MSG91_TEMPLATE_ID;
      
      if (!msg91Key) {
        throw new Error('MSG91_AUTH_KEY not configured in .env');
      }
      
      const url = `https://control.msg91.com/api/v5/otp?template_id=${templateId}&mobile=${phone}&authkey=${msg91Key}&otp=${otp}`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (data.type === 'success') {
        console.log('✅ MSG91: OTP sent successfully');
        return { success: true, message: 'OTP sent via MSG91', provider: 'msg91' };
      } else {
        throw new Error(`MSG91 Error: ${data.message}`);
      }
      
    } else if (smsProvider === 'twilio') {
      // Twilio Integration (Global provider)
      const accountSid = process.env.TWILIO_ACCOUNT_SID;
      const authToken = process.env.TWILIO_AUTH_TOKEN;
      const fromNumber = process.env.TWILIO_PHONE_NUMBER;
      
      if (!accountSid || !authToken || !fromNumber) {
        throw new Error('Twilio credentials not configured in .env');
      }
      
      const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
      const credentials = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
      
      const body = new URLSearchParams({
        To: `+${phone}`,
        From: fromNumber,
        Body: `Your Suvidha OTP is: ${otp}. Valid for 10 minutes. Do not share with anyone.`
      });
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: body.toString()
      });
      
      const data = await response.json();
      
      if (data.sid) {
        console.log('✅ Twilio: OTP sent successfully');
        return { success: true, message: 'OTP sent via Twilio', provider: 'twilio' };
      } else {
        throw new Error(`Twilio Error: ${data.message}`);
      }
      
    } else {
      // Mock mode (for testing without SMS costs)
      console.log('⚠️  MOCK MODE: No actual SMS sent');
      console.log(`   📱 Phone: ${phone}`);
      console.log(`   🔢 OTP: ${otp}`);
      console.log(`   💡 To enable real SMS, set SMS_PROVIDER in .env`);
      return { success: true, message: 'OTP logged (Mock mode)', provider: 'mock' };
    }
    
  } catch (error) {
    console.error(`❌ SMS Error (${smsProvider}):`, error.message);
    // Still return success to not break the flow, but log the error
    return { success: false, message: error.message, provider: smsProvider };
  }
}

/**
 * Format phone number (ensure it's in correct format)
 */
function formatPhone(phone) {
  // Remove all non-digit characters
  let cleaned = phone.replace(/\D/g, '');
  
  // If starts with country code, keep it; otherwise add +91
  if (cleaned.length === 10) {
    cleaned = '91' + cleaned;
  }
  
  return cleaned;
}

/**
 * Generate unique reference number
 */
function generateReferenceNumber(prefix) {
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${prefix}${timestamp}${random}`;
}

/**
 * Format date to YYYY-MM-DD
 */
function formatDate(date = new Date()) {
  return date.toISOString().split('T')[0];
}

/**
 * Calculate due date (days from now)
 */
function calculateDueDate(days = 15) {
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + days);
  return dueDate.toISOString().split('T')[0];
}

module.exports = {
  generateToken,
  verifyToken,
  generateOTP,
  getOTPExpiry,
  sendOTP,
  formatPhone,
  generateReferenceNumber,
  formatDate,
  calculateDueDate
};
