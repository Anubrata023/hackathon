# 🔥 Gas Cylinder OTP Booking — Backend

> **Node.js + Express + SQLite** backend for the Gas Services Portal OTP Booking frontend.

---

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Set up environment variables
cp .env.example .env
# Edit .env and change JWT_SECRET to a strong random string

# 3. Seed the database with sample data
npm run seed

# 4. Start the server
npm start

# Or in dev mode with auto-reload
npm run dev
```

Server starts at: **http://localhost:3000**

---

## 🔑 Test Credentials

### Consumer Test Accounts
| Name              | Mobile     | Consumer ID    |
|-------------------|------------|----------------|
| Rajesh Sharma     | 9876543001 | 6200012345678  |
| Priya Kalita      | 9876543002 | 6200023456789  |
| Mohammed Hussain  | 9876543003 | 6200034567890  |

> 💡 In `development` mode, the API returns the OTP directly in the response (`dev_otp` field) so you don't need an SMS gateway.

### Admin Accounts
| Username  | Password       | Role        |
|-----------|----------------|-------------|
| admin     | Admin@1234     | superadmin  |
| operator  | Operator@1234  | admin       |

---

## 🗂️ Project Structure

```
gas-booking-backend/
├── src/
│   ├── server.js           # Express app entry point
│   ├── database.js         # SQLite init + schema
│   ├── seed.js             # Sample data seeder
│   ├── routes/
│   │   ├── otp.js          # OTP send/verify/resend
│   │   ├── bookings.js     # Booking CRUD
│   │   ├── distributors.js # Distributor + slots listing
│   │   ├── consumers.js    # Consumer profile
│   │   └── admin.js        # Admin dashboard + management
│   ├── middleware/
│   │   ├── auth.js         # JWT authentication
│   │   └── validate.js     # Input validation
│   └── utils/
│       ├── otp.js          # OTP generate/store/verify
│       └── helpers.js      # Response helpers, booking ref, audit log
├── data/                   # SQLite DB files (auto-created)
├── public/                 # Static frontend files (place HTML here)
├── .env.example
└── package.json
```

---

## 📡 API Reference

### 🔐 Authentication Flow (Booking)

```
1. POST /api/otp/send      → Consumer enters mobile + consumer ID
2. POST /api/otp/verify    → Consumer enters 6-digit OTP
3. (Receive JWT token)     → Use as Bearer token for all subsequent calls
```

---

### OTP Endpoints

#### `POST /api/otp/send`
Send OTP to consumer's registered mobile.

**Request:**
```json
{
  "mobile": "9876543001",
  "consumer_id": "6200012345678"
}
```

**Response:**
```json
{
  "success": true,
  "message": "OTP sent to 98XXXX3001",
  "data": {
    "mobile_masked": "98XXXX3001",
    "consumer_name": "Rajesh Kumar Sharma",
    "otp_expires_in": 600,
    "dev_otp": "123456"   // ← only in development mode!
  }
}
```

---

#### `POST /api/otp/verify`
Verify OTP and receive session token.

**Request:**
```json
{
  "mobile": "9876543001",
  "otp": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGci...",
    "consumer": {
      "consumer_id": "6200012345678",
      "name": "Rajesh Kumar Sharma",
      "mobile_masked": "98XXXX3001",
      "subsidy_eligible": true,
      "bank_linked": true
    }
  }
}
```

---

#### `POST /api/otp/resend`
Resend OTP (rate-limited: 5 per 15 min).

**Request:**
```json
{
  "mobile": "9876543001",
  "consumer_id": "6200012345678"
}
```

---

### Distributor Endpoints

#### `GET /api/distributors`
> Requires: `Authorization: Bearer <token>`

Optional query params: `?city=Guwahati&pincode=781001`

**Response:**
```json
{
  "data": {
    "distributors": [
      {
        "id": 1,
        "dist_code": "GHY-001",
        "name": "Guwahati Gas Agency",
        "address": "House No. 12, GS Road, Ulubari",
        "city": "Guwahati",
        "rating": 4.7,
        "distance_km": 1.2,
        "stock_available": 1,
        "available_slots_count": 12
      }
    ]
  }
}
```

---

#### `GET /api/distributors/:id/slots`
> Requires: `Authorization: Bearer <token>`

Optional query param: `?date=2026-03-01`

---

### Booking Endpoints

> All booking endpoints require `Authorization: Bearer <token>`

#### `POST /api/bookings`
Create a confirmed booking.

**Request:**
```json
{
  "consumer_id": "6200012345678",
  "distributor_id": 1,
  "slot_id": 3,
  "cylinder_type": "14.2 kg",
  "quantity": 1,
  "special_instructions": "Leave at gate if not home"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Booking confirmed successfully! 🎉",
  "data": {
    "booking_ref": "OTP-26-GHY-87234",
    "status": "confirmed",
    "consumer_name": "Rajesh Kumar Sharma",
    "distributor_name": "Guwahati Gas Agency",
    "cylinder_type": "14.2 kg",
    "quantity": 1,
    "amount": 899.50,
    "delivery_slot": "2026-03-02 | 09:00-12:00",
    "subsidy_amount": 200,
    "subsidy_credit_timeline": "2-3 working days post delivery"
  }
}
```

---

#### `GET /api/bookings/history`
Paginated booking history.

Query params: `?page=1&limit=10`

---

#### `GET /api/bookings/:ref`
Get single booking details.

---

#### `DELETE /api/bookings/:ref/cancel`
Cancel a pending/confirmed booking.

**Request:**
```json
{
  "reason": "Not available for delivery"
}
```

---

### Consumer Endpoints

> Require `Authorization: Bearer <token>`

#### `GET /api/consumers/profile`
#### `PATCH /api/consumers/profile`
#### `GET /api/consumers/subsidy`

---

### Admin Endpoints

#### `POST /api/admin/login`
```json
{ "username": "admin", "password": "Admin@1234" }
```

#### `GET /api/admin/dashboard`
#### `GET /api/admin/bookings?status=confirmed&date=2026-03-01`
#### `PATCH /api/admin/bookings/:ref/status`
```json
{ "status": "delivered" }
```
#### `POST /api/admin/consumers`
#### `GET /api/admin/consumers?search=rajesh`
#### `POST /api/admin/slots`

---

## 🗄️ Database Schema

| Table                  | Purpose                          |
|------------------------|----------------------------------|
| `consumers`            | Registered LPG consumers         |
| `otp_records`          | OTP history with expiry          |
| `distributors`         | Gas distributors/agencies        |
| `delivery_slots`       | Time slots with capacity         |
| `bookings`             | Cylinder booking records         |
| `subsidy_transactions` | PAHAL DBT subsidy tracking       |
| `admin_users`          | Admin portal users               |
| `audit_log`            | All important actions logged     |

---

## 🔒 Security Features

- **JWT** session tokens (30 min for booking, 24h for admin)
- **Rate limiting** on OTP endpoints (5 OTPs / 15 min per mobile)
- **OTP expiry** (10 minutes, configurable via `.env`)
- **Max OTP attempts** (5 attempts before invalidation)
- **Input validation** on all endpoints
- **Bcrypt** password hashing for admin users
- **Audit logging** for all sensitive operations
- **SQL injection prevention** via prepared statements

---

## 🌐 Frontend Integration

Place `otp_booking_done.html` (renamed to `index.html`) in the `public/` folder:

```bash
mkdir -p public
cp otp_booking_done.html public/index.html
```

The frontend will be served at `http://localhost:3000`.

Update frontend fetch calls to point to the API:
```javascript
const API_BASE = 'http://localhost:3000/api';

// Step 1: Send OTP
const r1 = await fetch(`${API_BASE}/otp/send`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ mobile, consumer_id })
});

// Step 2: Verify OTP
const r2 = await fetch(`${API_BASE}/otp/verify`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ mobile, otp })
});
const { data } = await r2.json();
const TOKEN = data.token;

// Step 3: Create Booking
const r3 = await fetch(`${API_BASE}/bookings`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${TOKEN}`
  },
  body: JSON.stringify({ consumer_id, distributor_id, slot_id })
});
```

---

## 🚀 Deployment Notes

1. Set `NODE_ENV=production` in `.env`
2. Use a strong random `JWT_SECRET` (32+ chars)
3. Integrate a real SMS gateway (MSG91, Twilio, etc.) in `src/utils/otp.js`
4. Consider using PostgreSQL for production (replace `better-sqlite3` with `pg`)
5. Add HTTPS via a reverse proxy (Nginx/Caddy)
6. Set `ALLOWED_ORIGINS` in `.env` to your frontend domain

---

## 📄 License
MIT — Built for Hackathon 🏆
