# APDCL Smart Meter Consumption — Backend API

> **Node.js + Express + SQLite** backend for the APDCL Smart Meter Consumption frontend.  
> Government of Assam · Assam Power Distribution Company Ltd.

---

## 🚀 Quick Start

### 1. Install dependencies
```bash
npm install
```

### 2. Seed the database (demo data)
```bash
npm run seed
```

### 3. Start the server
```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

Server runs at **http://localhost:3000**

---

## 📁 Project Structure

```
apdcl-backend/
├── src/
│   ├── server.js                   # Express app entry point
│   ├── db/
│   │   ├── init.js                 # DB connection & table creation
│   │   └── seed.js                 # Demo data seeder
│   ├── controllers/
│   │   ├── consumerController.js
│   │   ├── consumptionController.js
│   │   ├── billingController.js
│   │   ├── alertsController.js
│   │   ├── tariffController.js
│   │   ├── complaintsController.js
│   │   ├── meterController.js
│   │   └── platformController.js
│   ├── routes/
│   │   ├── consumers.js
│   │   ├── consumption.js
│   │   ├── billing.js
│   │   ├── alerts.js
│   │   ├── tariff.js
│   │   ├── complaints.js
│   │   ├── meter.js
│   │   └── platform.js
│   └── middleware/
│       └── errorHandler.js
├── public/
│   └── index.html                  # Your frontend (served statically)
├── data/
│   └── apdcl.db                    # SQLite database (auto-created)
├── .env                            # Environment variables
├── .env.example
├── package.json
└── README.md
```

---

## 🔌 API Endpoints

**Base URL:** `http://localhost:3000/api/v1`

**Demo Consumer ID:** `ASM-GHY-048271`

### Platform
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/platform/health` | Health check |
| GET | `/platform/stats` | Hero stats (total meters, uptime, etc.) |

### Consumers
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/consumers` | List all consumers |
| GET | `/consumers/:consumerId` | Get consumer by ID or meter number |

### Consumption
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/consumption/:consumerId/summary` | KPI cards data |
| GET | `/consumption/:consumerId/daily?month=2026-02` | Daily chart data |
| GET | `/consumption/:consumerId/weekly?month=2026-02` | Weekly chart data |
| GET | `/consumption/:consumerId/monthly?count=6` | Monthly chart data |
| GET | `/consumption/:consumerId/history?limit=12` | History table data |

### Billing
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/billing/:consumerId/current` | Current month bill details |
| GET | `/billing/:consumerId/all` | All bills |
| POST | `/billing/:consumerId/pay` | Record a payment |
| GET | `/billing/:consumerId/payments` | Payment history |

**Pay Bill body:**
```json
{
  "billing_period": "2026-02",
  "amount": 2348,
  "payment_mode": "upi",
  "transaction_ref": "UPI123456"
}
```

### Alerts
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/alerts/:consumerId` | Get all alerts |
| GET | `/alerts/:consumerId?unread=true` | Unread alerts only |
| POST | `/alerts/:consumerId` | Create alert |
| PATCH | `/alerts/:consumerId/:alertId/read` | Mark single alert read |
| PATCH | `/alerts/:consumerId/read-all` | Mark all read |

### Tariff
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/tariff?connection_type=LT-B+Domestic` | Get tariff slabs |
| GET | `/tariff/calculate?units=284` | Calculate bill amount |

### Complaints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/complaints/:consumerId` | Get all complaints |
| POST | `/complaints/:consumerId` | Raise a complaint |
| PATCH | `/complaints/:consumerId/:complaintId/status` | Update status |

**Raise Complaint body:**
```json
{
  "subject": "Incorrect bill amount",
  "description": "Bill amount seems higher than consumption",
  "category": "billing"
}
```

### Meter Readings
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/meter/:consumerId/readings?hours=24` | Get meter readings |
| POST | `/meter/:consumerId/readings` | Push a meter reading |

---

## 🗃️ Database Tables

| Table | Description |
|-------|-------------|
| `consumers` | Consumer profiles & meter info |
| `meter_readings` | Hourly/live meter readings |
| `monthly_consumption` | Billing periods with charges breakdown |
| `daily_consumption` | Per-day kWh usage |
| `tariff_slabs` | Tariff rate slabs by connection type |
| `alerts` | Smart meter notifications |
| `complaints` | Consumer complaints |
| `payments` | Payment transactions |
| `platform_stats` | Global stats shown in hero section |

---

## 🔧 Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Server port |
| `NODE_ENV` | `development` | Environment |
| `DB_PATH` | `./data/apdcl.db` | SQLite database path |
| `API_PREFIX` | `/api/v1` | API route prefix |
| `RATE_LIMIT_WINDOW_MS` | `900000` | Rate limit window (15 min) |
| `RATE_LIMIT_MAX` | `100` | Max requests per window |
| `CORS_ORIGIN` | `*` | Allowed CORS origins |

---

## 📡 Connecting Frontend to Backend

The frontend (`public/index.html`) is served statically by Express.  
To wire up the live data, add fetch calls in the frontend script:

```javascript
const API = 'http://localhost:3000/api/v1';
const CONSUMER = 'ASM-GHY-048271';

// Load KPI summary
fetch(`${API}/consumption/${CONSUMER}/summary`)
  .then(r => r.json())
  .then(({ data }) => {
    document.querySelector('.kpi-value').textContent = `${data.current_month_units} kWh`;
  });

// Load daily chart
fetch(`${API}/consumption/${CONSUMER}/daily?month=2026-02`)
  .then(r => r.json())
  .then(({ data }) => renderChart('daily', data));

// Consumer lookup
document.querySelector('.lkp-form button').addEventListener('click', () => {
  const id = document.querySelector('.lkp-form input').value.trim();
  fetch(`${API}/consumers/${id}`)
    .then(r => r.json())
    .then(({ data }) => console.log(data));
});
```

---

## 📦 Dependencies

| Package | Purpose |
|---------|---------|
| `express` | Web framework |
| `better-sqlite3` | Fast synchronous SQLite driver |
| `cors` | Cross-Origin Resource Sharing |
| `helmet` | HTTP security headers |
| `morgan` | HTTP request logger |
| `express-rate-limit` | API rate limiting |
| `dotenv` | Environment variable loading |
| `pdfkit` | Bill PDF generation (ready to use) |

---

## 📜 License

Government of Assam · APDCL Smart Grid Division
