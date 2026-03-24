# Suvidha Backend API

> Comprehensive RESTful API for Government of Assam Digital Services Portal

[![Node.js](https://img.shields.io/badge/Node.js-v14+-green.svg)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.x-blue.svg)](https://expressjs.com/)
[![License](https://img.shields.io/badge/License-Government-orange.svg)](LICENSE)

## 🏗️ Architecture Overview

**Suvidha Backend** is a Node.js/Express API server that powers all citizen services for the Government of Assam portal. It provides 30+ REST endpoints across 5 service modules with JWT authentication, OTP verification, and dual database support (SQLite/JSON).

### **5 Service Modules**

| Module | Route Prefix | Endpoints | Description |
|--------|-------------|-----------|-------------|
| **Authentication** | `/api/auth` | 5 | OTP login, JWT tokens, profile |
| **Municipal Services** | `/api/municipal` | 8 | Water, waste, grievances |
| **Electricity Services** | `/api/electricity` | 6 | Bills, connections, meters |
| **Gas Services** | `/api/gas` | 5 | LPG booking, connections |
| **Scholarship Services** | `/api/scholarships` | 6 | Browse, apply, track |

**Total**: 30 API endpoints with full CRUD operations

---

## 🚀 Quick Start Guide

### Prerequisites

Ensure you have the following installed on your system:

- **Node.js** (v14.0 or higher) - [Download](https://nodejs.org/)
- **npm** (comes with Node.js) or **yarn**
- **Terminal/Command Prompt** with administrator privileges (for Windows)
- **Git** (optional) - For cloning the repository

### Step-by-Step Installation

#### 1️⃣ Navigate to Backend Directory

```bash
# If you're in the root project directory
cd backend

# Verify you're in the right location
# You should see: server.js, package.json, etc.
ls   # Mac/Linux
dir  # Windows
```

#### 2️⃣ Install Dependencies

```bash
# Using npm (recommended)
npm install

# OR using yarn
yarn install
```

This installs all required packages:
- `express` - Web framework
- `cors` - Cross-origin resource sharing
- `jsonwebtoken` - JWT authentication
- `bcryptjs` - Password hashing
- `helmet` - Security middleware
- `express-rate-limit` - API rate limiting
- `morgan` - HTTP request logger
- `dotenv` - Environment variable management
- `express-validator` - Input validation

**Installation time**: ~30-60 seconds depending on internet speed

#### 3️⃣ Environment Configuration (Optional)

The server works with default settings, but you can customize:

```bash
# Create .env file in backend directory
# (Copy from .env.example if exists, or create new)

PORT=5000
NODE_ENV=development
JWT_SECRET=your_super_secret_key_here_change_in_production
JWT_EXPIRES_IN=7d
OTP_EXPIRY_MINUTES=10
DB_PATH=./data/suvidha.db
FRONTEND_URL=http://localhost:5000
```

**Important**: Change `JWT_SECRET` to a strong random string in production!

#### 4️⃣ Database Initialization

**No manual setup needed!** Database auto-initializes on first run.

The server automatically:
1. Creates `data/` folder if it doesn't exist
2. Initializes SQLite database (`suvidha.db`) or JSON fallback (`db.json`)
3. Creates all required tables
4. Seeds sample data for testing

---

### Running the Server

#### Option 1: Production Mode ✅ Recommended

```bash
npm start
```

**What this does:**
- Starts Express server on port 5000
- Connects to database (SQLite or JSON)
- Initializes all API routes
- Serves static files from `public/` folder
- Logs all HTTP requests

**Expected output:**
```
📦 Using Simple JSON database
🚀 Suvidha API Server running on port 5000
🌐 Frontend served at: http://localhost:5000
📡 API available at: http://localhost:5000/api
```

#### Option 2: Development Mode (Auto-Reload)

```bash
npm run dev
```

Requires `nodemon` (auto-installs with dev dependencies).

**Benefits:**
- Automatically restarts server when you edit files
- Faster development workflow
- Better error messages

---

### Accessing the Application

Once the server is running (look for "🚀 Server running" message):

#### 🌐 Frontend Pages

```bash
# Main Entry Points
http://localhost:5000/                      # Index/landing page
http://localhost:5000/login.html            # Authentication page
http://localhost:5000/main-kiosk.html       # Service kiosk dashboard

# Service Pages
http://localhost:5000/municipal-services.html    # Municipal hub
http://localhost:5000/electricity-services.html  # Electricity portal
http://localhost:5000/gas-services.html          # Gas services
http://localhost:5000/scholarship-portal.html    # Scholarships
http://localhost:5000/water-supply.html          # Water supply
http://localhost:5000/waste-management.html      # Waste management
http://localhost:5000/grievance-portal.html      # Jan Sunwai portal

# Testing Interface
http://localhost:5000/test.html             # Interactive API tester
```

#### 📡 API Endpoints

```bash
# Base URL for all API calls
http://localhost:5000/api

# Example endpoints
http://localhost:5000/api/auth/send-otp           # POST - Send OTP
http://localhost:5000/api/scholarships            # GET - List scholarships
http://localhost:5000/api/municipal/waste/reports # GET - Waste reports (Auth)
```

---

### Testing the API

#### Method 1: Interactive Web Interface (Easiest)

1. **Start the server**:
   ```bash
   npm start
   ```

2. **Open test interface**:
   ```
   http://localhost:5000/test.html
   ```

3. **Test authentication flow**:
   - Click "Send OTP" in Authentication section
   - Enter phone: `9876543210`
   - Check server console for OTP (e.g., `🔐 OTP: 123456`)
   - Enter OTP and name, click "Verify OTP"
   - Token auto-saved for subsequent requests

4. **Test other endpoints**:
   - Switch to Municipal/Electricity/Gas/Scholarship tabs
   - Click any endpoint button
   - View formatted JSON response with color-coded status

#### Method 2: Using cURL (Command Line)

```bash
# 1. Send OTP
curl -X POST http://localhost:5000/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d "{\"phone\": \"9876543210\"}"

# Response: {"success": true, "data": {"otp": "123456"}}

# 2. Verify OTP
curl -X POST http://localhost:5000/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d "{\"phone\": \"9876543210\", \"otp\": \"123456\", \"name\": \"Test User\"}"

# Response: {"success": true, "data": {"token": "eyJhbG..."}}

# 3. Use token for protected routes
curl -X GET http://localhost:5000/api/municipal/waste/reports \
  -H "Authorization: Bearer <paste-token-here>"
```

#### Method 3: Using Postman/Thunder Client

1. **Import Collection**:
   - Base URL: `http://localhost:5000/api`
   - Set environment variable: `baseUrl`

2. **Authentication**:
   - Send OTP → Copy token from response
   - Set Authorization header: `Bearer <token>`
   - All subsequent requests will use this token

3. **Test Endpoints**:
   - Browse through folders (Auth, Municipal, Electricity, Gas, Scholarships)
   - Click "Send" on any request
   - View response in Postman UI

---

### Verification Checklist

After starting the server, verify everything works:

- [ ] Server starts without errors
- [ ] Console shows "🚀 Server running on port 5000"
- [ ] Can access `http://localhost:5000` in browser
- [ ] Database file created in `data/` folder
- [ ] Can open test.html and see API tester interface
- [ ] Can send OTP and receive response
- [ ] Can verify OTP and receive JWT token
- [ ] Protected routes work with token

---

### Common Issues & Solutions

#### ❌ "Port 5000 already in use"

**Windows**:
```bash
# Find process using port 5000
netstat -ano | findstr :5000

# Kill process (replace PID with actual number)
taskkill /PID <PID> /F
```

**Mac/Linux**:
```bash
# Find and kill process
lsof -ti:5000 | xargs kill -9
```

**Or change port**:
```bash
# In .env file
PORT=5001
```

#### ❌ "Cannot find module 'express'"

```bash
# Delete and reinstall
rm -rf node_modules package-lock.json
npm install
```

#### ❌ "ENOENT: no such file or directory, open './data/db.json'"

Server auto-creates this. If error persists:
```bash
mkdir data
# Restart server
```

#### ❌ "JWT expired" or "Token invalid"

- Log in again to get a new token
- Tokens expire after 7 days by default
- Check `JWT_EXPIRES_IN` in .env

---

### Stopping the Server

**All platforms**: Press `Ctrl + C` in the terminal where server is running

**Forcefully kill** (if Ctrl+C doesn't work):
```bash
# Windows
taskkill /IM node.exe /F

# Mac/Linux
killall node
```

---

## 🔐 Authentication System

### OTP-Based Login Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ STEP 1: Send OTP                                                │
│ POST /api/auth/send-otp                                         │
│ Body: { phone: "9876543210" }                                   │
│                                                                  │
│ → Generate 6-digit OTP                                          │
│ → Store in database with 10-min expiry                          │
│ → (Development: Display OTP in console)                         │
│ → (Production: Send via SMS gateway)                            │
│                                                                  │
│ Response: { success: true, data: { phone, otp, expiresIn } }   │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 2: Verify OTP & Login/Signup                              │
│ POST /api/auth/verify-otp                                       │
│ Body: { phone: "9876543210", otp: "123456", name: "John" }     │
│                                                                  │
│ → Validate OTP (correct & not expired)                          │
│ → Check if user exists:                                         │
│   • If YES: Fetch user details (Login)                          │
│   • If NO: Create new user (Signup)                             │
│ → Generate JWT token (expires in 7 days)                        │
│ → Delete used OTP from database                                 │
│                                                                  │
│ Response: { success: true, data: { token, user } }              │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 3: Use Token for Protected Routes                          │
│ GET/POST /api/municipal/*, /api/electricity/*, etc.             │
│ Headers: { Authorization: "Bearer <jwt-token>" }                │
│                                                                  │
│ → Middleware extracts token from header                         │
│ → Verify JWT signature and expiry                               │
│ → Decode token → Extract user ID                                │
│ → Attach user object to req.user                                │
│ → Proceed to controller                                         │
│                                                                  │
│ Response: Service-specific data                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Authentication Examples

#### 1. Send OTP
```http
POST /api/auth/send-otp
Content-Type: application/json

{
  "phone": "9876543210"
}
```

**Success Response:**
```json
{
  "success": true,
  "message": "OTP sent successfully",
  "data": {
    "phone": "919876543210",
    "expiresIn": "10 minutes",
    "otp": "123456"  // Only in development (NODE_ENV=development)
  }
}
```

#### 2. Verify OTP (Login)
```http
POST /api/auth/verify-otp
Content-Type: application/json

{
  "phone": "9876543210",
  "otp": "123456"
}
```

**Success Response (Existing User):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInBob25lIjoiOTE5ODc2NTQzMjEwIiwiaWF0IjoxNzA5MjE0NjAwLCJleHAiOjE3MDk4MTk0MDB9.example",
    "user": {
      "id": 1,
      "phone": "919876543210",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "citizen",
      "created_at": "2026-03-01T10:30:00.000Z"
    }
  }
}
```

#### 3. Verify OTP (Signup - with name)
```http
POST /api/auth/verify-otp
Content-Type: application/json

{
  "phone": "9876543210",
  "otp": "123456",
  "name": "Jane Smith",
  "email": "jane@example.com"  // Optional
}
```

**Success Response (New User):**
```json
{
  "success": true,
  "message": "Signup successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 2,
      "phone": "919876543210",
      "name": "Jane Smith",
      "email": "jane@example.com",
      "role": "citizen",
      "created_at": "2026-03-01T11:00:00.000Z"
    }
  }
}
```

#### 4. Get Current User
```http
GET /api/auth/me
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "phone": "919876543210",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "citizen"
    }
  }
}
```

#### 5. Update Profile
```http
PUT /api/auth/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "John Updated",
  "email": "john.new@example.com"
}
```

### Error Responses

**Invalid OTP:**
```json
{
  "success": false,
  "message": "Invalid or expired OTP"
}
```

**Phone Required:**
```json
{
  "success": false,
  "message": "Phone number is required",
  "error": "VALIDATION_ERROR"
}
```

**Unauthorized (No Token):**
```json
{
  "success": false,
  "message": "No token provided",
  "error": "UNAUTHORIZED"
}
```

**Token Expired:**
```json
{
  "success": false,
  "message": "Token expired",
  "error": "TOKEN_EXPIRED"
}
```

---
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "phone": "919876543210",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "citizen"
    }
  }
}
```

#### 3. Use Token for Protected Routes
```http
GET /api/municipal/waste/reports
Authorization: Bearer <your-jwt-token>
```

---

## 📡 API Endpoints

### Authentication (`/api/auth`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/send-otp` | Send OTP to phone | No |
| POST | `/verify-otp` | Verify OTP & login | No |
| GET | `/me` | Get current user | Yes |
| PUT | `/profile` | Update profile | Yes |
| POST | `/logout` | Logout user | Yes |

---

### Municipal Services (`/api/municipal`)

#### Waste Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/waste/report` | Report waste issue |
| GET | `/waste/reports` | Get user's reports |

**Example: Report Waste**
```json
POST /api/municipal/waste/report

{
  "location": "Uzanbazar, Guwahati",
  "ward_number": "Ward 12",
  "waste_type": "mixed",
  "description": "Overflowing bin",
  "priority": "normal"
}
```

#### Grievances (Jan Sunwai)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/grievance/file` | File a grievance |
| GET | `/grievance/my` | Get user's grievances |
| GET | `/grievance/track/:number` | Track grievance |

**Example: File Grievance**
```json
POST /api/municipal/grievance/file

{
  "category": "Infrastructure",
  "subject": "Street Light Not Working",
  "description": "Street light broken for 1 week",
  "department": "Public Works Department",
  "priority": "normal"
}
```

#### Water Supply

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/water/apply` | Apply for water connection |
| GET | `/water/connections` | Get user's connections |
| GET | `/water/bills` | Get water bills |

---

### Electricity Services (`/api/electricity`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/apply` | Apply for new connection |
| GET | `/connections` | Get user's connections |
| GET | `/bills` | Get electricity bills |
| GET | `/bills/:billNumber` | Get specific bill |
| GET | `/readings/:connectionId` | Get meter readings |
| GET | `/dashboard` | Get dashboard stats |

**Example: Apply Connection**
```json
POST /api/electricity/apply

{
  "connection_type": "domestic",
  "sanctioned_load": 3.5,
  "address": "123 Main Street, Guwahati",
  "district": "Kamrup Metro"
}
```

---

### Gas Services (`/api/gas`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/apply` | Apply for gas connection |
| GET | `/connections` | Get user's connections |
| POST | `/book` | Book LPG cylinder |
| GET | `/bookings` | Get user's bookings |
| GET | `/track/:bookingNumber` | Track booking |

**Example: Book Cylinder**
```json
POST /api/gas/book

{
  "connection_id": 1,
  "cylinder_type": "14.2kg",
  "quantity": 1,
  "delivery_address": "123 Main Street, Guwahati"
}
```

---

### Scholarship Services (`/api/scholarships`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/` | Get available scholarships | Optional |
| GET | `/:id` | Get scholarship details | Optional |
| POST | `/check-eligibility` | Check eligibility | No |
| POST | `/apply` | Apply for scholarship | Yes |
| GET | `/my-applications` | Get user's applications | Yes |
| GET | `/track/:applicationNumber` | Track application | Yes |

**Example: Apply Scholarship**
```json
POST /api/scholarships/apply

{
  "scholarship_id": 1,
  "student_name": "Rahul Sharma",
  "father_name": "Mohan Sharma",
  "mother_name": "Priya Sharma",
  "dob": "2005-06-15",
  "gender": "Male",
  "category": "General",
  "annual_income": 200000,
  "class_level": "10",
  "school_college": "Don Bosco School",
  "marks_percentage": 85.5,
  "bank_account": "1234567890",
  "ifsc_code": "SBIN0001234"
}
```

---

## 🧪 Testing the API - Comprehensive Guide

### Method 1: Interactive HTML Tester ⭐ Recommended

**Best for**: Visual testing, quick exploration, beginners

1. **Start the server**:
   ```bash
   cd backend
   npm start
   ```

2. **Open test interface**:
   ```
   http://localhost:5000/test.html
   ```

3. **Features**:
   - ✅ Complete OTP authentication flow with auto-login
   - ✅ All 30 endpoints organized by module
   - ✅ Automatic token management (no copy-paste needed)
   - ✅ Beautiful UI with color-coded responses:
     - 🟢 Green: Success (200-299)
     - 🔴 Red: Error (400-599)
     - 🟡 Yellow: Warning/Info
   - ✅ Request/response JSON formatting
   - ✅ One-click testing for each endpoint

4. **Testing workflow**:
   ```
   Step 1: Click "Send OTP" → Enter phone: 9876543210
   Step 2: Check server console for OTP (e.g., "🔐 OTP: 123456")
   Step 3: Enter OTP and name → Click "Verify OTP"
   Step 4: Token saved automatically
   Step 5: Switch to any module tab (Municipal/Electricity/Gas/Scholarship)
   Step 6: Click endpoint buttons → See responses instantly
   ```

---

### Method 2: Using cURL (Command Line)

**Best for**: Automation, scripting, CI/CD integration

#### Complete Authentication Flow

```bash
# 1. Send OTP Request
curl -X POST http://localhost:5000/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "9876543210"}'

# Response will show OTP in development mode:
# {"success":true,"data":{"phone":"919876543210","otp":"123456","expiresIn":"10 minutes"}}

# 2. Verify OTP and Get Token
curl -X POST http://localhost:5000/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "9876543210", "otp": "123456", "name": "Test User"}'

# Copy the token from response
# {"success":true,"data":{"token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...","user":{...}}}

# 3. Set Token as Variable (for convenience)
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.your_actual_token_here"

# 4. Test Protected Endpoints
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

#### Municipal Services Examples

```bash
# Report Waste Issue
curl -X POST http://localhost:5000/api/municipal/waste/report \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "location": "Uzanbazar, Guwahati",
    "ward_number": "Ward 12",
    "waste_type": "mixed",
    "description": "Overflowing garbage bin",
    "priority": "normal"
  }'

# Get My Waste Reports
curl -X GET http://localhost:5000/api/municipal/waste/reports \
  -H "Authorization: Bearer $TOKEN"

# File Grievance
curl -X POST http://localhost:5000/api/municipal/grievance/file \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "category": "Infrastructure",
    "subject": "Street light not working",
    "description": "Street light at Main Road broken for 1 week",
    "department": "Public Works Department",
    "priority": "normal"
  }'

# Apply for Water Connection
curl -X POST http://localhost:5000/api/municipal/water/apply \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "connection_type": "domestic",
    "property_type": "residential",
    "address": "123 Main Street, Guwahati",
    "ward_number": "Ward 5"
  }'
```

#### Electricity Services Examples

```bash
# Apply for New Connection
curl -X POST http://localhost:5000/api/electricity/apply \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "connection_type": "domestic",
    "sanctioned_load": 3.5,
    "address": "456 Park Avenue, Guwahati",
    "district": "Kamrup Metro"
  }'

# Get My Bills
curl -X GET http://localhost:5000/api/electricity/bills \
  -H "Authorization: Bearer $TOKEN"

# Get Specific Bill
curl -X GET "http://localhost:5000/api/electricity/bills/ELEC-2024-001" \
  -H "Authorization: Bearer $TOKEN"

# Get Meter Readings
curl -X GET "http://localhost:5000/api/electricity/readings/1" \
  -H "Authorization: Bearer $TOKEN"

# Get Dashboard Stats
curl -X GET http://localhost:5000/api/electricity/dashboard \
  -H "Authorization: Bearer $TOKEN"
```

#### Gas Services Examples

```bash
# Apply for Gas Connection
curl -X POST http://localhost:5000/api/gas/apply \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "connection_type": "domestic",
    "address": "789 Green Lane, Guwahati",
    "district": "Kamrup Metro"
  }'

# Book LPG Cylinder
curl -X POST http://localhost:5000/api/gas/book \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "connection_id": 1,
    "cylinder_type": "14.2kg",
    "quantity": 1,
    "delivery_address": "789 Green Lane, Guwahati"
  }'

# View Bookings
curl -X GET http://localhost:5000/api/gas/bookings \
  -H "Authorization: Bearer $TOKEN"

# Track Booking
curl -X GET "http://localhost:5000/api/gas/track/GAS-BOOK-001" \
  -H "Authorization: Bearer $TOKEN"
```

#### Scholarship Services Examples

```bash
# Get All Scholarships (No auth required)
curl -X GET http://localhost:5000/api/scholarships

# Get Specific Scholarship
curl -X GET http://localhost:5000/api/scholarships/1

# Check Eligibility (No auth required)
curl -X POST http://localhost:5000/api/scholarships/check-eligibility \
  -H "Content-Type: application/json" \
  -d '{
    "annual_income": 200000,
    "category": "General",
    "class_level": "10",
    "marks_percentage": 85.5
  }'

# Apply for Scholarship (Auth required)
curl -X POST http://localhost:5000/api/scholarships/apply \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "scholarship_id": 1,
    "student_name": "Rahul Sharma",
    "father_name": "Mohan Sharma",
    "mother_name": "Priya Sharma",
    "dob": "2005-06-15",
    "gender": "Male",
    "category": "General",
    "annual_income": 200000,
    "class_level": "10",
    "school_college": "Don Bosco School, Guwahati",
    "marks_percentage": 85.5,
    "bank_account": "1234567890",
    "ifsc_code": "SBIN0001234"
  }'

# Get My Applications
curl -X GET http://localhost:5000/api/scholarships/my-applications \
  -H "Authorization: Bearer $TOKEN"

# Track Application
curl -X GET "http://localhost:5000/api/scholarships/track/SCH-APP-001" \
  -H "Authorization: Bearer $TOKEN"
```

---

### Method 3: Postman / Thunder Client (VS Code)

**Best for**: API collections, team collaboration, documentation

#### Setup Postman Collection

1. **Create New Collection**: "Suvidha API"

2. **Set Environment Variables**:
   ```
   baseUrl: http://localhost:5000/api
   token: (will be set dynamically)
   ```

3. **Create Folders**:
   - Authentication
   - Municipal Services
   - Electricity Services
   - Gas Services
   - Scholarship Services

4. **Add Pre-request Script** (for authenticated requests):
   ```javascript
   pm.request.headers.add({
     key: 'Authorization',
     value: 'Bearer ' + pm.environment.get('token')
   });
   ```

5. **Add Test Script** (to save token after login):
   ```javascript
   if (pm.response.code === 200) {
     var jsonData = pm.response.json();
     if (jsonData.data && jsonData.data.token) {
       pm.environment.set('token', jsonData.data.token);
     }
   }
   ```

#### Example Requests in Postman

**1. Send OTP**:
- Method: POST
- URL: `{{baseUrl}}/auth/send-otp`
- Body (JSON):
  ```json
  {
    "phone": "9876543210"
  }
  ```

**2. Verify OTP**:
- Method: POST
- URL: `{{baseUrl}}/auth/verify-otp`
- Body (JSON):
  ```json
  {
    "phone": "9876543210",
    "otp": "123456",
    "name": "Test User"
  }
  ```
- Test script auto-saves token!

**3. Protected Route** (e.g., Get Bills):
- Method: GET
- URL: `{{baseUrl}}/electricity/bills`
- Authorization: Bearer Token (auto-added by pre-request script)

---

### Method 4: JavaScript/Frontend Integration

**Best for**: Actual frontend implementation

```javascript
// auth.js - Authentication utilities

const API_BASE_URL = 'http://localhost:5000/api';

// Send OTP
async function sendOTP(phone) {
  const response = await fetch(`${API_BASE_URL}/auth/send-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone })
  });
  return await response.json();
}

// Verify OTP
async function verifyOTP(phone, otp, name = null) {
  const response = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, otp, name })
  });
  const data = await response.json();
  
  if (data.success && data.data.token) {
    // Save token to localStorage
    localStorage.setItem('suvidha_token', data.data.token);
    localStorage.setItem('suvidha_user', JSON.stringify(data.data.user));
  }
  
  return data;
}

// API Call Helper (for authenticated requests)
async function apiCall(endpoint, method = 'GET', body = null) {
  const token = localStorage.getItem('suvidha_token');
  
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    }
  };
  
  if (body && method !== 'GET') {
    options.body = JSON.stringify(body);
  }
  
  const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
  return await response.json();
}

// Example Usage:
// 1. Send OTP
await sendOTP('9876543210');

// 2. Verify OTP
await verifyOTP('9876543210', '123456', 'John Doe');

// 3. Make authenticated calls
const bills = await apiCall('/electricity/bills');
const grievances = await apiCall('/municipal/grievance/my');
const newConnection = await apiCall('/electricity/apply', 'POST', {
  connection_type: 'domestic',
  sanctioned_load: 3.5,
  address: '123 Main St',
  district: 'Kamrup Metro'
});
```

---

### Testing Checklist

Before deploying or marking as complete, verify:

#### Authentication
- [ ] Can send OTP
- [ ] OTP expires after 10 minutes
- [ ] Can verify OTP and get token
- [ ] Token is valid JWT format
- [ ] Can access protected routes with token
- [ ] Cannot access protected routes without token
- [ ] Token expires after 7 days

#### Municipal Services
- [ ] Can report waste issue
- [ ] Can view my waste reports
- [ ] Can file grievance
- [ ] Can track grievance by number
- [ ] Can apply for water connection
- [ ] Can view water bills
- [ ] Can view water connections

#### Electricity Services
- [ ] Can apply for new connection
- [ ] Can view electricity bills
- [ ] Can get specific bill by number
- [ ] Can view meter readings
- [ ] Can view dashboard stats
- [ ] Can view my connections

#### Gas Services
- [ ] Can apply for gas connection
- [ ] Can book LPG cylinder
- [ ] Can view booking history
- [ ] Can track booking by number
- [ ] Can view my connections

#### Scholarship Services
- [ ] Can browse scholarships without auth
- [ ] Can check eligibility without auth
- [ ] Can apply for scholarship with auth
- [ ] Can view my applications
- [ ] Can track application by number

---

## 🗄️ Database Schema

### Tables

- **users** - User accounts
- **otps** - OTP verification
- **waste_reports** - Waste management reports
- **grievances** - Jan Sunwai grievances
- **water_connections** - Water supply connections
- **water_bills** - Water bills
- **electricity_connections** - Electricity connections
- **electricity_bills** - Electricity bills
- **meter_readings** - Smart meter data
- **gas_connections** - Gas connections
- **gas_bookings** - LPG bookings
- **scholarships** - Available scholarships
- **scholarship_applications** - Student applications
- **payments** - Payment transactions

Database file: `backend/data/suvidha.db`

---

## 🔒 Security Features

- ✅ JWT-based authentication
- ✅ OTP verification (10-minute expiry)
- ✅ Rate limiting (100 requests per 15 minutes)
- ✅ Helmet.js security headers
- ✅ CORS configuration
- ✅ Input validation
- ✅ SQL injection prevention (parameterized queries)

---

## 📁 Project Structure

```
backend/
│
├── server.js                     # 🚀 Express server entry point
├── package.json                  # Dependencies and scripts
├── package-lock.json             # Dependency lock file
├── .env                          # Environment variables (create this)
│
├── config/                       # ⚙️ Configuration files
│   ├── database.js               # SQLite database connection
│   └── database-simple.js        # JSON database fallback
│
├── controllers/                  # 🎮 Business logic layer
│   ├── authController.js         # Authentication logic (OTP, JWT)
│   ├── municipalController.js    # Municipal services (water, waste, grievances)
│   ├── electricityController.js  # Electricity services (bills, connections)
│   ├── gasController.js          # Gas services (LPG booking, connections)
│   └── scholarshipController.js  # Scholarship services (browse, apply, track)
│
├── middleware/                   # 🔒 Middleware functions
│   └── auth.js                   # JWT authentication middleware
│
├── routes/                       # 🛣️ API route definitions
│   ├── auth.js                   # POST /api/auth/send-otp, /verify-otp, etc.
│   ├── municipal.js              # /api/municipal/waste/*, /grievance/*, /water/*
│   ├── electricity.js            # /api/electricity/apply, /bills, /readings, etc.
│   ├── gas.js                    # /api/gas/apply, /book, /track, etc.
│   └── scholarship.js            # /api/scholarships/*
│
├── models/                       # 🗄️ Database models (future: ORM)
│   └── (Currently using raw SQL)
│
├── utils/                        # 🛠️ Utility functions
│   └── helpers.js                # Helper functions (generateOTP, etc.)
│
├── data/                         # 💾 Database storage
│   ├── suvidha.db                # SQLite database (auto-created)
│   ├── suvidha.db-shm            # SQLite shared memory
│   ├── suvidha.db-wal            # SQLite write-ahead log
│   └── db.json                   # JSON database fallback
│
├── public/                       # 🌐 Static frontend files
│   ├── index.html                # Landing page
│   ├── login.html                # Authentication page
│   ├── main-kiosk.html           # Service kiosk
│   ├── test.html                 # API testing interface
│   │
│   ├── municipal-services.html   # Municipal hub
│   ├── water-supply.html         # Water services
│   ├── waste-management.html     # Waste management
│   ├── grievance-portal.html     # Jan Sunwai portal
│   │
│   ├── electricity-services.html # Electricity portal
│   ├── gas-services.html         # Gas services
│   ├── scholarship-portal.html   # Scholarships
│   │
│   └── js/                       # Frontend JavaScript
│       ├── auth.js               # Auth utilities & API client
│       ├── municipal-integration.js
│       ├── electricity-integration.js
│       ├── gas-integration.js
│       └── scholarship-integration.js
│
├── tests/                        # 🧪 Test files
│   ├── api-test.js               # API endpoint tests
│   └── (Add more test files)
│
├── logs/                         # 📋 Application logs (future)
│   └── (Auto-generated)
│
├── README.md                     # 📖 This file
├── QUICKSTART.md                 # Quick start guide
├── SMS_SETUP_GUIDE.md            # SMS gateway setup
└── .gitignore                    # Git ignore rules
```

### File Responsibilities

| File | Purpose | Key Functions |
|------|---------|---------------|
| **server.js** | Main entry point | Express setup, middleware, routes, server start |
| **authController.js** | Authentication | `sendOTP()`, `verifyOTP()`, `getProfile()` |
| **municipalController.js** | Municipal services | `reportWaste()`, `fileGrievance()`, `applyWaterConnection()` |
| **electricityController.js** | Electricity | `applyConnection()`, `getBills()`, `getMeterReadings()` |
| **gasController.js** | Gas services | `applyConnection()`, `bookCylinder()`, `trackBooking()` |
| **scholarshipController.js** | Scholarships | `getScholarships()`, `applyScholarship()`, `trackApplication()` |
| **auth.js** (middleware) | JWT verification | `authenticateToken()`, extract user from token |
| **database.js** | SQLite connection | Database initialization, table creation, sample data |
| **database-simple.js** | JSON fallback | Read/write JSON file, simulate database operations |

---

## 🌐 Environment Variables

Create a `.env` file in the `backend/` directory:

```env
# ===========================================
# SERVER CONFIGURATION
# ===========================================
PORT=5000
NODE_ENV=development

# ===========================================
# AUTHENTICATION & SECURITY
# ===========================================
# JWT Secret: Use strong random string in production!
# Generate: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_SECRET=your_super_secret_key_change_this_in_production_min_32_chars

# JWT Token Expiration (default: 7 days)
# Options: 1h, 24h, 7d, 30d, etc.
JWT_EXPIRES_IN=7d

# OTP Expiration Time (in minutes)
OTP_EXPIRY_MINUTES=10

# ===========================================
# DATABASE
# ===========================================
# Path to SQLite database file
DB_PATH=./data/suvidha.db

# Database type (auto-detected if not set)
# Options: sqlite, json
# DB_TYPE=sqlite

# ===========================================
# CORS & FRONTEND
# ===========================================
# Allowed frontend URLs (comma-separated for multiple)
FRONTEND_URL=http://localhost:5000

# For multiple origins:
# FRONTEND_URL=http://localhost:3000,http://localhost:5000,https://yourdomain.com

# ===========================================
# SMS GATEWAY (Production Only)
# ===========================================
# Uncomment and configure for SMS OTP delivery

# SMS_PROVIDER=twilio
# SMS_ACCOUNT_SID=your_twilio_account_sid
# SMS_AUTH_TOKEN=your_twilio_auth_token
# SMS_FROM_NUMBER=+1234567890

# For other providers (MSG91, AWS SNS, etc.):
# SMS_PROVIDER=msg91
# SMS_API_KEY=your_api_key
# SMS_SENDER_ID=SUVIDH

# ===========================================
# EMAIL (Future Feature)
# ===========================================
# EMAIL_HOST=smtp.gmail.com
# EMAIL_PORT=587
# EMAIL_USER=noreply@assamservices.gov.in
# EMAIL_PASSWORD=your_email_password
# EMAIL_FROM=Suvidha Portal <noreply@assamservices.gov.in>

# ===========================================
# PAYMENT GATEWAY (Future Feature)
# ===========================================
# RAZORPAY_KEY_ID=your_razorpay_key
# RAZORPAY_KEY_SECRET=your_razorpay_secret

# ===========================================
# LOGGING & MONITORING
# ===========================================
# Log level: error, warn, info, debug
LOG_LEVEL=info

# Enable request logging
ENABLE_MORGAN=true

# ===========================================
# RATE LIMITING
# ===========================================
# Max requests per window (default: 100)
RATE_LIMIT_MAX=100

# Time window in minutes (default: 15)
RATE_LIMIT_WINDOW_MS=15

# ===========================================
# FILE UPLOAD (Future Feature)
# ===========================================
# MAX_FILE_SIZE_MB=5
# UPLOAD_PATH=./uploads
```

### Environment Variable Reference

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `PORT` | Number | `5000` | Server port |
| `NODE_ENV` | String | `development` | Environment mode |
| `JWT_SECRET` | String | *(required)* | Secret key for JWT signing (min 32 chars) |
| `JWT_EXPIRES_IN` | String | `7d` | Token expiration time |
| `OTP_EXPIRY_MINUTES` | Number | `10` | OTP validity duration |
| `DB_PATH` | String | `./data/suvidha.db` | SQLite database file path |
| `FRONTEND_URL` | String | `http://localhost:5000` | Allowed CORS origin |

### Security Best Practices

#### Development
```env
NODE_ENV=development
JWT_SECRET=dev_secret_key_not_for_production
```

#### Production
```env
NODE_ENV=production
JWT_SECRET=<64-char-random-string>
FRONTEND_URL=https://suvidha.assam.gov.in
```

**Generate Secure JWT Secret**:
```bash
# Method 1: Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Method 2: Using OpenSSL
openssl rand -hex 32

# Method 3: Online generator
# Visit: https://www.grc.com/passwords.htm
```

---

## � Complete API Request-Response Flow

### Anatomy of an API Request

```
┌─────────────────────────────────────────────────────────────────────┐
│ 1. CLIENT SIDE (Browser/Postman/cURL)                              │
│                                                                      │
│ User Action: Click "Apply for Scholarship" button                   │
│                                                                      │
│ JavaScript Code:                                                     │
│   const token = localStorage.getItem('suvidha_token');              │
│   const response = await fetch('/api/scholarships/apply', {         │
│     method: 'POST',                                                  │
│     headers: {                                                       │
│       'Content-Type': 'application/json',                           │
│       'Authorization': `Bearer ${token}`                            │
│     },                                                               │
│     body: JSON.stringify({                                          │
│       scholarship_id: 1,                                            │
│       student_name: 'Rahul Sharma',                                 │
│       marks_percentage: 85.5,                                       │
│       ...other fields                                               │
│     })                                                               │
│   });                                                                │
└──────────────────────────┬───────────────────────────────────────────┘
                           │
                           │ HTTP POST Request
                           │ Host: localhost:5000
                           │ Path: /api/scholarships/apply
                           │ Headers: Content-Type, Authorization
                           │ Body: JSON payload
                           ↓
┌─────────────────────────────────────────────────────────────────────┐
│ 2. EXPRESS SERVER (server.js)                                      │
│                                                                      │
│ Request received at: http://localhost:5000/api/scholarships/apply   │
│                                                                      │
│ ↓ Middleware Chain:                                                 │
│                                                                      │
│ [1] Helmet.js → Security headers (XSS, clickjacking protection)     │
│ [2] CORS → Check origin, allow cross-origin requests               │
│ [3] express.json() → Parse JSON body                                │
│ [4] Morgan → Log HTTP request (if enabled)                          │
│ [5] Rate Limiter → Check if within limits (100 req/15min)          │
└──────────────────────────┬───────────────────────────────────────────┘
                           │
                           ↓ Route Matching
┌─────────────────────────────────────────────────────────────────────┐
│ 3. ROUTER (routes/scholarship.js)                                  │
│                                                                      │
│ Match route: POST /api/scholarships/apply                           │
│                                                                      │
│ Route definition:                                                    │
│   router.post('/apply',                                             │
│     authenticateToken,  ← Auth middleware                           │
│     scholarshipController.applyForScholarship                       │
│   );                                                                 │
│                                                                      │
│ → Call authenticateToken middleware                                 │
└──────────────────────────┬───────────────────────────────────────────┘
                           │
                           ↓
┌─────────────────────────────────────────────────────────────────────┐
│ 4. AUTH MIDDLEWARE (middleware/auth.js)                             │
│                                                                      │
│ Extract token from header:                                           │
│   const authHeader = req.headers.authorization;                     │
│   const token = authHeader.split(' ')[1]; // "Bearer <token>"      │
│                                                                      │
│ Verify token:                                                        │
│   const decoded = jwt.verify(token, process.env.JWT_SECRET);        │
│                                                                      │
│ Checks:                                                              │
│   ✅ Token exists                                                    │
│   ✅ Token signature valid                                           │
│   ✅ Token not expired                                               │
│   ✅ Payload contains userId                                         │
│                                                                      │
│ Attach user to request:                                              │
│   req.user = { userId: decoded.userId, phone: decoded.phone };      │
│                                                                      │
│ → Pass to controller                                                │
└──────────────────────────┬───────────────────────────────────────────┘
                           │
                           ↓
┌─────────────────────────────────────────────────────────────────────┐
│ 5. CONTROLLER (controllers/scholarshipController.js)                │
│                                                                      │
│ Function: applyForScholarship(req, res)                             │
│                                                                      │
│ Business Logic:                                                      │
│   1. Extract data from req.body                                     │
│   2. Validate required fields                                       │
│   3. Check scholarship exists                                       │
│   4. Check user not already applied                                 │
│   5. Generate application number (SCH-APP-XXXX)                     │
│   6. Prepare database insert                                        │
└──────────────────────────┬───────────────────────────────────────────┘
                           │
                           ↓
┌─────────────────────────────────────────────────────────────────────┐
│ 6. DATABASE LAYER (config/database.js or database-simple.js)       │
│                                                                      │
│ SQL Query (SQLite):                                                  │
│   INSERT INTO scholarship_applications (                            │
│     user_id, scholarship_id, application_number, student_name,      │
│     marks_percentage, status, applied_date                          │
│   ) VALUES (?, ?, ?, ?, ?, ?, ?)                                    │
│                                                                      │
│ OR JSON Operation (Fallback):                                        │
│   db.scholarship_applications.push({                                │
│     id: newId,                                                      │
│     user_id: req.user.userId,                                       │
│     scholarship_id: req.body.scholarship_id,                        │
│     application_number: 'SCH-APP-001',                              │
│     ...other fields                                                  │
│   });                                                                │
│   fs.writeFileSync('data/db.json', JSON.stringify(db));             │
│                                                                      │
│ → Return inserted record                                            │
└──────────────────────────┬───────────────────────────────────────────┘
                           │
                           ↓ Build Response
┌─────────────────────────────────────────────────────────────────────┐
│ 7. CONTROLLER RESPONSE                                              │
│                                                                      │
│ Success:                                                             │
│   res.status(201).json({                                            │
│     success: true,                                                  │
│     message: 'Application submitted successfully',                 │
│     data: {                                                          │
│       application_number: 'SCH-APP-001',                            │
│       application_id: 1,                                            │
│       status: 'submitted',                                          │
│       applied_date: '2026-03-01T12:00:00.000Z'                      │
│     }                                                                │
│   });                                                                │
│                                                                      │
│ Or Error:                                                            │
│   res.status(400).json({                                            │
│     success: false,                                                 │
│     message: 'You have already applied for this scholarship',      │
│     error: 'DUPLICATE_APPLICATION'                                  │
│   });                                                                │
└──────────────────────────┬───────────────────────────────────────────┘
                           │
                           │ HTTP Response
                           │ Status: 201 Created
                           │ Headers: Content-Type: application/json
                           │ Body: JSON response
                           ↓
┌─────────────────────────────────────────────────────────────────────┐
│ 8. CLIENT SIDE - RESPONSE HANDLING                                 │
│                                                                      │
│ JavaScript Code:                                                     │
│   const data = await response.json();                               │
│                                                                      │
│   if (data.success) {                                               │
│     alert(`Application submitted! Tracking number:                  │
│            ${data.data.application_number}`);                       │
│     // Redirect or update UI                                        │
│   } else {                                                           │
│     alert(`Error: ${data.message}`);                                │
│   }                                                                  │
│                                                                      │
│ UI Update:                                                           │
│   - Show success toast notification                                 │
│   - Display application number prominently                          │
│   - Add to "My Applications" list                                   │
│   - Enable tracking functionality                                   │
└─────────────────────────────────────────────────────────────────────┘
```

### Real-World Example: Electricity Bill Payment Flow

```
User Journey: "I want to pay my electricity bill"

┌────────────────────────────────────────────────────────────────┐
│ STEP 1: User Authentication (if not logged in)                 │
├────────────────────────────────────────────────────────────────┤
│ 1. POST /api/auth/send-otp                                     │
│    { phone: "9876543210" }                                     │
│    → Server generates OTP: 123456                              │
│    → Response: { success: true, data: { otp: "123456" } }      │
│                                                                 │
│ 2. POST /api/auth/verify-otp                                   │
│    { phone: "9876543210", otp: "123456", name: "Rahul" }       │
│    → Server verifies OTP                                       │
│    → Creates/fetches user record                               │
│    → Generates JWT token                                       │
│    → Response: { success: true, data: { token: "eyJh...",      │
│                  user: { id: 1, name: "Rahul", ... } } }       │
│                                                                 │
│ 3. Frontend stores token in localStorage                       │
└────────────────────────────────────────────────────────────────┘
                         ↓
┌────────────────────────────────────────────────────────────────┐
│ STEP 2: View Electricity Bills                                 │
├────────────────────────────────────────────────────────────────┤
│ GET /api/electricity/bills                                     │
│ Headers: { Authorization: "Bearer <token>" }                   │
│                                                                 │
│ Server flow:                                                    │
│   → Auth middleware verifies token                             │
│   → Extract userId from token payload                          │
│   → Query database: SELECT * FROM electricity_bills            │
│                     WHERE user_id = ?                          │
│   → Return user's bills                                        │
│                                                                 │
│ Response:                                                       │
│   {                                                             │
│     success: true,                                             │
│     data: {                                                     │
│       bills: [                                                  │
│         {                                                       │
│           bill_number: "ELEC-2024-001",                        │
│           connection_id: 1,                                    │
│           billing_month: "Feb 2026",                           │
│           units_consumed: 150,                                 │
│           amount: 1200.50,                                     │
│           due_date: "2026-03-15",                              │
│           status: "pending"                                    │
│         }                                                       │
│       ]                                                         │
│     }                                                           │
│   }                                                             │
└────────────────────────────────────────────────────────────────┘
                         ↓
┌────────────────────────────────────────────────────────────────┐
│ STEP 3: Get Specific Bill Details                              │
├────────────────────────────────────────────────────────────────┤
│ GET /api/electricity/bills/ELEC-2024-001                       │
│ Headers: { Authorization: "Bearer <token>" }                   │
│                                                                 │
│ Response: Detailed bill with breakdown                          │
│   {                                                             │
│     success: true,                                             │
│     data: {                                                     │
│       bill: {                                                   │
│         bill_number: "ELEC-2024-001",                          │
│         units_consumed: 150,                                   │
│         rate_per_unit: 7.50,                                   │
│         energy_charge: 1125.00,                                │
│         fixed_charge: 50.00,                                   │
│         tax: 25.50,                                            │
│         total_amount: 1200.50,                                 │
│         due_date: "2026-03-15"                                 │
│       }                                                         │
│     }                                                           │
│   }                                                             │
└────────────────────────────────────────────────────────────────┘
                         ↓
┌────────────────────────────────────────────────────────────────┐
│ STEP 4: Pay Bill (Future: Payment Gateway Integration)         │
├────────────────────────────────────────────────────────────────┤
│ POST /api/payments/pay                                         │
│ {                                                               │
│   bill_number: "ELEC-2024-001",                                │
│   payment_method: "UPI",                                       │
│   amount: 1200.50                                              │
│ }                                                               │
│                                                                 │
│ → Integrate with Razorpay/Paytm                                │
│ → Update bill status to 'paid'                                 │
│ → Generate receipt                                             │
│ → Send confirmation email/SMS                                  │
└────────────────────────────────────────────────────────────────┘
```

---

## �📝 Common Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { /* ... */ }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message"
}
```

---

## 🎯 Module-Specific Features

### Municipal Services
- Real-time waste report tracking
- Grievance status updates
- Water connection application workflow

### Electricity Services
- Bill generation and management
- Smart meter integration
- Consumption analytics

### Gas Services
- LPG cylinder booking
- Delivery tracking
- Connection management

### Scholarship Services
- Eligibility checker
- Document management
- Application tracking

---

## 🐛 Troubleshooting Guide

### Server Issues

#### ❌ "Port 5000 already in use"

**Symptom**: Error message when starting server
```
Error: listen EADDRINUSE: address already in use :::5000
```

**Solutions**:

**Windows**:
```powershell
# Find process using port 5000
netstat -ano | findstr :5000

# Output: TCP  0.0.0.0:5000  0.0.0.0:0  LISTENING  12345
# Kill process (replace 12345 with actual PID)
taskkill /PID 12345 /F
```

**Mac/Linux**:
```bash
# Find and kill process
lsof -ti:5000 | xargs kill -9

# Or use single command
kill $(lsof -t -i:5000)
```

**Alternative**: Change port in `.env`:
```env
PORT=5001
```

#### ❌ "Cannot find module" Errors

**Symptom**: 
```
Error: Cannot find module 'express'
Error: Cannot find module 'jsonwebtoken'
```

**Solution**:
```bash
# Delete node_modules and reinstall
rm -rf node_modules package-lock.json

# Clean npm cache
npm cache clean --force

# Reinstall dependencies
npm install
```

#### ❌ Server Crashes on Startup

**Check**:
1. Node.js version: `node -v` (should be v14+)
2. Dependencies installed: `ls node_modules` should show folders
3. Syntax errors: Check if you edited server.js recently

**Solution**:
```bash
# Run with detailed error logging
NODE_ENV=development npm start

# Check server.js syntax
node --check server.js
```

---

### Database Issues

#### ❌ "ENOENT: no such file or directory './data/suvidha.db'"

**Symptom**: Database file not found

**Solution**:
```bash
# Create data directory
mkdir data

# Server will auto-create database on next start
npm start
```

#### ❌ "Database is locked"

**Symptom**: SQLite BUSY error

**Solution**:
```bash
# Stop all server instances
# Windows:
taskkill /IM node.exe /F

# Mac/Linux:
killall node

# Delete lock file
rm data/suvidha.db-shm
rm data/suvidha.db-wal

# Restart server
npm start
```

#### ❌ Corrupted Database

**Symptom**: Strange errors, missing data, corrupted tables

**Solution**:
```bash
# Backup current database
cp data/suvidha.db data/suvidha.db.backup

# Delete and let server recreate
rm data/suvidha.db

# Or delete JSON database
rm data/db.json

# Restart - database will reinitialize with sample data
npm start
```

---

### Authentication Issues

#### ❌ "OTP not received"

**In Development**:
- OTP is displayed in server console, not sent via SMS
- Look for line: `🔐 OTP for 9876543210: 123456`

**In Production**:
- Configure SMS gateway in `.env`
- Check SMS provider credentials
- Verify phone number format (include country code)

#### ❌ "Invalid or expired OTP"

**Causes**:
1. OTP older than 10 minutes
2. Wrong OTP entered
3. OTP already used (one-time use)
4. Server restarted (clears OTP table)

**Solution**:
- Request new OTP
- Check server console for correct OTP
- Ensure typing correct digits

#### ❌ "Token expired" or "Invalid token"

**Symptom**:
```json
{
  "success": false,
  "message": "Token expired",
  "error": "TOKEN_EXPIRED"
}
```

**Solution**:
```javascript
// Frontend: Clear token and re-authenticate
localStorage.removeItem('suvidha_token');
localStorage.removeItem('suvidha_user');
// Redirect to login page
window.location.href = '/login.html';
```

**Token Lifespan**:
- Default: 7 days
- Change in `.env`: `JWT_EXPIRES_IN=30d`

#### ❌ "No token provided"

**Symptom**:
```json
{
  "success": false,
  "message": "No token provided"
}
```

**Causes**:
1. Authorization header missing
2. Token not in correct format
3. Bearer keyword missing

**Correct Format**:
```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Wrong Formats** (Don't use):
```http
Authorization: eyJhbGciOiJI...           ❌ Missing "Bearer"
Authorization: Token eyJhbGciOi...       ❌ Wrong keyword
Bearer eyJhbGciOi...                     ❌ Header name missing
```

---

### API Request Issues

#### ❌ CORS Errors

**Symptom**:
```
Access to fetch at 'http://localhost:5000/api/...' from origin 'http://localhost:3000'
has been blocked by CORS policy
```

**Solution**:
1. Ensure accessing via `http://localhost:5000` (not file://)
2. Update `.env`:
   ```env
   FRONTEND_URL=http://localhost:3000
   ```
3. For multiple origins, edit `server.js`:
   ```javascript
   app.use(cors({
     origin: ['http://localhost:3000', 'http://localhost:5000'],
     credentials: true
   }));
   ```

#### ❌ 404 Not Found

**Symptom**:
```json
{
  "success": false,
  "message": "Route not found"
}
```

**Causes**:
1. Wrong URL path
2. Missing `/api` prefix
3. Wrong HTTP method (GET vs POST)
4. Typo in endpoint

**Verification**:
```bash
# Check available routes in console output when server starts
# Should see:
# ✅ /api/auth/*
# ✅ /api/municipal/*
# ✅ /api/electricity/*
# ✅ /api/gas/*
# ✅ /api/scholarships/*
```

#### ❌ 500 Internal Server Error

**Symptom**:
```json
{
  "success": false,
  "message": "Internal server error",
  "error": "..."
}
```

**Solution**:
1. Check server console for detailed error
2. Verify request body format matches API docs
3. Check all required fields are provided
4. Restart server if persistent

**Common Causes**:
- Missing required field in request body
- Invalid data type (string instead of number)
- Database constraint violation
- Malformed JSON in request

---

### Frontend Integration Issues

#### ❌ "Unexpected token < in JSON"

**Symptom**: Frontend shows HTML instead of JSON

**Cause**: Server returned HTML error page instead of JSON API response

**Solution**:
- Check API endpoint URL is correct
- Verify endpoint exists (should start with `/api/`)
- Check server console for error

#### ❌ Request succeeds but no data displayed

**Cause**: Response parsing issue

**Debug**:
```javascript
// Log full response
const response = await fetch('/api/scholarships');
const data = await response.json();
console.log('Full response:', data);
console.log('Status:', response.status);
console.log('Success:', data.success);
console.log('Data:', data.data);
```

---

### Performance Issues

#### ❌ Slow API Responses

**Causes**:
1. Large dataset queries without pagination
2. Missing database indexes
3. Complex joins

**Solutions**:
```javascript
// Add pagination to queries
const page = req.query.page || 1;
const limit = req.query.limit || 10;
const offset = (page - 1) * limit;

// Limit returned data
const results = await db.prepare(
  'SELECT * FROM scholarships LIMIT ? OFFSET ?'
).all(limit, offset);
```

#### ❌ Memory Leaks

**Symptom**: Server slows down over time

**Solution**:
- Restart server periodically
- Use PM2 for production:
  ```bash
  npm install -g pm2
  pm2 start server.js --name suvidha
  pm2 restart suvidha
  ```

---

### Development Environment Issues

#### ❌ Changes not reflecting

**Symptom**: Code changes don't show in API responses

**Causes**:
1. Server not restarted (if using `npm start`)
2. Nodemon not watching files (if using `npm run dev`)
3. Browser cache

**Solutions**:
```bash
# Use dev mode with auto-reload
npm run dev

# Or manually restart
Ctrl+C
npm start

# Clear browser cache
Ctrl+Shift+Delete (Windows/Linux)
Cmd+Shift+Delete (Mac)
```

#### ❌ Environment variables not loading

**Symptom**: Default values used instead of .env values

**Solution**:
1. Ensure `.env` file is in `backend/` directory (same level as server.js)
2. Check `.env` syntax (no quotes needed):
   ```env
   PORT=5000                  ✅ Correct
   PORT="5000"                ❌ Quotes not needed
   ```
3. Restart server after editing `.env`

---

### Quick Diagnostic Script

```bash
# Run this to diagnose common issues

echo "=== Suvidha Backend Diagnostics ==="

echo "1. Node.js version:"
node -v

echo "2. npm version:"
npm -v

echo "3. Backend directory files:"
ls -la

echo "4. node_modules exists:"
test -d node_modules && echo "✅ Yes" || echo "❌ No - run 'npm install'"

echo "5. .env file exists:"
test -f .env && echo "✅ Yes" || echo "⚠️  No - using defaults"

echo "6. Database exists:"
test -f data/suvidha.db && echo "✅ SQLite DB found" || echo "⚠️  Will create on startup"
test -f data/db.json && echo "✅ JSON DB found" || echo "⚠️  Will create on startup"

echo "7. Port 5000 available:"
lsof -ti:5000 > /dev/null && echo "❌ Port in use" || echo "✅ Port available"

echo "8. Server.js syntax:"
node --check server.js && echo "✅ No syntax errors" || echo "❌ Syntax errors found"
```

Save as `backend/diagnose.sh` and run: `bash diagnose.sh`

---

## � Deployment Guide

### Production Deployment Checklist

#### 1. Pre-Deployment Preparation

```bash
# Update environment to production
NODE_ENV=production

# Generate secure JWT secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# Copy output to .env as JWT_SECRET

# Set production database path
DB_PATH=/var/www/suvidha/data/suvidha.db

# Configure CORS for production domain
FRONTEND_URL=https://suvidha.assam.gov.in

# Set up SMS gateway for real OTP delivery
SMS_PROVIDER=twilio
SMS_ACCOUNT_SID=<your_account_sid>
SMS_AUTH_TOKEN=<your_auth_token>
SMS_FROM_NUMBER=<your_phone_number>
```

#### 2. Server Setup

**Option A: Traditional VPS (AWS EC2, DigitalOcean, Azure)**

```bash
# 1. Connect to server
ssh user@your-server-ip

# 2. Install Node.js (Ubuntu/Debian)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 3. Install PM2 (Process Manager)
sudo npm install -g pm2

# 4. Clone repository
git clone <repository-url>
cd suvidha-hackathon/backend

# 5. Install dependencies
npm install --production

# 6. Set up environment
cp .env.example .env
nano .env  # Edit with production values

# 7. Start with PM2
pm2 start server.js --name suvidha-api
pm2 startup  # Auto-start on system boot
pm2 save

# 8. Set up Nginx reverse proxy
sudo nano /etc/nginx/sites-available/suvidha
```

**Nginx Configuration**:
```nginx
server {
    listen 80;
    server_name api.suvidha.assam.gov.in;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Enable site and restart Nginx
sudo ln -s /etc/nginx/sites-available/suvidha /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Install SSL certificate (Let's Encrypt)
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d api.suvidha.assam.gov.in
```

**Option B: Docker Deployment**

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

EXPOSE 5000

CMD ["node", "server.js"]
```

```yaml
# docker-compose.yml
version: '3.8'

services:
  api:
    build: .
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - JWT_SECRET=${JWT_SECRET}
      - DB_PATH=/data/suvidha.db
    volumes:
      - ./data:/data
    restart: unless-stopped
```

```bash
# Deploy with Docker
docker-compose up -d
```

#### 3. Database Migration

**From JSON to PostgreSQL (Recommended for Production)**

```bash
# Install PostgreSQL
sudo apt install postgresql postgresql-contrib

# Create database
sudo -u postgres createdb suvidha

# Update .env
DATABASE_URL=postgresql://user:password@localhost:5432/suvidha

# Install pg driver
npm install pg

# Run migration script (create one)
node scripts/migrate-to-postgresql.js
```

#### 4. Monitoring & Logging

```bash
# PM2 Monitoring
pm2 monit

# View logs
pm2 logs suvidha-api

# Set up log rotation
pm2 install pm2-logrotate

# Configure New Relic (optional)
npm install newrelic
# Follow New Relic setup guide
```

#### 5. Security Hardening

```bash
# Install firewall
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable

# Limit SSH access
sudo nano /etc/ssh/sshd_config
# Set: PermitRootLogin no

# Install fail2ban
sudo apt install fail2ban

# Set up automatic security updates
sudo apt install unattended-upgrades
```

#### 6. Performance Optimization

**Enable Compression**:
```javascript
// In server.js
const compression = require('compression');
app.use(compression());
```

**Add Caching**:
```javascript
// Cache static assets
app.use(express.static('public', {
  maxAge: '1d',
  etag: true
}));
```

**Database Connection Pooling** (if using PostgreSQL):
```javascript
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000
});
```

#### 7. Backup Strategy

```bash
# Database backup script (backup.sh)
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR=/var/backups/suvidha

# SQLite backup
cp /var/www/suvidha/data/suvidha.db $BACKUP_DIR/suvidha_$DATE.db

# Keep only last 7 days
find $BACKUP_DIR -name "suvidha_*.db" -mtime +7 -delete

# Add to crontab (daily at 2 AM)
# 0 2 * * * /var/www/suvidha/backup.sh
```

#### 8. CI/CD Pipeline

**GitHub Actions Example** (.github/workflows/deploy.yml):
```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Deploy to server
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            cd /var/www/suvidha/backend
            git pull origin main
            npm install --production
            pm2 restart suvidha-api
```

---

## 📊 Monitoring & Metrics

### Health Check Endpoint

```javascript
// Add to server.js
app.get('/health', (req, res) => {
  res.json({
    status: 'UP',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: checkDatabaseConnection() ? 'Connected' : 'Disconnected'
  });
});
```

### PM2 Metrics

```bash
# Real-time monitoring
pm2 monit

# Generate status report
pm2 status

# View resource usage
pm2 list

# Check logs
pm2 logs --lines 100
```

### Performance Metrics to Track

- **Response Time**: Avg, P95, P99
- **Request Rate**: Requests per second
- **Error Rate**: 4xx and 5xx responses
- **Database Query Time**: Slow query detection
- **Memory Usage**: Heap size, GC frequency
- **CPU Usage**: Per-process utilization

---

## 📞 Support & Contact

### Technical Support

**For Developers:**
- **GitHub Issues**: [Create an issue](https://github.com/your-org/suvidha/issues)
- **Documentation**: See README files in project root
- **API Reference**: [API_DOCUMENTATION.md](../API_DOCUMENTATION.md)

**For Citizens/Users:**
- **Email**: support@assamservices.gov.in
- **Helpline**: 1800-XXX-XXXX (Toll-free, 9 AM - 6 PM IST)
- **Portal**: [https://suvidha.assam.gov.in](https://suvidha.assam.gov.in)

### Office Hours

- **Monday to Friday**: 10:00 AM - 5:00 PM IST
- **Saturday**: 10:00 AM - 2:00 PM IST
- **Sunday & Public Holidays**: Closed

### Emergency Services

| Service | Helpline | Description |
|---------|----------|-------------|
| Water Supply Issues | 1916 | 24/7 Water emergency |
| Electricity Outages | 1912 | Power failure reporting |
| Gas Leakage | 1906 | Gas emergency hotline |
| General Grievances | 1950 | Jan Sunwai portal |

---

## 📚 Additional Resources

### Documentation Files

- **[../README.md](../README.md)** - Main project README with user guide
- **[../API_DOCUMENTATION.md](../API_DOCUMENTATION.md)** - Complete API reference
- **[../TESTING_GUIDE.md](../TESTING_GUIDE.md)** - Testing procedures
- **[QUICKSTART.md](QUICKSTART.md)** - Quick start guide
- **[SMS_SETUP_GUIDE.md](SMS_SETUP_GUIDE.md)** - SMS gateway configuration

### Useful Links

- **Node.js Documentation**: [https://nodejs.org/docs](https://nodejs.org/docs)
- **Express.js Guide**: [https://expressjs.com/en/guide](https://expressjs.com/en/guide)
- **JWT.io**: [https://jwt.io](https://jwt.io)
- **Better-SQLite3**: [https://github.com/WiseLibs/better-sqlite3](https://github.com/WiseLibs/better-sqlite3)

---

## 🎯 Project Status

**Version**: 1.0.0 (MVP Complete)  
**Last Updated**: March 2026  
**Build Status**: ✅ Stable  
**Test Coverage**: In Progress

### What's Completed

✅ **30 API Endpoints** - All functional and tested  
✅ **Authentication System** - OTP-based with JWT  
✅ **5 Service Modules** - Municipal, Electricity, Gas, Scholarships, Auth  
✅ **Database Layer** - Dual support (SQLite + JSON)  
✅ **Security Middleware** - JWT, Rate limiting, Helmet  
✅ **CORS Configuration** - Cross-origin support  
✅ **Error Handling** - Consistent error responses  
✅ **Interactive Testing** - Web-based API tester  
✅ **Admin Dashboard** - Service management panel 
✅ **API Rate Limiting per User** - Enhanced security  

### Upcoming Features

🔜 **SMS Gateway Integration** - Real OTP delivery via SMS  
🔜 **Partial Payment Gateway** - Razorpay/Paytm integration  
🔜 **Email Notifications** - Application status updates  
🔜 **Document Upload** - File upload for applications by scanning
🔜 **Analytics & Reporting** - Usage metrics and insights  
🔜 **WebSocket Support** - Real-time notifications  

---

## 🤝 Contributing

This is a government project for the citizens of Assam. Contributions are welcome!

### How to Contribute

1. **Fork the repository**
2. **Create a feature branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Make your changes** with proper documentation
4. **Test thoroughly**:
   ```bash
   npm test  # Run tests
   npm start # Verify server works
   ```
5. **Commit with clear messages**:
   ```bash
   git commit -m "Add: Feature description"
   ```
6. **Push to your fork**:
   ```bash
   git push origin feature/your-feature-name
   ```
7. **Submit a pull request**

### Coding Standards

- Use **ES6+ syntax** (const, let, arrow functions)
- **Async/await** for asynchronous operations
- **Descriptive variable names** (camelCase)
- **Comments** for complex logic
- **Error handling** with try-catch blocks
- **Consistent formatting** (2 spaces indentation)

---

## 📄 License

This software is developed for public service delivery and is subject to government licensing terms.

**Open Source Components**: This project uses open-source libraries (Express, JWT, etc.) which retain their original licenses.

---

## 🙏 Acknowledgments

- **CDAC** - For the initiative
- **Open Source Community** - For excellent libraries
- **Citizens of Assam** - Our end users and motivation

---

## 📈 Version History

### v1.0.0 (March 2026) - MVP Release
- ✅ 30 REST API endpoints
- ✅ OTP-based authentication
- ✅ 5 service modules
- ✅ Dual database support
- ✅ Interactive API tester
- ✅ Comprehensive documentation

### Planned v1.1.0
- SMS gateway integration
- Payment processing
- Email notifications
- Enhanced security features

---

## 💡 FAQ

**Q: Why do I see OTP in console instead of receiving SMS?**  
A: In development mode (NODE_ENV=development), OTPs are logged to console instead of sending SMS. Configure SMS gateway in production.

**Q: Can I use MySQL/PostgreSQL instead of SQLite?**  
A: Yes! Update database.js to use your preferred database. Connection pooling recommended for production.

**Q: How do I reset forgotten JWT secret?**  
A: Generate new secret, update .env, restart server. All existing tokens will be invalidated and users need to re-login.

**Q: Is this production-ready?**  
A: Core functionality is stable. For production, configure: SMS gateway, SSL/HTTPS, production database, monitoring, and backups.

**Q: How to scale for high traffic?**  
A: Use load balancer (Nginx), deploy multiple instances with PM2 cluster mode, use PostgreSQL with connection pooling, add Redis for caching.

**Q: Where is payment integration?**  
A: Payment gateway integration is planned for v1.1.0. Endpoints are designed to plug in Razorpay/Paytm.

---

**Built with ❤️ for the citizens of Assam**

*Empowering digital governance through technology*

---

**DEVELOPERS**
-Anubrata Paul
-Sakshi Sharma
-Kislay Kumar
-Aman Sagar
