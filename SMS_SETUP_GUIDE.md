# 📱 SMS Integration Guide - Send Real OTP Messages

## 🚀 Quick Start

Currently using **MOCK mode** (no real SMS). Follow these steps to enable real SMS:

---

## ✅ Option 1: MSG91 (Recommended for India) 🇮🇳

**Why MSG91?**
- ✅ Most popular in India
- ✅ Affordable pricing (₹0.15-0.25 per SMS)
- ✅ High delivery rate
- ✅ Easy integration
- ✅ Free trial credits

### Step 1: Sign Up
1. Go to: https://msg91.com
2. Click **"Sign Up Free"**
3. Complete registration
4. Verify your email and phone

### Step 2: Get Credentials
1. Login to MSG91 dashboard
2. Go to **"API"** section
3. Copy your **Auth Key**
4. Note down your **Sender ID** (e.g., SUVDHA)

### Step 3: Create OTP Template
1. Go to **"SMS" → "Templates"**
2. Click **"Create Template"**
3. Template example:
   ```
   Your Suvidha OTP is {#var#}. Valid for 10 minutes. Do not share.
   ```
4. Submit for approval (usually approved in 1-2 hours)
5. Copy the **Template ID**

### Step 4: Configure in .env
Open `backend/.env` and update:

```env
# Enable MSG91
SMS_PROVIDER=msg91

# MSG91 Credentials
MSG91_AUTH_KEY=your_auth_key_from_dashboard
MSG91_SENDER_ID=SUVDHA
MSG91_TEMPLATE_ID=your_template_id_from_step3
```

### Step 5: Test
```bash
# Restart server
Ctrl+C
node backend/server.js

# Test OTP - You'll receive real SMS!
```

**💰 Pricing:** ~₹0.20 per SMS | Free trial: ₹20-50 credits

---

## ✅ Option 2: Twilio (Global Provider) 🌍

**Why Twilio?**
- ✅ Works globally
- ✅ Very reliable
- ✅ Good documentation
- ✅ Free trial $15 credit

### Step 1: Sign Up
1. Go to: https://www.twilio.com/try-twilio
2. Sign up with email
3. Verify phone number

### Step 2: Get Credentials
1. Go to dashboard: https://console.twilio.com
2. Note down:
   - **Account SID** (starts with AC...)
   - **Auth Token** (click to reveal)
3. Get a phone number:
   - Go to **Phone Numbers → Buy a Number**
   - Choose a number (India: +91 or US: +1)
   - Buy it (uses free trial credit)

### Step 3: Configure in .env
Open `backend/.env` and update:

```env
# Enable Twilio
SMS_PROVIDER=twilio

# Twilio Credentials
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+919876543210
```

### Step 4: Verify Indian Numbers (Trial Account)
For trial accounts sending to India:
1. Go to **Phone Numbers → Verified Caller IDs**
2. Add and verify your test phone number
3. You can now send SMS to that number

### Step 5: Test
```bash
# Restart server
node backend/server.js

# Test OTP - You'll receive real SMS!
```

**💰 Pricing:** $0.0079 per SMS to India (~₹0.65) | Free trial: $15

---

## 🧪 Option 3: Keep Mock Mode (For Testing)

If you just want to test without spending money:

1. Keep `.env` as:
   ```env
   SMS_PROVIDER=mock
   ```

2. OTP will be:
   - ✅ Shown in API response
   - ✅ Logged to server console
   - ❌ NO real SMS sent

**This is perfect for:**
- Development
- Testing
- Hackathon demos
- Before going live

---

## 🔧 How It Works

### Current Code Flow:

```javascript
// User clicks "Send OTP"
sendOTP(phone) 
  → API: POST /api/auth/send-otp
  → Generate 6-digit OTP
  → Check SMS_PROVIDER in .env
  → If 'msg91': Send via MSG91
  → If 'twilio': Send via Twilio  
  → If 'mock': Just log to console
  → Return OTP in response (for testing)
```

### Files Modified:
- ✅ `backend/utils/helpers.js` - SMS sending logic
- ✅ `backend/.env` - Configuration
- ✅ `backend/controllers/authController.js` - Always returns OTP for testing

---

## 📊 Comparison Table

| Feature | MSG91 | Twilio | Mock |
|---------|-------|--------|------|
| **Best For** | India | Global | Testing |
| **Setup Time** | 5 mins | 5 mins | 0 mins |
| **Cost/SMS** | ₹0.20 | ₹0.65 | Free |
| **Free Credits** | ₹20-50 | $15 (~₹1250) | ∞ |
| **India Delivery** | Excellent | Good | N/A |
| **Template Required** | Yes | No | No |
| **Real SMS** | ✅ | ✅ | ❌ |

---

## 🎯 Recommended Path

### For Hackathon/Demo:
```env
SMS_PROVIDER=mock
```
**Why?** Free, instant, no setup needed. OTP shows in response.

### For Production (India):
```env
SMS_PROVIDER=msg91
```
**Why?** Cheap, reliable, India-focused, high delivery rate.

### For Global Product:
```env
SMS_PROVIDER=twilio
```
**Why?** Works worldwide, enterprise-grade, excellent support.

---

## 🚨 Important Notes

### Security (Before Production):
1. **Remove OTP from API response:**
   ```javascript
   // In authController.js, remove this line:
   otp: otp  // DELETE THIS IN PRODUCTION
   ```

2. **Use environment variables:**
   - Never commit `.env` to Git
   - Keep credentials secret
   - Use different keys for dev/prod

3. **Rate limiting:**
   - Already implemented ✅
   - 100 requests per 15 minutes
   - Prevents SMS spam/abuse

### Testing Tips:
1. **Use your own number** for testing
2. **MSG91 trial** has DND restrictions (may not work on DND numbers)
3. **Twilio trial** requires verified numbers
4. **Both** need phone verification during signup

---

## 🐛 Troubleshooting

### MSG91: "Template not approved"
**Solution:** Wait 1-2 hours for template approval, or contact support

### Twilio: "Unverified number" error
**Solution:** Add number to Verified Caller IDs in console

### No SMS received
**Check:**
1. ✅ Phone number format (include country code: 919876543210)
2. ✅ Credentials in `.env` are correct
3. ✅ Account has credits
4. ✅ Server restarted after .env changes
5. ✅ Check server logs for errors

### Mock mode not showing OTP
**Solution:** Check browser console or API response JSON

---

## 📞 Support

**MSG91:** support@msg91.com | https://msg91.com/help  
**Twilio:** https://support.twilio.com | +1-888-908-9471

---

## ✅ Quick Test Commands

```bash
# Test current SMS setup
curl -X POST http://localhost:5000/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phone":"9876543210"}'

# Check server logs
# You'll see: "📱 Sending OTP to 919876543210: 123456 via MSG91"
```

---

## 🎉 You're All Set!

- **Mock mode:** Already working ✅
- **Real SMS:** Follow Option 1 (MSG91) or Option 2 (Twilio)
- **Questions?** Check troubleshooting section above

**Current Status:** Mock mode (free, for testing)  
**To enable real SMS:** Update `.env` with your provider credentials
