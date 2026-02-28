# 💧 GMC Water Supply Portal — Backend

Complete REST API backend for the **Guwahati Municipal Corporation Water Supply Citizen Portal**.  
Built with **Node.js**, **Express**, and **SQLite (better-sqlite3)**.

---

## 📁 Project Structure

```
water-backend/
├── src/
│   ├── server.js                  ← Entry point
│   ├── db/
│   │   ├── index.js               ← DB connection singleton
│   │   ├── setup.js               ← Creates all tables (run once)
│   │   └── seed.js                ← Seeds realistic initial data
│   ├── routes/
│   │   ├── auth.js                ← Register, Login, Profile
│   │   ├── connections.js         ← New water connection applications
│   │   ├── bills.js               ← Bill viewing, payment, disputes
│   │   ├── leakage.js             ← Leakage / burst pipe reports
│   │   ├── tanker.js              ← Emergency tanker requests
│   │   ├── meterReadings.js       ← Meter reading submissions + complaints
│   │   ├── transfers.js           ← Connection transfer / NOC
│   │   ├── supplyStatus.js        ← Ward schedules + water quality
│   │   └── misc.js                ← Notices, stats, search, uploads, admin dashboard
│   └── middleware/
│       ├── auth.js                ← JWT verification + role guards
│       ├── errorHandler.js        ← Validation + 404 + global error handler
│       └── upload.js              ← Multer config
├── public/                        ← Place your HTML frontend here as index.html
├── uploads/                       ← Uploaded files (auto-created)
├── db/                            ← SQLite database (auto-created)
├── .env.example
├── package.json
└── README.md
```

---

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Set up environment
cp .env.example .env
# Open .env and set a strong JWT_SECRET

# 3. Create database tables
npm run setup

# 4. Seed with initial data
npm run seed

