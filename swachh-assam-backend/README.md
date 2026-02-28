# ♻️ Swachh Assam — Backend API

Complete Node.js/Express REST API backend for the **Swachh Assam Waste Management Portal**.

---

## 🗂️ Project Structure

```
swachh-assam-backend/
├── src/
│   ├── server.js                  # Entry point
│   ├── config/
│   │   └── database.js            # SQLite setup & helpers
│   ├── middleware/
│   │   ├── auth.js                # JWT authentication
│   │   └── errorHandler.js        # Global error handling
│   ├── controllers/
│   │   ├── authController.js      # Register / Login / Me
│   │   ├── complaintsController.js # Complaint submission & tracking
│   │   ├── scheduleController.js  # Collection schedules
│   │   ├── bulkPickupController.js # Bulk pickup bookings
│   │   └── servicesController.js  # Points, notices, audit, composting
│   ├── routes/
│   │   └── index.js               # All route definitions
│   └── utils/
│       ├── helpers.js             # Ref numbers, SMS, validators
│       └── seed.js                # Database seeder
├── data/                          # SQLite database (auto-created)
├── uploads/                       # Complaint images (auto-created)
├── .env                           # Environment variables
└── package.json
```

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Edit `.env` with your settings (JWT secret, SMS API keys, etc.)

### 3. Seed the Database
```bash
npm run seed
```

### 4. Start the Server
```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

Server starts at: **http://localhost:3000**

---

## 🔐 Default Credentials (after seeding)

| Role         | Mobile       | Password     |
|--------------|--------------|--------------|
| Admin        | 9999999999   | Admin@1234   |
| Field Officer| 9876543210   | Officer@123  |
| Field Officer| 9876543211   | Officer@123  |

---

## 📡 API Endpoints

### Health
| Method | Endpoint  | Description       |
|--------|-----------|-------------------|
| GET    | `/health` | Server health check |

---

### Auth
| Method | Endpoint                   | Auth | Description        |
|--------|----------------------------|------|--------------------|
| POST   | `/api/auth/register`       | ❌   | Register citizen   |
| POST   | `/api/auth/login`          | ❌   | Login              |
| GET    | `/api/auth/me`             | ✅   | Get profile        |
| POST   | `/api/auth/change-password`| ✅   | Change password    |

**Register body:**
```json
{
  "name": "Ramesh Kalita",
  "mobile": "9876543000",
  "email": "ramesh@example.com",
  "password": "Pass@1234",
  "ward": "Ward 1 – Panbazar"
}
```

---

### Complaints
| Method | Endpoint                           | Auth          | Description              |
|--------|------------------------------------|---------------|--------------------------|
| POST   | `/api/complaints`                  | ❌ (public)   | Submit complaint         |
| GET    | `/api/complaints/track/:refNum`    | ❌ (public)   | Track by reference number|
| GET    | `/api/complaints`                  | ✅ Admin/Officer | List all complaints    |
| PATCH  | `/api/complaints/:id/status`       | ✅ Admin/Officer | Update status          |
| GET    | `/api/complaints/stats`            | ✅ Admin      | Complaint statistics     |

**Submit Complaint (form-data, supports image upload):**
```
POST /api/complaints
Content-Type: multipart/form-data

user_name: Ramesh Kalita
mobile: 9876543000
ward: Ward 1 – Panbazar
issue_type: Overflowing Public Bin
description: The bin near Fancy Bazar market is overflowing
image: [optional jpg/png file]
latitude: 26.1800  (optional)
longitude: 91.7500 (optional)
```

**Response:**
```json
{
  "success": true,
  "message": "Complaint submitted successfully",
  "data": {
    "reference_number": "GUW-2026-47283",
    "complaint_id": 1,
    "status": "pending",
    "priority": "high",
    "estimated_resolution": "24 hours"
  }
}
```

**Track Complaint:**
```
GET /api/complaints/track/GUW-2026-47283
```

**Update Status (Admin/Officer):**
```json
PATCH /api/complaints/1/status
Authorization: Bearer <token>

