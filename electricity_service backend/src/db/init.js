// src/db/init.js
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

let db;

function getDb() {
  if (!db) {
    const dbPath = process.env.DB_PATH || './data/apdcl.db';
    const dir = path.dirname(path.resolve(dbPath));
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    db = new Database(path.resolve(dbPath));
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    createTables(db);
  }
  return db;
}

function createTables(db) {
  db.exec(`
    -- Consumers table
    CREATE TABLE IF NOT EXISTS consumers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      consumer_id TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      avatar_letter TEXT NOT NULL,
      zone TEXT NOT NULL,
      division TEXT NOT NULL,
      connection_type TEXT NOT NULL DEFAULT 'LT-B Domestic',
      meter_no TEXT UNIQUE NOT NULL,
      address TEXT,
      mobile TEXT,
      email TEXT,
      is_smart_meter INTEGER DEFAULT 1,
      status TEXT DEFAULT 'active',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    -- Meter readings table (live/hourly data)
    CREATE TABLE IF NOT EXISTS meter_readings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      consumer_id TEXT NOT NULL,
      reading_kwh REAL NOT NULL,
      recorded_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (consumer_id) REFERENCES consumers(consumer_id)
    );

    -- Monthly consumption table
    CREATE TABLE IF NOT EXISTS monthly_consumption (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      consumer_id TEXT NOT NULL,
      billing_period TEXT NOT NULL,   -- e.g. '2026-02'
      units_kwh REAL NOT NULL,
      amount_inr REAL NOT NULL,
      energy_charges REAL NOT NULL,
      fixed_charge REAL NOT NULL,
      electricity_duty REAL NOT NULL,
      meter_rental REAL NOT NULL,
      arrears REAL DEFAULT 0,
      late_payment_surcharge REAL DEFAULT 0,
      due_date TEXT,
      paid_at TEXT,
      status TEXT DEFAULT 'pending',  -- pending | paid | overdue
      created_at TEXT DEFAULT (datetime('now')),
      UNIQUE(consumer_id, billing_period),
      FOREIGN KEY (consumer_id) REFERENCES consumers(consumer_id)
    );

    -- Daily consumption
    CREATE TABLE IF NOT EXISTS daily_consumption (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      consumer_id TEXT NOT NULL,
      date TEXT NOT NULL,             -- YYYY-MM-DD
      units_kwh REAL NOT NULL,
      UNIQUE(consumer_id, date),
      FOREIGN KEY (consumer_id) REFERENCES consumers(consumer_id)
    );

    -- Tariff slabs
    CREATE TABLE IF NOT EXISTS tariff_slabs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      connection_type TEXT NOT NULL,
      slab_label TEXT NOT NULL,
      units_from INTEGER NOT NULL,
      units_to INTEGER,               -- NULL = no upper limit
      rate_per_unit REAL NOT NULL,
      effective_from TEXT NOT NULL,
      effective_to TEXT
    );

    -- Smart alerts / notifications
    CREATE TABLE IF NOT EXISTS alerts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      consumer_id TEXT NOT NULL,
      type TEXT NOT NULL,             -- high_consumption | bill_due | power_restored | firmware | anomaly | info
      severity TEXT DEFAULT 'info',   -- red | amber | green | blue
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      alert_time TEXT DEFAULT (datetime('now')),
      is_read INTEGER DEFAULT 0,
      FOREIGN KEY (consumer_id) REFERENCES consumers(consumer_id)
    );

    -- Complaints
    CREATE TABLE IF NOT EXISTS complaints (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      consumer_id TEXT NOT NULL,
      subject TEXT NOT NULL,
      description TEXT NOT NULL,
      category TEXT DEFAULT 'general', -- billing | meter_fault | supply | other
      status TEXT DEFAULT 'open',      -- open | in_progress | resolved | closed
      submitted_at TEXT DEFAULT (datetime('now')),
      resolved_at TEXT,
      FOREIGN KEY (consumer_id) REFERENCES consumers(consumer_id)
    );

    -- Payment transactions
    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      consumer_id TEXT NOT NULL,
      billing_period TEXT NOT NULL,
      amount REAL NOT NULL,
      payment_mode TEXT,              -- upi | netbanking | card | cash
      transaction_ref TEXT,
      paid_at TEXT DEFAULT (datetime('now')),
      status TEXT DEFAULT 'success',
      FOREIGN KEY (consumer_id) REFERENCES consumers(consumer_id)
    );

    -- Hero stats (platform-wide)
    CREATE TABLE IF NOT EXISTS platform_stats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      stat_key TEXT UNIQUE NOT NULL,
      stat_value TEXT NOT NULL,
      updated_at TEXT DEFAULT (datetime('now'))
    );
  `);
}

module.exports = { getDb };
