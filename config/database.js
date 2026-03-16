const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Ensure data directory exists
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'suvidha.db');
const db = new Database(dbPath);

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initializeDatabase() {
  db.exec(`
    -- ═══════════════════════════════════════════════
    -- USERS & AUTHENTICATION
    -- ═══════════════════════════════════════════════
    CREATE TABLE IF NOT EXISTS users (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      phone         TEXT UNIQUE NOT NULL,
      name          TEXT,
      email         TEXT UNIQUE,
      aadhaar       TEXT UNIQUE,
      district      TEXT,
      address       TEXT,
      role          TEXT NOT NULL DEFAULT 'citizen',
      is_active     INTEGER NOT NULL DEFAULT 1,
      created_at    TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

    -- ═══════════════════════════════════════════════
    -- OTP MANAGEMENT
    -- ═══════════════════════════════════════════════
    CREATE TABLE IF NOT EXISTS otps (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      phone         TEXT NOT NULL,
      otp_code      TEXT NOT NULL,
      purpose       TEXT NOT NULL DEFAULT 'login',
      is_verified   INTEGER NOT NULL DEFAULT 0,
      expires_at    TEXT NOT NULL,
      created_at    TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_otps_phone ON otps(phone);
    CREATE INDEX IF NOT EXISTS idx_otps_created ON otps(created_at);

    -- ═══════════════════════════════════════════════
    -- MODULE 1: MUNICIPAL SERVICES
    -- ═══════════════════════════════════════════════
    
    -- Waste Management
    CREATE TABLE IF NOT EXISTS waste_reports (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id         INTEGER NOT NULL,
      report_number   TEXT UNIQUE NOT NULL,
      location        TEXT NOT NULL,
      ward_number     TEXT,
      latitude        REAL,
      longitude       REAL,
      waste_type      TEXT NOT NULL,
      description     TEXT,
      photo_url       TEXT,
      status          TEXT NOT NULL DEFAULT 'pending',
      priority        TEXT NOT NULL DEFAULT 'normal',
      assigned_to     INTEGER,
      scheduled_date  TEXT,
      completed_at    TEXT,
      created_at      TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    -- Grievances (Jan Sunwai)
    CREATE TABLE IF NOT EXISTS grievances (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id         INTEGER NOT NULL,
      grievance_number TEXT UNIQUE NOT NULL,
      category        TEXT NOT NULL,
      subject         TEXT NOT NULL,
      description     TEXT NOT NULL,
      department      TEXT NOT NULL,
      priority        TEXT NOT NULL DEFAULT 'normal',
      status          TEXT NOT NULL DEFAULT 'submitted',
      document_url    TEXT,
      response        TEXT,
      resolved_at     TEXT,
      created_at      TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at      TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    -- Water Supply
    CREATE TABLE IF NOT EXISTS water_connections (
      id                INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id           INTEGER NOT NULL,
      connection_number TEXT UNIQUE,
      application_number TEXT UNIQUE NOT NULL,
      connection_type   TEXT NOT NULL,
      property_type     TEXT NOT NULL,
      address           TEXT NOT NULL,
      ward_number       TEXT,
      status            TEXT NOT NULL DEFAULT 'pending',
      approved_at       TEXT,
      installed_at      TEXT,
      created_at        TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS water_bills (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      connection_id   INTEGER NOT NULL,
      user_id         INTEGER NOT NULL,
      bill_number     TEXT UNIQUE NOT NULL,
      billing_month   TEXT NOT NULL,
      billing_year    INTEGER NOT NULL,
      units_consumed  REAL NOT NULL,
      amount          REAL NOT NULL,
      due_date        TEXT NOT NULL,
      status          TEXT NOT NULL DEFAULT 'unpaid',
      paid_at         TEXT,
      created_at      TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (connection_id) REFERENCES water_connections(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    -- ═══════════════════════════════════════════════
    -- MODULE 2: ELECTRICITY SERVICES
    -- ═══════════════════════════════════════════════
    
    CREATE TABLE IF NOT EXISTS electricity_connections (
      id                INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id           INTEGER NOT NULL,
      consumer_id       TEXT UNIQUE,
      application_number TEXT UNIQUE NOT NULL,
      meter_number      TEXT UNIQUE,
      connection_type   TEXT NOT NULL,
      sanctioned_load   REAL NOT NULL,
      address           TEXT NOT NULL,
      district          TEXT NOT NULL,
      status            TEXT NOT NULL DEFAULT 'pending',
      approved_at       TEXT,
      installed_at      TEXT,
      created_at        TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS electricity_bills (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      connection_id   INTEGER NOT NULL,
      user_id         INTEGER NOT NULL,
      bill_number     TEXT UNIQUE NOT NULL,
      billing_month   TEXT NOT NULL,
      billing_year    INTEGER NOT NULL,
      units_consumed  REAL NOT NULL,
      energy_charges  REAL NOT NULL,
      fixed_charges   REAL NOT NULL,
      total_amount    REAL NOT NULL,
      due_date        TEXT NOT NULL,
      status          TEXT NOT NULL DEFAULT 'unpaid',
      paid_at         TEXT,
      created_at      TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (connection_id) REFERENCES electricity_connections(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS meter_readings (
      id               INTEGER PRIMARY KEY AUTOINCREMENT,
      connection_id    INTEGER NOT NULL,
      reading_date     TEXT NOT NULL,
      previous_reading REAL NOT NULL,
      current_reading  REAL NOT NULL,
      units_consumed   REAL NOT NULL,
      created_at       TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (connection_id) REFERENCES electricity_connections(id)
    );

    -- ═══════════════════════════════════════════════
    -- MODULE 3: GAS SERVICES
    -- ═══════════════════════════════════════════════
    
    CREATE TABLE IF NOT EXISTS gas_connections (
      id                INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id           INTEGER NOT NULL,
      consumer_id       TEXT UNIQUE,
      application_number TEXT UNIQUE NOT NULL,
      connection_type   TEXT NOT NULL,
      distributor       TEXT,
      address           TEXT NOT NULL,
      status            TEXT NOT NULL DEFAULT 'pending',
      approved_at       TEXT,
      created_at        TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS gas_bookings (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      connection_id   INTEGER NOT NULL,
      user_id         INTEGER NOT NULL,
      booking_number  TEXT UNIQUE NOT NULL,
      cylinder_type   TEXT NOT NULL,
      quantity        INTEGER NOT NULL DEFAULT 1,
      delivery_address TEXT NOT NULL,
      status          TEXT NOT NULL DEFAULT 'booked',
      amount          REAL NOT NULL,
      booked_at       TEXT NOT NULL DEFAULT (datetime('now')),
      delivered_at    TEXT,
      FOREIGN KEY (connection_id) REFERENCES gas_connections(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    -- ═══════════════════════════════════════════════
    -- MODULE 4: SCHOLARSHIP SERVICES
    -- ═══════════════════════════════════════════════
    
    CREATE TABLE IF NOT EXISTS scholarships (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      name            TEXT NOT NULL,
      description     TEXT NOT NULL,
      category        TEXT NOT NULL,
      eligibility     TEXT NOT NULL,
      amount          REAL NOT NULL,
      deadline        TEXT NOT NULL,
      is_active       INTEGER NOT NULL DEFAULT 1,
      created_at      TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS scholarship_applications (
      id                INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id           INTEGER NOT NULL,
      scholarship_id    INTEGER NOT NULL,
      application_number TEXT UNIQUE NOT NULL,
      student_name      TEXT NOT NULL,
      father_name       TEXT NOT NULL,
      mother_name       TEXT NOT NULL,
      dob               TEXT NOT NULL,
      gender            TEXT NOT NULL,
      category          TEXT NOT NULL,
      annual_income     REAL NOT NULL,
      class_level       TEXT NOT NULL,
      school_college    TEXT NOT NULL,
      marks_percentage  REAL NOT NULL,
      bank_account      TEXT NOT NULL,
      ifsc_code         TEXT NOT NULL,
      documents_json    TEXT,
      status            TEXT NOT NULL DEFAULT 'submitted',
      remarks           TEXT,
      approved_at       TEXT,
      disbursed_at      TEXT,
      created_at        TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (scholarship_id) REFERENCES scholarships(id)
    );

    -- ═══════════════════════════════════════════════
    -- PAYMENTS (Common across all modules)
    -- ═══════════════════════════════════════════════
    
    CREATE TABLE IF NOT EXISTS payments (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id         INTEGER NOT NULL,
      module          TEXT NOT NULL,
      reference_id    INTEGER NOT NULL,
      bill_number     TEXT,
      amount          REAL NOT NULL,
      payment_method  TEXT NOT NULL,
      transaction_id  TEXT UNIQUE,
      status          TEXT NOT NULL DEFAULT 'pending',
      paid_at         TEXT,
      created_at      TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    -- ═══════════════════════════════════════════════
    -- SEED DATA
    -- ═══════════════════════════════════════════════
    
    -- Sample Scholarships
    INSERT OR IGNORE INTO scholarships (id, name, description, category, eligibility, amount, deadline)
    VALUES 
      (1, 'Pre-Matric Scholarship', 'For students studying in classes 1-10', 'Merit', 'Class 1-10, Family income < 2.5 Lakh', 12000, '2026-06-30'),
      (2, 'Post-Matric Scholarship', 'For students studying in classes 11-12 and higher education', 'Merit', 'Class 11+ or College, Family income < 2.5 Lakh', 20000, '2026-08-31'),
      (3, 'Merit-cum-Means Scholarship', 'For economically weaker meritorious students', 'Merit-cum-Means', 'Minimum 75% marks, Family income < 1.5 Lakh', 25000, '2026-07-15');

  `);

  console.log('✅ Database initialized successfully');
  console.log(`📁 Database location: ${dbPath}`);
}

// Initialize database
initializeDatabase();

module.exports = db;