{
  "status": "resolved",
  "note": "Field team cleaned the area",
  "assigned_officer_id": 2
}
```
Valid statuses: `pending` → `assigned` → `in_progress` → `resolved` → `closed`

---

### Collection Schedule
| Method | Endpoint                   | Auth     | Description                   |
|--------|----------------------------|----------|-------------------------------|
| GET    | `/api/schedule`            | ❌       | Get weekly schedule           |
| GET    | `/api/schedule/today`      | ❌       | What's collected today        |
| POST   | `/api/schedule`            | ✅ Admin | Create schedule entry         |
| POST   | `/api/schedule/override`   | ✅ Admin | Add holiday/override notice   |

**Query params for GET /api/schedule:**
```
?ward=Ward 1 – Panbazar
?zone=Zone A
```

---

### Bulk Pickup
| Method | Endpoint                           | Auth     | Description           |
|--------|------------------------------------|----------|-----------------------|
| GET    | `/api/bulk-pickup/options`         | ❌       | Time slots & types    |
| POST   | `/api/bulk-pickup`                 | ❌       | Book a pickup         |
| GET    | `/api/bulk-pickup/track/:refNum`   | ❌       | Track booking         |
| GET    | `/api/bulk-pickup`                 | ✅ Admin | List all bookings     |
| PATCH  | `/api/bulk-pickup/:id/status`      | ✅ Admin | Update booking status |

**Book Pickup:**
```json
{
  "user_name": "Priya Das",
  "mobile": "9876500099",
  "ward": "Ward 2 – Dispur",
  "address": "House No. 12, Dispur Main Road",
  "waste_type": "Old Furniture",
  "estimated_quantity": "2 large sofas, 1 wardrobe",
  "preferred_date": "2026-03-15",
  "preferred_time_slot": "09:00 AM - 12:00 PM"
}
```

---

### Swachh Points
| Method | Endpoint             | Auth          | Description         |
|--------|----------------------|---------------|---------------------|
| GET    | `/api/points`        | ✅ Citizen    | View my points      |
| POST   | `/api/points/award`  | ✅ Admin      | Award points        |
| POST   | `/api/points/redeem` | ✅ Citizen    | Redeem points       |

---

### Notices
| Method | Endpoint           | Auth     | Description         |
|--------|--------------------|----------|---------------------|
| GET    | `/api/notices`     | ❌       | Get active notices  |
| POST   | `/api/notices`     | ✅ Admin | Create notice       |
| DELETE | `/api/notices/:id` | ✅ Admin | Deactivate notice   |

---

### Services
| Method | Endpoint                    | Auth | Description                   |
|--------|-----------------------------|------|-------------------------------|
| POST   | `/api/audit/request`        | ❌   | Request waste audit           |
| POST   | `/api/composting/register`  | ❌   | Join composting programme     |
| GET    | `/api/stats`                | ❌   | Portal statistics (homepage)  |
| GET    | `/api/wards`                | ❌   | List all wards                |

---

## 🔒 Authentication

Use Bearer token in the Authorization header:
```
Authorization: Bearer <token>
```

Tokens are JWT, valid for 7 days by default.

---

## 📁 File Uploads

Complaint images are:
- Stored in `/uploads/` directory
- Accessible via `GET /uploads/<filename>`
- Max size: 5MB
- Formats: JPG, PNG, WEBP

---

## 🗄️ Database

SQLite database is auto-created at `./data/swachh_assam.db`.

**Tables:**
- `users` — Citizens, admins, field officers
- `complaints` — Garbage complaints
- `complaint_history` — Status change audit trail
- `bulk_pickups` — Bulk waste pickup bookings
- `collection_schedules` — Weekly ward-wise schedules
- `schedule_overrides` — Holidays / rescheduling
- `points_transactions` — Swachh Points ledger
- `audit_requests` — Waste audit requests
- `composting_registrations` — Composting programme
- `notices` — Portal announcements
- `daily_stats` — Analytics data

---

## 🌐 Frontend Integration

Update the frontend `handleSubmit` function to call the real API:

```javascript
async function handleSubmit(e) {
  e.preventDefault();
  const formData = new FormData(e.target);
  
  const response = await fetch('http://localhost:3000/api/complaints', {
    method: 'POST',
    body: formData  // supports file uploads
  });
  
  const result = await response.json();
  if (result.success) {
    // Show reference number: result.data.reference_number
  }
}
```

---

## 🚢 Production Deployment

1. Set `NODE_ENV=production` in `.env`
2. Set a strong `JWT_SECRET`
3. Configure real SMS provider (MSG91/Twilio)
4. Use a reverse proxy (Nginx) in front of Node
5. Use PM2 for process management: `pm2 start src/server.js --name swachh-assam`
6. Consider migrating from SQLite to PostgreSQL for high traffic

---

## 📞 Issue Types (as in the frontend)
- Missed Garbage Collection
- Overflowing Public Bin
- Illegal Dumping / Littering
- Dead Animal on Road
- Construction Debris on Road
- Burning of Waste
- Other
