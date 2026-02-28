# 🏛️ Government of Assam Portal — Backend

Complete REST API backend for the Government of Assam homepage portal. Built with **Node.js**, **Express**, and **SQLite (better-sqlite3)**.

---

## 📁 Project Structure

```
assam-backend/
├── src/
│   ├── server.js              ← Entry point, all middleware & routes mounted
│   ├── db/
│   │   ├── index.js           ← DB connection singleton (better-sqlite3)
│   │   ├── setup.js           ← Creates all tables + indexes (run once)
│   │   └── seed.js            ← Seeds realistic initial data (admin, services, notices…)
│   ├── routes/
│   │   ├── auth.js            ← Register, Login, Logout, Profile, Change Password
│   │   ├── services.js        ← e-District services CRUD
│   │   ├── notices.js         ← Government notices & orders CRUD
│   │   ├── departments.js     ← Departments CRUD
│   │   ├── grievances.js      ← Citizen grievances: submit + track + manage
│   │   ├── contact.js         ← Contact form submissions
│   │   ├── search.js          ← Full-text cross-entity search + trending
│   │   ├── upload.js          ← File upload (PDF, images, DOCX)
│   │   └── misc.js            ← Stats, Quick Links, Admin Dashboard
│   └── middleware/
│       ├── auth.js            ← JWT authentication + role guards
│       ├── errorHandler.js    ← Validation + 404 + global error handler
│       └── upload.js          ← Multer config (file type/size validation)
├── public/                    ← Place your frontend HTML here (index.html)
├── uploads/                   ← Uploaded files (auto-created)
├── db/                        ← SQLite database file (auto-created)
├── .env.example               ← Environment variable template
├── package.json
└── README.md
```

---

## 🚀 Quick Start

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment
```bash
cp .env.example .env
# Edit .env — set JWT_SECRET to a strong random string
```

### 3. Create the database
```bash
npm run setup
```

### 4. Seed with initial data
```bash
npm run seed
```

### 5. Start the server
```bash
# Development (with auto-restart)
npm run dev

# Production
npm start
```

The API is now running at **http://localhost:3000**

---

## 🌐 Serving the Frontend

Place `assam_homepage_final.html` as `public/index.html`.  
The server automatically serves it at `http://localhost:3000/`.

---

## 🔑 Default Admin Credentials

| Field    | Value                |
|----------|----------------------|
| Email    | admin@assam.gov.in   |
| Password | Admin@Assam2026!     |

> **⚠️ Change these in `.env` before deploying.**

---

## 📡 API Reference

### Base URL: `http://localhost:3000/api`

All responses use:
```json
{ "success": true/false, "data": ..., "message": "..." }
```

---

### 🔐 Authentication (`/api/auth`)

| Method | Endpoint              | Auth Required | Description               |
|--------|-----------------------|---------------|---------------------------|
| POST   | `/register`           | No            | Citizen self-registration |
| POST   | `/login`              | No            | Login (returns JWT)       |
| POST   | `/logout`             | No            | Clear session cookie      |
| GET    | `/me`                 | ✅ Any         | Get current user profile  |
| PUT    | `/profile`            | ✅ Any         | Update name/phone         |
| PUT    | `/change-password`    | ✅ Any         | Change password           |

