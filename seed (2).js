# APDCL Bill Payment — Backend API

Node.js + Express + SQLite backend for the APDCL Electricity Bill Payment portal (Government of Assam).

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
# Edit .env if needed (defaults work out of the box)
```

### 3. Seed Sample Data
```bash
npm run seed
```

### 4. Start the Server
```bash
# Development (auto-reload)
npm run dev

# Production
npm start
```

Server runs on **http://localhost:3000**

---

## 📡 API Reference

### Base URL: `http://localhost:3000/api`

---

### 🏥 Health & Utils

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Service health check |
| GET | `/divisions` | List all APDCL divisions |
| GET | `/stats` | Dashboard stats (admin) |

---

### 👤 Consumers

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/consumers/:consumerId` | Get consumer info + current bill |
| GET | `/consumers/:consumerId/bills` | Get all bills for consumer |
| GET | `/consumers/:consumerId/history` | Payment history (last 12 months) |

**Example:**
```
GET /api/consumers/AS-2400-8271
```

---

### 📄 Bills

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/bills/:billId` | Get bill by ID |
| GET | `/bills/consumer/:consumerId/month/:month` | Get bill for specific month |

---

### 💳 Payments — 2-Step Process

#### Step 1 — Initiate Payment
```
POST /api/payments/initiate
Content-Type: application/json

{
  "consumer_id": "AS-2400-8271",
  "bill_id": 1,
  "amount": 2318.00,
  "payment_method": "UPI",
  "payment_detail": {
    "upi_id": "rajib@okicici",
    "app": "GPay"
  }
}
```

**payment_method** must be one of: `UPI`, `Card`, `Net Banking`, `Cash`

**Response:**
```json
{
  "success": true,
  "message": "Payment initiated. Proceed to confirm.",
  "data": {
    "transaction_id": "TXN-APDCL-20260228143012-7421",
    "amount": 2318.00,
    "payment_method": "UPI"
  }
}
```

---

#### Step 2 — Confirm Payment
```
POST /api/payments/confirm
Content-Type: application/json

{
  "transaction_id": "TXN-APDCL-20260228143012-7421"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Payment successful! Receipt generated.",
  "data": {
    "transaction_id": "...",
    "gateway_ref": "UPI1234567890",
    "consumer_name": "Rajib Kumar Deka",
    "amount_paid": 2318.00,
    "payment_method": "UPI",
    "bill_month": "February 2026",
    "paid_at": "2026-02-28 14:30:15",
    "receipt_number": "RCPT-TXN-APDCL-..."
  }
}
```

---

#### Get Payment Status
```
GET /api/payments/status/:transactionId
```

#### Get Receipt
```
GET /api/payments/receipt/:transactionId
```

#### List Payments
```
GET /api/payments?consumer_id=AS-2400-8271&status=SUCCESS&limit=10&offset=0
```

---

## 🧪 Sample Consumer IDs (from seed data)

| Consumer ID | Name | Status |
|-------------|------|--------|
| `AS-2400-8271` | Rajib Kumar Deka | Bill Due ₹2,318.00 |
| `AS-1100-3344` | Priya Borah | Bill Due ₹1,642.00 |
| `AS-3300-5566` | Akhil Sharma | Bill Due ₹3,371.80 |

---

## 🗃️ Database Schema

- **consumers** — consumer profile data
- **bills** — monthly electricity bills
- **payments** — payment transactions (PENDING → SUCCESS/FAILED)
- **payment_history** — completed payment ledger
- **divisions** — APDCL administrative divisions

SQLite database is stored at `./data/apdcl.db`

---

## 🔌 Connecting the Frontend

Update the fetch calls in your HTML to point to this backend:

```js
// Consumer lookup
const res = await fetch('http://localhost:3000/api/consumers/AS-2400-8271');

// Initiate payment
const res = await fetch('http://localhost:3000/api/payments/initiate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ consumer_id, bill_id, amount, payment_method, payment_detail })
});

// Confirm payment
const res = await fetch('http://localhost:3000/api/payments/confirm', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ transaction_id })
});
```

---

## 📦 Tech Stack

- **Runtime:** Node.js
- **Framework:** Express 4
- **Database:** SQLite (via better-sqlite3)
- **Security:** Helmet, CORS, Rate Limiting
- **Logging:** Morgan
