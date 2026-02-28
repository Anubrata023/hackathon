# Guwahati Municipal Corporation — Citizen Service Portal Backend

**Pure-Python backend (stdlib only — no pip installs needed)**  
Works with Python 3.10+

---

## Quick Start

```bash
python3 server.py
# Server starts at http://localhost:8000
# API at     http://localhost:8000/api
# Frontend   http://localhost:8000/          (static/index.html)
```

**Demo credentials**  
- Mobile: `9876543210`  
- Password: `Demo@1234`

---

## Architecture

```
gmc-backend/
├── server.py           # HTTP server + request router
├── config.py           # Environment & constants
├── auth.py             # HMAC-SHA256 JWT-compatible tokens
├── db.py               # SQLite schema, seed data, query helpers
├── handlers/
│   ├── citizens.py     # Auth: register, login, profile
│   ├── services.py     # Service catalogue + portal stats
│   ├── complaints.py   # Grievances / Digital Jan Sunwai
│   ├── water.py        # Water connections, leakages, quality
│   ├── garbage.py      # Garbage reports, bulk pickup
│   ├── tax.py          # Property tax calculation & payment
│   ├── trade_licence.py# Trade licence apply & renew
│   ├── certificates.py # Birth & death certificates
│   ├── building_plan.py# Building plan submissions
│   ├── rti.py          # RTI portal
│   ├── documents.py    # AI document verification
│   ├── notices.py      # Notices & circulars
│   ├── payments.py     # Generic payment gateway
│   └── search.py       # Global search
├── static/             # Serve your frontend HTML here
│   └── index.html      # (copy of municipal_corporation_page_.html)
├── db/
│   └── gmc.sqlite3     # Auto-created SQLite database
└── uploads/            # File upload staging area
```

---

## Environment Variables

| Variable         | Default              | Description             |
|-----------------|----------------------|-------------------------|
| `GMC_HOST`      | `0.0.0.0`            | Bind address            |
| `GMC_PORT`      | `8000`               | Port                    |
| `GMC_DB`        | `db/gmc.sqlite3`     | SQLite file path        |
| `GMC_SECRET`    | *(change in prod!)*  | JWT signing secret      |
| `GMC_TOKEN_DAYS`| `7`                  | Token validity (days)   |
| `GMC_STATIC`    | `static/`            | Static files directory  |

---

## API Reference

All endpoints return `Content-Type: application/json`.  
Protected endpoints require `Authorization: Bearer <token>` header.

### Authentication

| Method | Endpoint              | Auth | Description           |
|--------|-----------------------|------|-----------------------|
| POST   | `/api/auth/register`  | ✗    | Register new citizen  |
| POST   | `/api/auth/login`     | ✗    | Login, get token      |
| GET    | `/api/auth/profile`   | ✓    | Get own profile       |
| PUT    | `/api/auth/profile`   | ✓    | Update profile        |

**Register body:**
```json
{ "mobile": "9876543210", "name": "Rajiv Sharma", "password": "Min6chars",
  "email": "r@example.com", "ward": 5, "address": "12 Lachit Nagar" }
```

**Login body:**
```json
{ "mobile": "9876543210", "password": "Demo@1234" }
```

---

### Services

| Method | Endpoint            | Auth | Description                  |
|--------|---------------------|------|------------------------------|
| GET    | `/api/services`     | ✗    | List all services (`?category=&q=`) |
| GET    | `/api/services/{id}`| ✗    | Get service by id or slug    |
| GET    | `/api/stats`        | ✗    | Hero band stats              |

---

### Complaints / Jan Sunwai

| Method | Endpoint                       | Auth | Description         |
|--------|--------------------------------|------|---------------------|
| GET    | `/api/complaints`              | ✓    | List own complaints |
| POST   | `/api/complaints`              | ✓    | File a complaint    |
| GET    | `/api/complaints/{id}`         | ✗    | Get complaint       |
| PUT    | `/api/complaints/{id}/status`  | ✓    | Update status       |

**Create complaint:**
```json
{ "category": "Water", "subject": "No supply", "description": "...", "ward": 5 }
```

---

### Water Supply

| Method | Endpoint                      | Auth | Description               |
|--------|-------------------------------|------|---------------------------|
| GET    | `/api/water/connections`      | ✓    | List my connections        |
| POST   | `/api/water/connections`      | ✓    | Apply for connection       |
| POST   | `/api/water/leakages`         | ✓    | Report leakage             |
| GET    | `/api/water/quality/{ward}`   | ✗    | Water quality certificate  |

---

### Garbage & Sanitation

| Method | Endpoint                       | Auth | Description          |
|--------|--------------------------------|------|----------------------|
| POST   | `/api/garbage/report`          | ✓    | Report issue         |
| POST   | `/api/garbage/bulk-pickup`     | ✓    | Schedule bulk pickup |
| GET    | `/api/garbage/schedule/{ward}` | ✗    | Ward schedule        |