**Login example:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@assam.gov.in","password":"Admin@Assam2026!"}'
```

---

### 📋 Services — e-District (`/api/services`)

| Method | Endpoint         | Auth Required  | Description             |
|--------|------------------|----------------|-------------------------|
| GET    | `/`              | No             | List all services       |
| GET    | `/categories`    | No             | List service categories |
| GET    | `/:id`           | No             | Get single service      |
| POST   | `/`              | ✅ Admin        | Create service          |
| PUT    | `/:id`           | ✅ Admin        | Update service          |
| DELETE | `/:id`           | ✅ Admin        | Soft-delete service     |

**Query params:** `?lang=en|hi|bn|as&category=municipal`

---

### 📢 Notices & Orders (`/api/notices`)

| Method | Endpoint         | Auth Required     | Description             |
|--------|------------------|-------------------|-------------------------|
| GET    | `/`              | No                | List active notices     |
| GET    | `/categories`    | No                | Distinct categories     |
| GET    | `/:id`           | No                | Single notice           |
| POST   | `/`              | ✅ Officer/Admin   | Publish notice          |
| PUT    | `/:id`           | ✅ Officer/Admin   | Update notice           |
| DELETE | `/:id`           | ✅ Admin           | Soft-delete notice      |

**Query params:** `?lang=as&category=recruitment&department=Home&pinned=true&limit=10&offset=0`

---

### 🏢 Departments (`/api/departments`)

| Method | Endpoint | Auth Required | Description         |
|--------|----------|---------------|---------------------|
| GET    | `/`      | No            | List departments    |
| GET    | `/:id`   | No            | Single department   |
| POST   | `/`      | ✅ Admin       | Create department   |
| PUT    | `/:id`   | ✅ Admin       | Update department   |

---

### 📝 Grievances (`/api/grievances`)

| Method | Endpoint              | Auth Required     | Description                    |
|--------|-----------------------|-------------------|--------------------------------|
| POST   | `/`                   | No                | Submit grievance (public)      |
| GET    | `/track/:ticketId`    | No                | Track by ticket ID (public)    |
| GET    | `/`                   | ✅ Officer/Admin   | List all grievances            |
| GET    | `/:id`                | ✅ Officer/Admin   | Full grievance details         |
| PUT    | `/:id`                | ✅ Officer/Admin   | Update status/priority/remarks |

**Ticket format:** `GRV-2026-AB12X`

---

### 📬 Contact Form (`/api/contact`)

| Method | Endpoint | Auth Required | Description              |
|--------|----------|---------------|--------------------------|
| POST   | `/`      | No            | Submit contact message   |
| GET    | `/`      | ✅ Admin       | List all submissions     |
| PUT    | `/:id`   | ✅ Admin       | Update submission status |

---

### 🔍 Search (`/api/search`)

| Method | Endpoint     | Auth Required | Description                        |
|--------|--------------|---------------|------------------------------------|
| GET    | `/`          | No            | Search services, notices, depts    |
| GET    | `/trending`  | No            | Top 10 search terms (last 7 days)  |

**Example:** `GET /api/search?q=scholarship&lang=as`

---

### 🔗 Misc (`/api/...`)

| Method | Endpoint              | Auth Required | Description              |
|--------|-----------------------|---------------|--------------------------|
| GET    | `/quick-links`        | No            | Sidebar quick links      |
| GET    | `/stats`              | No            | Homepage stats counters  |
| PUT    | `/stats/:key`         | ✅ Admin       | Update a stat value      |
| GET    | `/admin/dashboard`    | ✅ Admin       | Admin summary dashboard  |

---

### 📎 File Upload (`/api/upload`)

| Method | Endpoint | Auth Required | Description                           |
|--------|----------|---------------|---------------------------------------|
| POST   | `/`      | ✅ Any         | Upload file (PDF/DOCX/XLSX/JPG/PNG)   |

**Usage:** `POST /api/upload?type=notices` with `multipart/form-data`, field `file`.  
Returns: `{ "url": "/uploads/notices/filename.pdf" }`

---

## 🗄️ Database Schema

| Table                 | Purpose                                    |
|-----------------------|--------------------------------------------|
| `users`               | Admin, officer, citizen accounts           |
| `services`            | e-District service cards                   |
| `notices`             | Government notices/orders/circulars        |
| `departments`         | Government departments                     |
| `grievances`          | Public grievance submissions + tracking    |
| `contact_submissions` | Contact form messages                      |
| `quick_links`         | Homepage quick-access sidebar links        |
| `site_stats`          | Configurable homepage counters             |
| `search_logs`         | Search analytics                           |
| `service_applications`| Online service applications                |

All text columns have 4 language variants: `_en`, `_hi`, `_bn`, `_as`

---

## 🛡️ Security Features

- **JWT + HTTP-only cookies** for session management
- **bcrypt** password hashing (12 rounds)
- **Helmet** security headers
- **CORS** restricted to configured origin
- **Rate limiting**: 100 req/15min global; 10 req/15min for auth; 30/min for search
- **Input validation** via `express-validator` on all POST/PUT routes
- **Role-based access control**: `citizen` → `officer` → `admin`
- **Soft deletes** — records are never permanently destroyed

---

## 🏗️ Roles & Permissions

| Role       | Can Do                                                       |
|------------|--------------------------------------------------------------|
| `citizen`  | Register, login, submit grievances, contact form             |
| `officer`  | All citizen + publish/edit notices, manage grievances        |
| `admin`    | Full access including user management, site stats, dashboard |

---

## 📦 Tech Stack

| Layer      | Technology                              |
|------------|-----------------------------------------|
| Runtime    | Node.js 18+                             |
| Framework  | Express 4                               |
| Database   | SQLite via better-sqlite3               |
| Auth       | JWT + bcryptjs                          |
| Validation | express-validator                       |
| Security   | Helmet, CORS, express-rate-limit        |
| Uploads    | Multer                                  |
| Logging    | Morgan                                  |

---

## 🌍 Multilingual Support

All content tables store translations in four columns:
- `_en` — English
- `_hi` — Hindi (हिन्दी)
- `_bn` — Bangla (বাংলা)
- `_as` — Assamese (অসমীয়া)

Pass `?lang=as` (or `en`/`hi`/`bn`) to any GET endpoint to receive translated content.