# 5. Start the server
npm run dev
```

API is now live at **http://localhost:3000**

Place your `water_supply_page.html` file inside the `public/` folder  
and rename it to `index.html`. It will be served at **http://localhost:3000**.

---

## 🔑 Default Login Credentials

| Role    | Email                        | Password         |
|---------|------------------------------|------------------|
| Admin   | admin@gmc.assam.gov.in       | Admin@Water2026! |
| Officer | officer@gmc.assam.gov.in     | Officer@123      |
| Citizen | citizen@example.com          | Citizen@123      |

> ⚠️ Change all passwords in `.env` before going live.

---

## 📡 Full API Reference

All responses follow this format:
```json
{ "success": true, "data": { ... }, "message": "..." }
```

---

### 🔐 Authentication — `/api/auth`

| Method | Endpoint            | Auth | Description                          |
|--------|---------------------|------|--------------------------------------|
| POST   | `/register`         | No   | Citizen self-registration             |
| POST   | `/login`            | No   | Login → returns JWT token             |
| POST   | `/logout`           | No   | Clear session cookie                  |
| GET    | `/me`               | ✅   | Get current user profile              |
| PUT    | `/profile`          | ✅   | Update name, phone, address           |
| PUT    | `/change-password`  | ✅   | Change password                       |

---

### 💧 Water Connections — `/api/connections`

| Method | Endpoint                 | Auth         | Description                            |
|--------|--------------------------|--------------|----------------------------------------|
| GET    | `/`                      | ✅ Any        | My connections (citizen) / All (officer)|
| GET    | `/track/:appNumber`      | No           | Public status tracking                 |
| GET    | `/:id`                   | ✅ Any        | Full connection details                |
| POST   | `/`                      | ✅ Citizen    | Submit new connection application      |
| POST   | `/:id/documents`         | ✅ Citizen    | Upload ownership documents (max 5)     |
| PUT    | `/:id`                   | ✅ Officer    | Update status, inspection date, etc.   |

**Application number format:** `WC-2026-00123`

---

### 💳 Bills — `/api/bills`

| Method | Endpoint         | Auth          | Description                     |
|--------|------------------|---------------|---------------------------------|
| GET    | `/`              | ✅ Any         | My bills / All bills (officer)  |
| GET    | `/:id`           | ✅ Any         | Single bill detail              |
| POST   | `/:id/pay`       | ✅ Any         | Pay a bill (UPI/net banking/card)|
| POST   | `/:id/dispute`   | ✅ Citizen     | Dispute a bill                  |
| POST   | `/`              | ✅ Officer     | Generate new bill               |
| PUT    | `/:id`           | ✅ Officer     | Waive / update bill status      |

**Pay bill body:**
```json
{ "payment_method": "upi", "payment_ref": "UPI123456789" }
```

---

### 🚨 Leakage Reports — `/api/leakage`

| Method | Endpoint              | Auth        | Description                         |
|--------|-----------------------|-------------|-------------------------------------|
| POST   | `/`                   | No          | Report leakage / burst pipe (public)|
| GET    | `/track/:ticketId`    | No          | Track complaint by ticket (public)  |
| GET    | `/`                   | ✅ Any       | My reports (citizen) / All (officer)|
| POST   | `/:id/photo`          | No          | Upload photo evidence               |
| PUT    | `/:id`                | ✅ Officer   | Update status, assign, resolve      |

**Ticket format:** `LK-2026-00789`  
**Severity levels:** `minor` | `medium` | `major` | `burst`

---

### 🚚 Tanker Requests — `/api/tanker`

| Method | Endpoint                | Auth       | Description                          |
|--------|-------------------------|------------|--------------------------------------|
| POST   | `/`                     | No         | Request tanker (public)              |
| GET    | `/track/:requestNumber` | No         | Track request (public)               |
| GET    | `/`                     | ✅ Any      | My requests (citizen) / All (officer)|
| PUT    | `/:id`                  | ✅ Officer  | Dispatch / update tanker status      |

**Request number format:** `TK-2026-00321`  
**Charges:** Emergency = Free | Scheduled = ₹500 | Commercial = ₹1,200

---

### 📊 Meter Services — `/api/meter`

| Method | Endpoint                       | Auth       | Description                     |
|--------|--------------------------------|------------|---------------------------------|
| GET    | `/readings`                    | ✅ Any      | My meter readings               |
| POST   | `/readings`                    | ✅ Citizen  | Submit monthly meter reading    |
| POST   | `/readings/:id/photo`          | ✅ Citizen  | Upload meter photo              |
| PUT    | `/readings/:id/verify`         | ✅ Officer  | Verify a submitted reading      |
| GET    | `/complaints`                  | ✅ Any      | Meter complaints                |
| GET    | `/complaints/track/:ticketId`  | No         | Track complaint (public)        |
| POST   | `/complaints`                  | ✅ Citizen  | File meter complaint            |
| POST   | `/complaints/:id/photo`        | ✅ Citizen  | Upload complaint photo          |
| PUT    | `/complaints/:id`              | ✅ Officer  | Update complaint status         |

**Ticket format:** `MC-2026-00111`  
**Complaint types:** `faulty` | `damaged` | `tampered` | `slow` | `fast` | `no_reading`

---

### 🔄 Transfers & NOC — `/api/transfers`

| Method | Endpoint              | Auth        | Description                      |
|--------|-----------------------|-------------|----------------------------------|
| GET    | `/`                   | ✅ Any       | My transfer applications         |
| GET    | `/track/:appNumber`   | No          | Public tracking                  |
| POST   | `/`                   | ✅ Citizen   | Apply for transfer or NOC        |
| POST   | `/:id/documents`      | ✅ Citizen   | Upload sale deed + ID proof      |
| PUT    | `/:id`                | ✅ Officer   | Update status                    |

**Application format:** `CT-2026-00050`

---

### 🗓️ Supply Status — `/api/supply`

| Method | Endpoint                  | Auth       | Description                        |
|--------|---------------------------|------------|------------------------------------|
| GET    | `/schedules`              | No         | All ward schedules (public)        |
| GET    | `/schedules/disruptions`  | No         | Active disruptions only (public)   |
| POST   | `/schedules`              | ✅ Officer  | Create/add schedule                |
| PUT    | `/schedules/:id`          | ✅ Officer  | Update schedule / mark disruption  |
| GET    | `/quality`                | No         | Water quality readings (public)    |
| GET    | `/quality/latest`         | No         | Latest quality reading (public)    |
| POST   | `/quality`                | ✅ Officer  | Post new quality test result       |

---

### 📢 Misc — `/api`

| Method | Endpoint             | Auth        | Description                    |
|--------|----------------------|-------------|--------------------------------|
| GET    | `/notices`           | No          | Notices & alerts (public)      |
| POST   | `/notices`           | ✅ Officer   | Publish notice                 |
| PUT    | `/notices/:id`       | ✅ Officer   | Update notice                  |
| DELETE | `/notices/:id`       | ✅ Admin     | Soft-delete notice             |
| GET    | `/stats`             | No          | Hero counter stats (public)    |
| PUT    | `/stats/:key`        | ✅ Admin     | Update a stat value            |
| GET    | `/search?q=term`     | No          | Search notices & schedules     |
| POST   | `/upload`            | ✅ Any       | Upload file (PDF/image)        |
| GET    | `/admin/dashboard`   | ✅ Admin     | Full admin summary             |
| GET    | `/health`            | No          | Health check                   |

---

## 🗄️ Database Schema

| Table                  | Purpose                                            |
|------------------------|----------------------------------------------------|
| `users`                | Citizens, officers, admins                         |
| `connections`          | Water connection applications                      |
| `bills`                | Monthly water bills                                |
| `meter_readings`       | Citizen self-submitted meter readings              |
| `leakage_complaints`   | Pipe leakage / burst reports                       |
| `tanker_requests`      | Emergency & scheduled tanker deliveries            |
| `meter_complaints`     | Faulty/damaged meter complaints                    |
| `connection_transfers` | Ownership transfer / NOC applications              |
| `ward_schedules`       | Daily ward-wise supply schedule & disruptions      |
| `quality_readings`     | Water quality test results (pH, turbidity, etc.)   |
| `notices`              | Circulars, alerts, tenders, orders                 |
| `site_stats`           | Homepage hero counters                             |
| `search_logs`          | Analytics                                          |

---

## 🛡️ Security Features

- JWT authentication with HTTP-only cookies
- bcrypt password hashing (12 rounds)
- Helmet security headers
- CORS restricted to configured origin
- Rate limiting: 100 req/15min global, 10/15min auth, 30/min search
- Input validation via express-validator
- Role-based access: `citizen` → `officer` → `admin`
- Soft deletes — data is never permanently removed

---

## 👤 Roles & Permissions

| Role      | Can Do                                                                    |
|-----------|---------------------------------------------------------------------------|
| `citizen` | Register, login, apply for connections, pay bills, submit readings/complaints, request tankers |
| `officer` | All citizen + publish notices, manage all applications, update statuses, post quality readings |
| `admin`   | Full access including user management, site stats, admin dashboard        |

---

## 📦 Tech Stack

Node.js 18+ · Express 4 · SQLite (better-sqlite3) · JWT · bcryptjs · Multer · Helmet · Morgan
