// src/database.js
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_DIR = path.join(__dirname, '..', 'data');
const DB_PATH = path.join(DB_DIR, 'gas_booking.db');

if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initializeDatabase() {
  db.exec(`
    -- ─────────────────────────────────────────
    -- CONSUMERS
    -- ─────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS consumers (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      consumer_id   TEXT    NOT NULL UNIQUE,   -- LPG Consumer ID
      name          TEXT    NOT NULL,
      mobile        TEXT    NOT NULL UNIQUE,
      aadhaar       TEXT    UNIQUE,
      email         TEXT,
      address       TEXT,
      city          TEXT    DEFAULT 'Guwahati',
      state         TEXT    DEFAULT 'Assam',
      pincode       TEXT,
      bank_account  TEXT,
      ifsc_code     TEXT,
      subsidy_eligible INTEGER DEFAULT 1,
      is_active     INTEGER DEFAULT 1,
      created_at    TEXT    DEFAULT (datetime('now')),
      updated_at    TEXT    DEFAULT (datetime('now'))
    );

    -- ─────────────────────────────────────────
    -- OTP RECORDS
    -- ─────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS otp_records (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      mobile      TEXT    NOT NULL,
      otp_code    TEXT    NOT NULL,
      purpose     TEXT    NOT NULL DEFAULT 'booking',  -- booking | update_mobile | login
      is_used     INTEGER DEFAULT 0,
      attempts    INTEGER DEFAULT 0,
      expires_at  TEXT    NOT NULL,
      created_at  TEXT    DEFAULT (datetime('now'))
    );

    -- ─────────────────────────────────────────
    -- DISTRIBUTORS
    -- ─────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS distributors (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      dist_code   TEXT    NOT NULL UNIQUE,
      name        TEXT    NOT NULL,
      address     TEXT    NOT NULL,
      city        TEXT    NOT NULL,
      pincode     TEXT,
      mobile      TEXT,
      rating      REAL    DEFAULT 4.0,
      stock_available INTEGER DEFAULT 1,
      distance_km REAL,
      is_active   INTEGER DEFAULT 1,
      created_at  TEXT    DEFAULT (datetime('now'))
    );

    -- ─────────────────────────────────────────
    -- DELIVERY SLOTS
    -- ─────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS delivery_slots (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      distributor_id INTEGER NOT NULL REFERENCES distributors(id),
      slot_date    TEXT    NOT NULL,
      slot_time    TEXT    NOT NULL,  -- e.g. '09:00-12:00'
      capacity     INTEGER DEFAULT 20,
      booked_count INTEGER DEFAULT 0,
      is_active    INTEGER DEFAULT 1,
      created_at   TEXT    DEFAULT (datetime('now'))
    );

    -- ─────────────────────────────────────────
    -- BOOKINGS
    -- ─────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS bookings (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      booking_ref     TEXT    NOT NULL UNIQUE,
      consumer_id     INTEGER NOT NULL REFERENCES consumers(id),
      distributor_id  INTEGER NOT NULL REFERENCES distributors(id),
      slot_id         INTEGER REFERENCES delivery_slots(id),
      cylinder_type   TEXT    DEFAULT '14.2 kg',
      quantity        INTEGER DEFAULT 1,
      amount          REAL,
      status          TEXT    DEFAULT 'pending',
      -- status: pending | confirmed | out_for_delivery | delivered | cancelled
      otp_verified    INTEGER DEFAULT 0,
      delivery_otp    TEXT,              -- OTP given to delivery person
      delivery_otp_verified INTEGER DEFAULT 0,
      special_instructions TEXT,
      booked_at       TEXT    DEFAULT (datetime('now')),
      confirmed_at    TEXT,
      delivered_at    TEXT,
      cancelled_at    TEXT,
      cancellation_reason TEXT
    );

    -- ─────────────────────────────────────────
    -- SUBSIDY TRANSACTIONS
    -- ─────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS subsidy_transactions (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      booking_id   INTEGER NOT NULL REFERENCES bookings(id),
      consumer_id  INTEGER NOT NULL REFERENCES consumers(id),
      amount       REAL    NOT NULL,
      status       TEXT    DEFAULT 'pending',  -- pending | credited | failed
      credited_at  TEXT,
      bank_ref     TEXT,
      created_at   TEXT    DEFAULT (datetime('now'))
    );

    -- ─────────────────────────────────────────
    -- ADMIN USERS
    -- ─────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS admin_users (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      username     TEXT    NOT NULL UNIQUE,
      password_hash TEXT   NOT NULL,
      role         TEXT    DEFAULT 'admin',   -- admin | superadmin | distributor
      distributor_id INTEGER REFERENCES distributors(id),
      is_active    INTEGER DEFAULT 1,
      last_login   TEXT,
      created_at   TEXT    DEFAULT (datetime('now'))
    );

    -- ─────────────────────────────────────────
    -- AUDIT LOG
    -- ─────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS audit_log (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      entity     TEXT    NOT NULL,
      entity_id  INTEGER,
      action     TEXT    NOT NULL,
      details    TEXT,
      ip_address TEXT,
      created_at TEXT    DEFAULT (datetime('now'))
    );

    -- Indexes
    CREATE INDEX IF NOT EXISTS idx_consumers_mobile   ON consumers(mobile);
    CREATE INDEX IF NOT EXISTS idx_consumers_consumer_id ON consumers(consumer_id);
    CREATE INDEX IF NOT EXISTS idx_otp_mobile         ON otp_records(mobile);
    CREATE INDEX IF NOT EXISTS idx_bookings_consumer  ON bookings(consumer_id);
    CREATE INDEX IF NOT EXISTS idx_bookings_ref       ON bookings(booking_ref);
    CREATE INDEX IF NOT EXISTS idx_bookings_status    ON bookings(status);
  `);

  console.log('✅  Database initialized');
}

initializeDatabase();

module.exports = db;
