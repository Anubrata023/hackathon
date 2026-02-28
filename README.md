# NagraSeva Backend API

Node.js + Express REST API for the NagraSeva Government Utility Portal.  
Database: **MySQL** | Auth: **JWT Bearer tokens**

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env with your MySQL credentials and JWT secret

# 3. Start (development)
npm run dev

# 4. Start (production)
npm start
```

The server auto-creates all required MySQL tables on first boot.

---

## Project Structure

```
nagraseva-backend/
├── server.js                  # Entry point
├── config/
│   ├── db.js                  # MySQL connection pool
│   └── initSchema.js          # Auto-creates tables on boot
├── middleware/
│   ├── auth.js                # JWT authentication
│   └── errorHandler.js        # Global error handler + asyncHandler
├── controllers/
│   ├── authController.js      # Signup, Login, Me
│   ├── userController.js      # Profile CRUD
│   └── applicationController.js # Service applications CRUD
├── routes/
│   ├── auth.js
│   ├── users.js
│   └── applications.js
└── utils/
    ├── aadhaar.js             # Validation & masking
    ├── audit.js               # Audit log writer
    └── serviceCode.js         # Service reference generator
```

---

## API Reference

All protected routes require:  
`Authorization: Bearer <token>`

---

### Auth

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/signup` | ❌ | Register new citizen |
| POST | `/api/auth/login`  | ❌ | Login, receive JWT |
| GET  | `/api/auth/me`     | ✅ | Get current user |

**POST /api/auth/signup**
```json
{
  "full_name": "Rajesh Kumar",
  "date_of_birth": "1990-05-15",
  "gender": "Male",
  "email": "rajesh@example.com",
  "phone_number": "9876543210",
  "aadhaar_last4": "1234",
  "password": "SecurePass1",
  "address_line1": "12 MG Road",
  "city": "Bengaluru",
  "state": "Karnataka",
  "pincode": "560001"
}
```

**POST /api/auth/login**
```json
{ "email": "rajesh@example.com", "password": "SecurePass1" }
```

---

### User Profile

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET    | `/api/users/profile` | ✅ | Fetch own profile |
| PUT    | `/api/users/profile` | ✅ | Update own profile |
| DELETE | `/api/users/profile` | ✅ | Delete account |

---

### Service Applications

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST   | `/api/applications`           | ✅ | Create application (Draft) |
| GET    | `/api/applications`           | ✅ | List own applications |
| GET    | `/api/applications/:id`       | ✅ | Get single application |
| PUT    | `/api/applications/:id`       | ✅ | Edit (Draft only) |
| PATCH  | `/api/applications/:id/submit`| ✅ | Submit a Draft |
| PATCH  | `/api/applications/:id/status`| ✅ | Officer: update status |
| DELETE | `/api/applications/:id`       | ✅ | Delete (Draft/Cancelled) |

**POST /api/applications**
```json
{
  "service_type": "Water Connection",
  "description": "New domestic water connection required",
  "applicant_aadhaar_last4": "1234",
  "priority": "Normal",
  "due_date": "2025-06-01"
}
```

**GET /api/applications** — Query params:
- `status` — filter by status (e.g. `Submitted`)
- `service_type` — partial match
- `page`, `limit` — pagination (default: page=1, limit=10)

**PATCH /api/applications/:id/status**
```json
{
  "status": "Approved",
  "status_remarks": "All documents verified.",
  "reviewed_by": "Officer Priya Sharma"
}
```

---

## Application Status Flow

```
Draft → Submitted → Under Review → Approved
                                 → Rejected
                 → Additional Info Required → Submitted
→ Cancelled (at any stage by citizen, if allowed)
```

---

## Aadhaar Compliance

- The **full 12-digit Aadhaar number is never stored** (Aadhaar Act, 2016).
- Only the **last 4 digits** are accepted and persisted.
- All API responses return the masked form: `XXXX-XXXX-1234`.
- Validation rejects anything that is not exactly 4 numeric digits.

---

## Security Features

- Passwords hashed with **bcryptjs** (12 salt rounds)
- **JWT** tokens (7-day expiry, configurable)
- **Rate limiting**: 10 req/15 min on auth endpoints; 200 req/15 min globally
- **express-validator** on all input fields
- **Audit log** for every INSERT / UPDATE / DELETE
- MySQL duplicate-entry errors mapped to clean 409 responses
