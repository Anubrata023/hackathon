// src/services/sms.service.js
// SMS OTP delivery — MSG91 or mock for dev

const logger = require('../config/logger');

exports.sendOtp = async (phone, otp) => {
  if (process.env.NODE_ENV === 'development') {
    logger.info(`[DEV SMS] OTP for ${phone}: ${otp}`);
    return;
  }

  if (process.env.SMS_PROVIDER === 'msg91') {
    const url = 'https://api.msg91.com/api/v5/otp';
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'authkey': process.env.MSG91_API_KEY },
      body: JSON.stringify({
        template_id: process.env.MSG91_TEMPLATE_OTP,
        mobile: `91${phone}`,
        otp,
      }),
    });
    if (!res.ok) throw new Error(`MSG91 error: ${await res.text()}`);
  } else {
    // Fallback: log OTP (replace with your SMS provider)
    logger.warn(`[SMS FALLBACK] OTP for ${phone}: ${otp}`);
  }
};
