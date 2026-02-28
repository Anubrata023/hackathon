# 🎓 GMC Scholarship Portal — Backend API

> Complete Node.js/Express backend for the **Guwahati Municipal Corporation Scholarship Portal**.

---

## 📐 Architecture Overview

```
scholarship-backend/
├── prisma/
│   └── schema.prisma          # Full PostgreSQL schema (12 models)
├── scripts/
│   └── seed.js                # Database seeder (scholarships, notices, users)
├── src/
│   ├── index.js               # Server entry point
│   ├── app.js                 # Express app (middleware, routes)
│   ├── config/
│   │   ├── database.js        # Prisma client + connection
│   │   ├── redis.js           # Redis client + connection
│   │   └── logger.js          # Winston logger
│   ├── routes/
│   │   ├── index.js           # Master router
│   │   ├── auth.routes.js     # Authentication (OTP + password)
│   │   ├── scholarship.routes.js
│   │   ├── application.routes.js
│   │   ├── document.routes.js
│   │   ├── notice.routes.js
│   │   ├── profile.routes.js
│   │   ├── eligibility.routes.js
│   │   ├── notification.routes.js
│   │   ├── admin.routes.js
│   │   └── disbursement.routes.js
│   ├── controllers/           # One controller per resource
│   ├── middleware/
│   │   ├── auth.js            # JWT authenticate + role authorize
│   │   ├── validate.js        # Joi schema validation
│   │   ├── upload.js          # Multer file upload
│   │   ├── cache.js           # Redis response caching
│   │   └── errorHandler.js    # Centralized error handling
│   ├── services/
│   │   ├── eligibility.service.js  # Scoring engine (matching logic)
│   │   ├── notification.service.js
│   │   ├── email.service.js   # Nodemailer templates
│   │   ├── sms.service.js     # MSG91 OTP delivery
│   │   ├── storage.service.js # Local / S3 file storage
│   │   └── audit.service.js   # Audit log writer
│   └── validators/            # Joi schemas for every endpoint
└── .env.example
```

---

## 🗄️ Database Schema

| Model | Purpose |
|-------|---------|
| `User` | Auth — phone + optional email/password |
| `UserSession` | Refresh token sessions |
| `OtpToken` | OTP state (Redis-backed, DB fallback) |
| `StudentProfile` | Personal, academic & bank details |
| `Scholarship` | Scholarship definitions with eligibility rules |
| `Application` | Student ↔ Scholarship applications |
| `ApplicationStatusHistory` | Full audit trail of status changes |
| `Document` | Uploaded files (marksheets, certificates) |
| `ApplicationDocument` | Document ↔ Application junction |
| `Disbursement` | Payment records linked to approved applications |
| `Notice` | Circulars, alerts, deadlines from the frontend |
| `EligibilityCheck` | Analytics for the eligibility checker tool |
| `Notification` | In-app notifications per user |
| `AuditLog` | Admin-visible action log |

---

## 🔑 Authentication Flow

### Students (OTP-based)
```
POST /api/v1/auth/otp/send    { phone: "9876543210" }
POST /api/v1/auth/otp/verify  { phone: "9876543210", otp: "123456" }
```
→ Returns `{ accessToken, refreshToken }`

### Admin / Verifiers (password-based)
```
POST /api/v1/auth/login       { email, password }
```
→ Returns `{ accessToken, refreshToken }`

### Refresh
```
POST /api/v1/auth/refresh     { refreshToken }
```

All protected endpoints require: `Authorization: Bearer <accessToken>`

---

## 📋 Complete API Reference

### Authentication
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/otp/send` | Public | Send OTP to phone |
| POST | `/auth/otp/verify` | Public | Verify OTP → tokens |
| POST | `/auth/register` | Public | Password-based registration |
| POST | `/auth/login` | Public | Password login |
| POST | `/auth/refresh` | Public | Rotate refresh token |
| POST | `/auth/logout` | Student | Invalidate session |
| GET | `/auth/me` | Student | Current user info |
| POST | `/auth/forgot-password` | Public | Send reset link |
| POST | `/auth/reset-password` | Public | Set new password |

### Scholarships
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/scholarships` | Public | List (filter/search/paginate) |
| GET | `/scholarships/featured` | Public | Featured scholarship |
| GET | `/scholarships/:slug` | Public | Scholarship detail |
| GET | `/scholarships/:slug/application-status` | Student | Has user applied? |
| POST | `/scholarships` | Admin | Create scholarship |
| PUT | `/scholarships/:id` | Admin | Update scholarship |
| PATCH | `/scholarships/:id/status` | Admin | Change status |
| DELETE | `/scholarships/:id` | Super Admin | Archive |

