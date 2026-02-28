# ⛽ Gas Services Portal — Backend API

A production-ready **Node.js + Express + SQLite** backend for the Gas Services Portal.

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
# Edit .env and change JWT_SECRET to something secure
```

### 3. Start the Server
```bash
# Development (hot-reload)
npm run dev

# Production
npm start
```

### 4. (Optional) Seed Demo Data
```bash
node seed.js
```
This creates:
- **Admin**: `admin@gasportal.com` / `Admin@123`
- **Customer**: `customer@example.com` / `Customer@123`
- Demo connection, bills, complaint, and notification

---

## 🗂️ Project Structure

```
gas-backend/
├── server.js                  # Entry point
├── seed.js                    # Demo data seeder
├── .env                       # Environment variables
├── database/
│   └── db.js                  # SQLite init & schema
├── middleware/
│   ├── auth.js                # JWT authentication
│   └── validate.js            # Request validation
├── routes/
│   ├── auth.js
│   ├── connections.js
│   ├── services.js
│   ├── billing.js
│   ├── complaints.js
│   ├── notifications.js
│   └── admin.js
├── controllers/
│   ├── authController.js
│   ├── connectionController.js
│   ├── serviceController.js
│   ├── billingController.js
│   ├── complaintController.js
│   ├── notificationController.js
│   └── adminController.js
└── public/                    # Place your HTML frontend here
    └── index.html             # → gas_services_portal.html
```

---

## 📡 API Reference

> All protected routes require: `Authorization: Bearer <token>`

### 🔐 Auth
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | ❌ | Register new user |
| POST | `/api/auth/login` | ❌ | Login → returns JWT |
| GET | `/api/auth/profile` | ✅ | Get own profile |
| PUT | `/api/auth/profile` | ✅ | Update profile |
| PUT | `/api/auth/change-password` | ✅ | Change password |

### 🔗 Connections
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/connections` | ✅ | My connections |
| GET | `/api/connections/:id` | ✅ | Single connection |
| POST | `/api/connections/apply` | ✅ | Apply for new connection |

### 🔧 Service Requests
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/services/types` | ❌ | Available service types |
| POST | `/api/services` | ✅ | Create service request |
| GET | `/api/services` | ✅ | My requests (filter: `?status=`) |
| GET | `/api/services/:id` | ✅ | Single request |
| DELETE | `/api/services/:id` | ✅ | Cancel request |

### 💳 Billing
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/billing` | ✅ | My bills (filter: `?status=`) |
| GET | `/api/billing/payments` | ✅ | Payment history |
| GET | `/api/billing/:id` | ✅ | Single bill |
| POST | `/api/billing/:id/pay` | ✅ | Pay a bill |

### 📢 Complaints
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/complaints/categories` | ❌ | Complaint categories |
| POST | `/api/complaints` | ✅ | Submit complaint |
| GET | `/api/complaints` | ✅ | My complaints |
| GET | `/api/complaints/:id` | ✅ | Single complaint |

### 🔔 Notifications
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/notifications` | ✅ | My notifications |
| PATCH | `/api/notifications/:id/read` | ✅ | Mark as read |
| PATCH | `/api/notifications/read-all` | ✅ | Mark all as read |
| DELETE | `/api/notifications/:id` | ✅ | Delete notification |

### 👑 Admin (requires admin role)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/dashboard` | Stats overview |
| GET | `/api/admin/users` | All users |
| PATCH | `/api/admin/users/:id/role` | Update user role |
| GET | `/api/admin/connections` | All connections |
| PATCH | `/api/admin/connections/:id/status` | Update connection status |
| GET | `/api/admin/service-requests` | All service requests |
| PATCH | `/api/admin/service-requests/:id` | Update request status |
| GET | `/api/admin/complaints` | All complaints |
| PATCH | `/api/admin/complaints/:id` | Resolve complaint |
| GET | `/api/admin/bills` | All bills |
| POST | `/api/admin/bills/generate` | Generate bill for connection |
| POST | `/api/admin/bills/mark-overdue` | Mark unpaid past-due bills as overdue |
| POST | `/api/admin/notifications/broadcast` | Notify all customers |

---

## 🗄️ Database Schema

| Table | Description |
|-------|-------------|
| `users` | Customers and admins |
| `connections` | Gas connections linked to users |
| `service_requests` | All service requests |
| `bills` | Bills per connection per period |
| `payments` | Payment transactions |
| `complaints` | Customer complaints |
| `notifications` | In-app notifications |

---

## 📦 Deploying to GitHub

```bash
git init
git add .
git commit -m "Initial commit - Gas Services Portal Backend"
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

> ⚠️ The `.gitignore` already excludes `node_modules/`, `.env`, and `*.db` files.
> Make sure to set environment variables in your hosting platform (Render, Railway, etc.)

---

## 🛠️ Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: SQLite via `better-sqlite3`
- **Auth**: JWT (`jsonwebtoken`) + bcrypt (`bcryptjs`)
- **Other**: `uuid`, `cors`, `dotenv`