---

### Property Tax

| Method | Endpoint                    | Auth | Description                |
|--------|-----------------------------|------|----------------------------|
| GET    | `/api/tax/calculate`        | ✗    | Calculate tax (`?property_uid=` or `?annual_value=`) |
| GET    | `/api/tax/dues`             | ✓    | My pending dues            |
| POST   | `/api/tax/pay`              | ✓    | Pay tax                    |
| GET    | `/api/tax/receipts`         | ✓    | List receipts              |
| GET    | `/api/tax/receipts/{id}`    | ✓    | Download receipt           |

---

### Trade Licence

| Method | Endpoint                        | Auth | Description         |
|--------|---------------------------------|------|---------------------|
| GET    | `/api/trade-licence`            | ✓    | My licences         |
| POST   | `/api/trade-licence`            | ✓    | Apply               |
| GET    | `/api/trade-licence/{id}`       | ✓    | Get licence         |
| PUT    | `/api/trade-licence/{id}/renew` | ✓    | Renew licence       |

---

### Certificates

| Method | Endpoint                            | Auth | Description      |
|--------|-------------------------------------|------|------------------|
| GET    | `/api/certificates`                 | ✓    | My certificates  |
| POST   | `/api/certificates/apply`           | ✓    | Apply            |
| GET    | `/api/certificates/{id}/download`   | ✓    | Download         |

---

### Building Plan

| Method | Endpoint                  | Auth | Description      |
|--------|---------------------------|------|------------------|
| GET    | `/api/building-plans`     | ✓    | My submissions   |
| POST   | `/api/building-plans`     | ✓    | Submit plan      |
| GET    | `/api/building-plans/{id}`| ✓    | Get plan         |

---

### RTI

| Method | Endpoint         | Auth | Description     |
|--------|-----------------|------|-----------------|
| GET    | `/api/rti`      | ✓    | My requests     |
| POST   | `/api/rti`      | ✓    | File request    |
| GET    | `/api/rti/{id}` | ✓    | Get request     |

---

### AI Document Verification

| Method | Endpoint                  | Auth | Description         |
|--------|---------------------------|------|---------------------|
| POST   | `/api/documents/verify`   | ✗    | Verify document     |
| GET    | `/api/documents/{id}`     | ✗    | Get verification    |

**Verify body:**
```json
{ "doc_type": "property", "filename": "deed.pdf", "file_base64": "..." }
```
`doc_type`: `property` | `trade_licence` | `building_plan` | `birth` | `death`

---

### Notices

| Method | Endpoint           | Auth | Description                 |
|--------|--------------------|------|-----------------------------|
| GET    | `/api/notices`     | ✗    | List (`?tag=alert|notice…`) |
| GET    | `/api/notices/{id}`| ✗    | Get notice                  |

---

### Payments

| Method | Endpoint                       | Auth | Description      |
|--------|--------------------------------|------|------------------|
| POST   | `/api/payments/initiate`       | ✓    | Start payment    |
| GET    | `/api/payments/{ref}/status`   | ✓    | Check status     |

---

### Search

| Method | Endpoint        | Auth | Description           |
|--------|-----------------|------|-----------------------|
| GET    | `/api/search`   | ✗    | `?q=keyword&limit=10` |

---

## Database Schema (SQLite)

13 tables:
`citizens`, `services`, `complaints`,
`water_connections`, `water_leakages`, `water_quality`,
`garbage_reports`, `bulk_pickup_requests`,
`properties`, `tax_payments`,
`trade_licences`, `certificate_requests`,
`building_plans`, `rti_requests`,
`document_verifications`, `notices`, `payments`

---

## Connecting the Frontend

Add this JS snippet inside the frontend `<script>` tag to wire up the search bar:

```javascript
const API = 'http://localhost:8000/api';

document.querySelector('.nav-search input').addEventListener('input', async (e) => {
  const q = e.target.value.trim();
  if (q.length < 2) return;
  const res = await fetch(`${API}/search?q=${encodeURIComponent(q)}`);
  const data = await res.json();
  console.log('Search results:', data.results);
  // Render into a dropdown below the search input
});
```

For authenticated requests, store the token from login response and include it:
```javascript
const token = localStorage.getItem('gmc_token');
const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };
```

---

## Production Checklist

- [ ] Set `GMC_SECRET` to a strong random value (32+ chars)
- [ ] Enable HTTPS (put Nginx/Caddy in front)
- [ ] Replace simulated AI verification with real ML model
- [ ] Replace payment simulation with actual payment gateway (Razorpay/PayU)
- [ ] Add rate limiting middleware
- [ ] Set up database backups (SQLite → object storage)
- [ ] Add proper logging (structured JSON logs)
- [ ] Consider migrating to PostgreSQL for production scale

---

*© 2026 Guwahati Municipal Corporation · Government of Assam*
