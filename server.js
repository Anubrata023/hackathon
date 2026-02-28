# ⚡ Assam Electricity Services — Backend API

Node.js + Express + SQLite backend for the **APDCL (Assam Power Distribution Company Ltd.)** digital portal.

---

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Create environment file
cp .env.example .env

# 3. (Optional) Load demo data
node seed.js

# 4. Start server
npm start          # production
npm run dev        # development with auto-reload
```

Server runs at **http://localhost:5000**

---

## 📁 Project Structure

```
assam-electricity-backend/
├── server.js              # Express app entry point
├── database.js            # SQLite schema + seeding
├── seed.js                # Demo data loader
├── middleware/
│   └── auth.js            # JWT authenticate + isAdmin guards
├── routes/
│   ├── auth.js            # Register, login, profile
│   ├── bills.js           # Bill lookup, generation
│   ├── payments.js        # Pay bills, receipts
│   ├── complaints.js      # Lodge & track complaints
│   ├── connections.js     # New connection applications
│   ├── usage.js           # Smart meter / usage data
│   ├── solar.js           # Solar rooftop calculator
│   ├── outages.js         # Live outage map feed
│   └── admin.js           # Admin dashboard & management
├── public/                # ← Place the frontend HTML here as index.html
├── .env.example
└── package.json
```

---

## 🔑 Default Credentials

| Role     | Email                          | Password   |
|----------|-------------------------------|------------|
| Admin    | admin@apdcl.assam.gov.in      | password   |
| Customer | rajesh@example.com (after seed)| demo1234  |

---

## 🌐 API Reference

All responses follow: `{ success: boolean, data?: any, message?: string }`

### 🔐 Auth  `/api/auth`

| Method | Endpoint               | Auth | Description                          |
|--------|------------------------|------|--------------------------------------|
| POST   | /register              | —    | Register new customer                |
| POST   | /login                 | —    | Login (email / phone / consumer_id)  |
| GET    | /profile               | ✅   | Get own profile                      |
| PUT    | /profile               | ✅   | Update name, phone, address          |
| PUT    | /change-password       | ✅   | Change password                      |

**Register body:**
```json
{ "name":"Rajesh Sharma", "email":"user@example.com", "phone":"9876543210",
  "password":"secret123", "address":"MG Road", "district":"Kamrup Metro" }
```

**Login body** (use any one identifier):
```json
{ "email":"user@example.com", "password":"secret123" }
{ "consumer_id":"AS-2400-1000", "password":"secret123" }
```

---

### 💳 Bills  `/api/bills`

| Method | Endpoint         | Auth     | Description                          |
|--------|-----------------|----------|--------------------------------------|
| GET    | /               | ✅ Customer | Own bills                         |
| GET    | /latest         | ✅ Customer | Latest unpaid bill                |
| GET    | /:id            | ✅ Customer | Single bill detail                |
| POST   | /check          | —        | Quick lookup by consumer_id          |
| POST   | /generate       | ✅ Admin  | Generate a bill                      |
| DELETE | /:id            | ✅ Admin  | Delete unpaid bill                   |

**Quick check (public — used by homepage Quick Pay):**
```json
{ "consumer_id": "AS-2400-1000" }
```

**Generate bill (admin):**
```json
{ "consumer_id":"AS-2400-1000", "units_consumed":250,
  "billing_month":"February", "billing_year":2026, "arrears":0 }
```

---

### 💰 Payments  `/api/payments`

| Method | Endpoint                      | Auth     | Description            |
|--------|-------------------------------|----------|------------------------|
| POST   | /pay                          | ✅ Customer | Pay a bill           |
| GET    | /                             | ✅ Customer | Payment history      |
| GET    | /receipt/:transaction_id      | ✅ Customer | Download receipt     |
| GET    | /:id                          | ✅ Customer | Single payment       |

**Pay body:**
```json
{ "bill_id": 3, "payment_method": "upi" }
```

Payment methods: `upi`, `netbanking`, `credit_card`, `debit_card`, `wallet`, `neft`

---

### 📋 Complaints  `/api/complaints`

| Method | Endpoint               | Auth      | Description              |
|--------|------------------------|-----------|--------------------------|
| POST   | /                      | —         | Submit complaint (public)|
| GET    | /track/:number         | —         | Track by complaint no.   |
| GET    | /my                    | ✅ Customer| Own complaints          |
| GET    | /                      | ✅ Admin  | All complaints           |
| PUT    | /:id                   | ✅ Admin  | Update status            |
| GET    | /types/list            | —         | Valid complaint types    |

**Submit body:**
```json
{ "name":"John", "phone":"9876543210", "complaint_type":"power_outage",
  "subject":"No power since 6am", "description":"Details here...",
  "consumer_id":"AS-2400-1000", "district":"Barpeta" }
