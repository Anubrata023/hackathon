# 🚀 QUICK START GUIDE - Suvidha Backend

## ⚡ Easiest Way to Test (No Build Tools Required!)

### Step 1: Install Dependencies

```bash
cd backend
npm install express cors dotenv bcryptjs jsonwebtoken express-validator morgan helmet express-rate-limit
```

### Step 2: Use Simple Database Version

The backend includes a simple JSON-based database that doesn't require compilation:

```bash
# Just run the server - database auto-initializes!
node server.js
```

### Step 3: Test the API

Open your browser and go to:

**http://localhost:5000/test.html**

## 🎯 Quick cURL Test

### 1. Send OTP
```bash
curl -X POST http://localhost:5000/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d "{\"phone\":\"9876543210\"}"
```

**Response:** You'll get an OTP in the response (in development mode)

### 2. Login with OTP
```bash
curl -X POST http://localhost:5000/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d "{\"phone\":\"9876543210\",\"otp\":\"YOUR_OTP_HERE\",\"name\":\"Test User\"}"
```

**Response:** You'll get a JWT token

### 3. Test Municipal API (Use the token from step 2)
```bash
curl -X POST http://localhost:5000/api/municipal/waste/report \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d "{\"location\":\"Guwahati\",\"waste_type\":\"mixed\",\"description\":\"Test report\"}"
```

## 📊 Your 4 Modules

### 1. Municipal Services (`/api/municipal/*`)
- Waste Management
- Grie vances (Jan Sunwai)
- Water Supply

### 2. Electricity Services (`/api/electricity/*`)
- New Connections
- Bills
- Meter Readings

### 3. Gas Services (`/api/gas/*`)
- LPG Booking
- Connections

### 4. Scholarship Services (`/api/scholarships/*`)
- Browse & Apply
- Track Applications

## 🧪 Testing Methods

### ✅ Method 1: Interactive Web UI (BEST!)
1. Start server: `node server.js`
2. Open: `http://localhost:5000/test.html`
3. Click buttons to test!

### ✅ Method 2: cURL Commands
See examples above

### ✅ Method 3: Postman/Thunder Client
Import endpoints from [backend/README.md](README.md)

## 📁 Data Storage

All data is stored in: `backend/data/db.json`

You can view/edit it directly to see your test data!

## 🔑 Default Test Credentials

Phone: `9876543210`  
OTP: Check the server console or API response

## 🎉 That's It!

Your backend is ready to test all 4 modules with OTP authentication!

---

## ⚙️ Alternative: SQLite Version (Requires Build Tools)

If you have Visual Studio Build Tools installed:

```bash
npm install better-sqlite3
node server.js  # Uses SQLite database
```

But the JSON version works perfectly for testing and development!