### Applications
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/applications` | Student | My applications |
| POST | `/applications` | Student | Start new application |
| GET | `/applications/:id` | Student/Admin | Application detail |
| PUT | `/applications/:id` | Student | Update draft |
| POST | `/applications/:id/submit` | Student | Submit for review |
| POST | `/applications/:id/cancel` | Student | Cancel draft/submitted |
| GET | `/applications/:id/timeline` | Student/Admin | Status history |
| GET | `/applications/:id/download` | Student/Admin | Download as PDF |
| POST | `/applications/:id/verify` | Verifier | Institution verify |
| GET | `/applications/admin/all` | Admin | All applications |
| PATCH | `/applications/:id/status` | Admin | Approve/reject |
| POST | `/applications/admin/bulk-approve` | Admin | Bulk approve |

### Documents
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/documents/upload` | Student | Upload document |
| GET | `/documents` | Student | My documents |
| GET | `/documents/:id/meta` | Student/Admin | File metadata |
| GET | `/documents/:id` | Student/Admin | Stream file |
| DELETE | `/documents/:id` | Student | Delete (if unattached) |
| PATCH | `/documents/:id/verify` | Verifier/Admin | Mark verified |

### Profile
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/profile` | Student | Get profile + docs |
| POST | `/profile` | Student | Create profile |
| PUT | `/profile` | Student | Update profile |
| PUT | `/profile/bank` | Student | Update bank details |

### Eligibility Checker
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/eligibility/check` | Public | Match user to scholarships |
| GET | `/eligibility/result/:sessionId` | Public | Retrieve saved result |

### Notices
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/notices` | Public | List notices (filterable) |
| GET | `/notices/:slug` | Public | Notice detail |
| POST | `/notices` | Admin | Create notice |
| PUT | `/notices/:id` | Admin | Update notice |
| DELETE | `/notices/:id` | Super Admin | Deactivate |

### Disbursements
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/disbursements/my` | Student | My disbursements |
| GET | `/disbursements/:applicationId` | Student/Admin | Disbursement detail |
| POST | `/disbursements` | Admin | Initiate disbursement |
| PATCH | `/disbursements/:id/status` | Admin | Update status |

### Admin
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/admin/stats` | Admin | Dashboard KPIs |
| GET | `/admin/users` | Admin | All users |
| GET | `/admin/users/:id` | Admin | User detail |
| PATCH | `/admin/users/:id/role` | Admin | Change role |
| PATCH | `/admin/users/:id/block` | Admin | Block/unblock |
| GET | `/admin/reports/applications` | Admin | Application report |
| GET | `/admin/reports/disbursements` | Admin | Disbursement report |
| GET | `/admin/reports/scholarships` | Admin | Scholarship report |
| GET | `/admin/audit-log` | Admin | Audit log |

### Notifications
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/notifications` | Student | List notifications |
| GET | `/notifications/unread-count` | Student | Badge count |
| PATCH | `/notifications/:id/read` | Student | Mark read |
| POST | `/notifications/mark-all-read` | Student | Mark all read |
| DELETE | `/notifications/:id` | Student | Delete notification |

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Redis 7+

### Setup
```bash
# 1. Clone and install dependencies
cd scholarship-backend
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env with your database URL, JWT secret, SMTP, SMS credentials

# 3. Run database migrations
npx prisma migrate dev --name init

# 4. Generate Prisma client
npx prisma generate

# 5. Seed the database
npm run seed

# 6. Start development server
npm run dev
```

Server starts on http://localhost:4000
API available at http://localhost:4000/api/v1

---

## 🔐 Security Features

| Feature | Implementation |
|---------|---------------|
| Auth | JWT access (7d) + refresh (30d) with rotation |
| OTP | 6-digit, 10-minute expiry, 3-attempt limit, Redis-backed |
| Rate Limiting | 100 req/15min global; 10 req/15min for auth |
| File Upload | Type allowlist (PDF/JPEG/PNG/WebP), 5MB limit |
| Role Guards | STUDENT / VERIFIER / ADMIN / SUPER_ADMIN |
| Input Validation | Joi schemas on every mutating endpoint |
| Security Headers | Helmet (CSP, HSTS, etc.) |
| Audit Log | Every sensitive action is logged with userId + IP |
| Password | bcrypt (12 rounds) |

---

## 🧩 Eligibility Scoring Engine

The `POST /eligibility/check` endpoint uses a weighted scoring algorithm:

| Criterion | Points |
|-----------|--------|
| Category match | 30 |
| Academic level match | 30 |
| Income group match | 20 |
| Percentage meets minimum | 15 |
| District match | 10 |
| Gender/minority/disability | 10 |
| Seat available | 5 |

A scholarship is **eligible** when all hard criteria pass (score at full value).
A scholarship is **partially eligible** when ≤1 criterion fails (useful for guidance).

---

## 📧 Email Templates

- Welcome email on registration
- Application confirmation with tracking link
- Password reset link
- Disbursement credit alert

---

## 🏗️ Production Deployment Notes

1. **Storage**: Switch `STORAGE_TYPE=s3` and configure AWS credentials in `.env`
2. **SMS**: Set `SMS_PROVIDER=msg91` and configure MSG91 API key + OTP template
3. **PDF Generation**: Integrate `puppeteer` or `pdf-lib` in `downloadApplicationPDF` controller
4. **NSP Integration**: Add webhook handlers for National Scholarship Portal status syncs
5. **Database**: Use connection pooling (PgBouncer) and read replicas for high load
6. **Redis**: Use Redis Cluster or ElastiCache for production
7. **Monitoring**: Add Sentry for error tracking, Prometheus metrics endpoint