```

Complaint types: `power_outage`, `billing_error`, `voltage_fluctuation`,
`transformer_fault`, `meter_fault`, `new_connection`, `street_light`, `other`

---

### 🔌 New Connections  `/api/connections`

| Method | Endpoint                     | Auth     | Description              |
|--------|------------------------------|----------|--------------------------|
| POST   | /apply                       | —        | Apply (public)           |
| GET    | /track/:application_number   | —        | Track application        |
| GET    | /                            | ✅ Admin | All applications         |
| PUT    | /:id/approve                 | ✅ Admin | Approve + assign cons. ID|
| PUT    | /:id/reject                  | ✅ Admin | Reject with reason       |
| GET    | /districts/list              | —        | All Assam districts      |

---

### 📊 Smart Meter Usage  `/api/usage`

| Method | Endpoint      | Auth      | Description                      |
|--------|--------------|-----------|----------------------------------|
| GET    | /            | ✅ Customer| Full usage history + monthly     |
| GET    | /meter-info  | ✅ Customer| Meter details                    |
| GET    | /live        | ✅ Customer| Simulated live hourly load curve |
| POST   | /reading     | ✅ Admin  | Record a meter reading           |

---

### ☀️ Solar Calculator  `/api/solar`

| Method | Endpoint         | Auth | Description                          |
|--------|-----------------|------|--------------------------------------|
| POST   | /calculate      | —    | Calculate system size, cost, savings |
| GET    | /subsidy-info   | —    | PM Surya Ghar Yojana subsidy info    |

**Calculate body:**
```json
{ "name":"Rajesh", "phone":"9876543210", "monthly_units":300,
  "roof_area_sqft":500, "district":"Kamrup Metro" }
```

---

### 🗺️ Outages  `/api/outages`

| Method | Endpoint              | Auth     | Description          |
|--------|-----------------------|----------|----------------------|
| GET    | /                     | —        | All outages (public) |
| GET    | /district/:district   | —        | Filter by district   |
| POST   | /                     | ✅ Admin | Create notice        |
| PUT    | /:id                  | ✅ Admin | Update status        |
| DELETE | /:id                  | ✅ Admin | Delete              |

---

### 🛠️ Admin  `/api/admin`

| Method | Endpoint                     | Auth     | Description           |
|--------|------------------------------|----------|-----------------------|
| GET    | /dashboard                   | ✅ Admin | Stats overview        |
| GET    | /consumers                   | ✅ Admin | All customers         |
| GET    | /consumers/:id               | ✅ Admin | Customer detail       |
| PUT    | /consumers/:id/toggle        | ✅ Admin | Activate/deactivate   |
| POST   | /meters                      | ✅ Admin | Register a meter      |
| GET    | /tariffs                     | ✅ Admin | View tariff slabs     |
| POST   | /tariffs                     | ✅ Admin | Add tariff slab       |
| GET    | /reports/revenue             | ✅ Admin | Revenue reports       |

---

## 🧮 Billing Logic

Bills are calculated using slab-based tariffs stored in the `tariffs` table:

| Connection  | 0–100 units | 101–200 | 201–300 | 301+    |
|-------------|------------|---------|---------|---------|
| Domestic    | ₹3.50/unit | ₹4.50  | ₹5.50  | ₹6.50  |
| Commercial  | ₹5.50/unit | ₹6.50  | ₹7.50  | —       |
| Industrial  | ₹6.00/unit | —       | —       | —       |
| Agricultural| ₹1.50/unit | —       | —       | —       |

Plus:
- **Fixed charge** based on slab
- **Fuel Adjustment Charge (FAC)**: ₹0.10/unit
- **GST**: 5% on (energy + fixed charges)

---

## 🔒 Security Notes

- Passwords are hashed with **bcryptjs** (10 rounds)
- JWT tokens expire in **7 days** (configurable via `.env`)
- Change `JWT_SECRET` in production
- CORS is open (`*`) — restrict in production
- SQLite WAL mode enabled for concurrent reads

---

## 🌍 Connecting the Frontend

The frontend HTML file makes API calls. To connect:

1. Copy `assam_electricity_services_v2__1_.html` → `public/index.html`
2. Update JS `fetch()` calls in the HTML to point to `/api/...` endpoints
3. Start the server — `http://localhost:5000` serves both frontend and API
