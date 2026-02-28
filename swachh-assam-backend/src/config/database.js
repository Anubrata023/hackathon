const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const DB_DIR = path.join(__dirname, '../../data');
const DB_PATH = process.env.DB_PATH || path.join(DB_DIR, 'swachh_assam.db');

// Ensure data directory exists
if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });

let db;

function getDb() {
  if (!db) {
    db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        console.error('❌ Database connection error:', err.message);
        process.exit(1);
      }
      console.log('✅ Connected to SQLite database:', DB_PATH);
    });
    db.run('PRAGMA foreign_keys = ON');
    db.run('PRAGMA journal_mode = WAL');
  }
  return db;
}

function initializeDatabase() {
  return new Promise((resolve, reject) => {
    const db = getDb();

    const schema = `
      -- Users table
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE,
        mobile TEXT UNIQUE NOT NULL,
        password_hash TEXT,
        ward TEXT,
        role TEXT DEFAULT 'citizen' CHECK(role IN ('citizen','admin','field_officer')),
        swachh_points INTEGER DEFAULT 0,
        is_active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Complaints table
      CREATE TABLE IF NOT EXISTS complaints (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        reference_number TEXT UNIQUE NOT NULL,
        user_name TEXT NOT NULL,
        mobile TEXT NOT NULL,
        ward TEXT NOT NULL,
        issue_type TEXT NOT NULL,
        description TEXT NOT NULL,
        status TEXT DEFAULT 'pending' CHECK(status IN ('pending','assigned','in_progress','resolved','closed')),
        priority TEXT DEFAULT 'normal' CHECK(priority IN ('low','normal','high','urgent')),
        assigned_officer_id INTEGER,
        image_path TEXT,
        latitude REAL,
        longitude REAL,
        resolved_at DATETIME,
        resolution_note TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (assigned_officer_id) REFERENCES users(id)
      );

      -- Complaint status history
      CREATE TABLE IF NOT EXISTS complaint_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        complaint_id INTEGER NOT NULL,
        old_status TEXT,
        new_status TEXT NOT NULL,
        changed_by INTEGER,
        note TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (complaint_id) REFERENCES complaints(id),
        FOREIGN KEY (changed_by) REFERENCES users(id)
      );

      -- Bulk pickup bookings
      CREATE TABLE IF NOT EXISTS bulk_pickups (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        reference_number TEXT UNIQUE NOT NULL,
        user_name TEXT NOT NULL,
        mobile TEXT NOT NULL,
        email TEXT,
        ward TEXT NOT NULL,
        address TEXT NOT NULL,
        waste_type TEXT NOT NULL,
        estimated_quantity TEXT,
        preferred_date DATE NOT NULL,
        preferred_time_slot TEXT NOT NULL,
        status TEXT DEFAULT 'booked' CHECK(status IN ('booked','confirmed','completed','cancelled')),
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Collection schedules
      CREATE TABLE IF NOT EXISTS collection_schedules (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ward TEXT NOT NULL,
        zone TEXT NOT NULL,
        day_of_week INTEGER NOT NULL CHECK(day_of_week BETWEEN 0 AND 6),
        waste_types TEXT NOT NULL,
        shift TEXT DEFAULT 'morning' CHECK(shift IN ('morning','afternoon','evening')),
        timing TEXT DEFAULT '06:30 AM - 09:30 AM',
        vehicle_number TEXT,
        driver_name TEXT,
        is_active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Schedule overrides / holidays
      CREATE TABLE IF NOT EXISTS schedule_overrides (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        override_date DATE NOT NULL,
        ward TEXT,
        reason TEXT NOT NULL,
        rescheduled_to DATE,
        notice_text TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Swachh Points transactions
      CREATE TABLE IF NOT EXISTS points_transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        points INTEGER NOT NULL,
        type TEXT NOT NULL CHECK(type IN ('earn','redeem')),
        reason TEXT NOT NULL,
        reference_id TEXT,
        balance_after INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      );

      -- Waste audit requests
      CREATE TABLE IF NOT EXISTS audit_requests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        reference_number TEXT UNIQUE NOT NULL,
        society_name TEXT NOT NULL,
        contact_name TEXT NOT NULL,
        mobile TEXT NOT NULL,
        email TEXT,
        ward TEXT NOT NULL,
        address TEXT NOT NULL,
        household_count INTEGER,
        preferred_date DATE,
        status TEXT DEFAULT 'submitted' CHECK(status IN ('submitted','scheduled','completed','cancelled')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Composting program registrations
      CREATE TABLE IF NOT EXISTS composting_registrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_name TEXT NOT NULL,
        mobile TEXT NOT NULL,
        ward TEXT NOT NULL,
        address TEXT NOT NULL,
        household_size INTEGER,
        has_garden INTEGER DEFAULT 0,
        kit_requested INTEGER DEFAULT 0,
        status TEXT DEFAULT 'registered' CHECK(status IN ('registered','kit_dispatched','active','inactive')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Stats / analytics (for dashboard)
      CREATE TABLE IF NOT EXISTS daily_stats (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        stat_date DATE UNIQUE NOT NULL,
        wards_covered INTEGER DEFAULT 0,
        tonnes_collected REAL DEFAULT 0,
        complaints_received INTEGER DEFAULT 0,
        complaints_resolved INTEGER DEFAULT 0,
        waste_recycled_pct REAL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Notices / announcements
      CREATE TABLE IF NOT EXISTS notices (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        body TEXT NOT NULL,
        notice_type TEXT DEFAULT 'info' CHECK(notice_type IN ('info','warning','urgent','holiday')),
        ward TEXT,
        is_active INTEGER DEFAULT 1,
        expires_at DATETIME,
        created_by INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES users(id)
      );

      -- Indexes
      CREATE INDEX IF NOT EXISTS idx_complaints_reference ON complaints(reference_number);
      CREATE INDEX IF NOT EXISTS idx_complaints_mobile ON complaints(mobile);
      CREATE INDEX IF NOT EXISTS idx_complaints_status ON complaints(status);
      CREATE INDEX IF NOT EXISTS idx_complaints_ward ON complaints(ward);
      CREATE INDEX IF NOT EXISTS idx_bulk_pickups_reference ON bulk_pickups(reference_number);
      CREATE INDEX IF NOT EXISTS idx_schedules_ward ON collection_schedules(ward);
      CREATE INDEX IF NOT EXISTS idx_users_mobile ON users(mobile);
    `;

    db.exec(schema, (err) => {
      if (err) {
        console.error('❌ Schema initialization error:', err.message);
        reject(err);
      } else {
        console.log('✅ Database schema initialized');
        resolve(db);
      }
    });
  });
}

// Promise wrappers for cleaner async usage
function dbRun(sql, params = []) {
  return new Promise((resolve, reject) => {
    getDb().run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

function dbGet(sql, params = []) {
  return new Promise((resolve, reject) => {
    getDb().get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

function dbAll(sql, params = []) {
  return new Promise((resolve, reject) => {
    getDb().all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

module.exports = { getDb, initializeDatabase, dbRun, dbGet, dbAll };
