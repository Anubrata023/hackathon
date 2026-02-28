// db/init.js — Initialize SQLite database schema
const Database = require('better-sqlite3');
const path = require('path');
require('dotenv').config();

const DB_PATH = path.resolve(process.env.DB_PATH || './db/apdcl.db');

let db;

function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
  }
  return db;
}

function initDb() {
  const database = getDb();

  database.exec(`
    -- ─────────────────────────────────────────
    -- CONSUMERS
    -- ─────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS consumers (
      id               INTEGER PRIMARY KEY AUTOINCREMENT,
      consumer_id      TEXT UNIQUE NOT NULL,       -- e.g. AS-2400-8271
      name             TEXT NOT NULL,
      mobile           TEXT NOT NULL,
      email            TEXT,
      address          TEXT,
      meter_number     TEXT UNIQUE NOT NULL,       -- e.g. GHY-SM-00481
      division         TEXT NOT NULL DEFAULT 'Guwahati Urban',
      tariff_slab      REAL NOT NULL DEFAULT 7.25, -- ₹ per kWh
      fixed_charge     REAL NOT NULL DEFAULT 250.00,
      duty_rate        REAL NOT NULL DEFAULT 0.05, -- 5%
      is_active        INTEGER NOT NULL DEFAULT 1,
      created_at       TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- ─────────────────────────────────────────
    -- BILLS
    -- ─────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS bills (
      id               INTEGER PRIMARY KEY AUTOINCREMENT,
      bill_number      TEXT UNIQUE NOT NULL,
      consumer_id      TEXT NOT NULL REFERENCES consumers(consumer_id),
      billing_period   TEXT NOT NULL,              -- e.g. "February 2026"
      period_from      TEXT NOT NULL,              -- ISO date
      period_to        TEXT NOT NULL,              -- ISO date
      units_consumed   REAL NOT NULL DEFAULT 0,
      energy_charges   REAL NOT NULL DEFAULT 0,
      fixed_charge     REAL NOT NULL DEFAULT 0,
      electricity_duty REAL NOT NULL DEFAULT 0,
      arrears          REAL NOT NULL DEFAULT 0,
      subsidy          REAL NOT NULL DEFAULT 0,
      total_amount     REAL NOT NULL DEFAULT 0,
      due_date         TEXT NOT NULL,
      status           TEXT NOT NULL DEFAULT 'UNPAID', -- UNPAID | PAID | PARTIALLY_PAID | OVERDUE
      paid_amount      REAL NOT NULL DEFAULT 0,
      created_at       TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- ─────────────────────────────────────────
    -- TRANSACTIONS (PAYMENTS)
    -- ─────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS transactions (
      id               INTEGER PRIMARY KEY AUTOINCREMENT,
      txn_ref          TEXT UNIQUE NOT NULL,       -- e.g. APDCL-TXN-26-48291
      bill_id          INTEGER NOT NULL REFERENCES bills(id),
      consumer_id      TEXT NOT NULL REFERENCES consumers(consumer_id),
      amount           REAL NOT NULL,
      payment_method   TEXT NOT NULL,              -- UPI | CARD | NET_BANKING | CASH
      payment_detail   TEXT,                       -- UPI app / bank name / card last 4
      gateway_ref      TEXT,                       -- simulated gateway transaction ID
      status           TEXT NOT NULL DEFAULT 'PENDING', -- PENDING | SUCCESS | FAILED | REFUNDED
      initiated_at     TEXT NOT NULL DEFAULT (datetime('now')),
      completed_at     TEXT,
      ip_address       TEXT,
      notes            TEXT
    );

    -- ─────────────────────────────────────────
    -- OTP SESSIONS
    -- ─────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS otp_sessions (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      consumer_id TEXT NOT NULL,
      mobile      TEXT NOT NULL,
      otp_code    TEXT NOT NULL,
      purpose     TEXT NOT NULL DEFAULT 'PAYMENT', -- PAYMENT | LOGIN
      is_used     INTEGER NOT NULL DEFAULT 0,
      expires_at  TEXT NOT NULL,
      created_at  TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- ─────────────────────────────────────────
    -- RECEIPTS
    -- ─────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS receipts (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      receipt_no   TEXT UNIQUE NOT NULL,
      txn_id       INTEGER NOT NULL REFERENCES transactions(id),
      consumer_id  TEXT NOT NULL REFERENCES consumers(consumer_id),
      bill_id      INTEGER NOT NULL REFERENCES bills(id),
      issued_at    TEXT NOT NULL DEFAULT (datetime('now')),
      receipt_data TEXT NOT NULL  -- JSON snapshot of receipt
    );

    -- ─────────────────────────────────────────
    -- AUDIT LOG
    -- ─────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS audit_log (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      event       TEXT NOT NULL,
      entity_type TEXT,
      entity_id   TEXT,
      payload     TEXT, -- JSON
      ip_address  TEXT,
      created_at  TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Indexes
    CREATE INDEX IF NOT EXISTS idx_bills_consumer    ON bills(consumer_id);
    CREATE INDEX IF NOT EXISTS idx_bills_status      ON bills(status);
    CREATE INDEX IF NOT EXISTS idx_txn_consumer      ON transactions(consumer_id);
    CREATE INDEX IF NOT EXISTS idx_txn_status        ON transactions(status);
    CREATE INDEX IF NOT EXISTS idx_otp_consumer      ON otp_sessions(consumer_id);
    CREATE INDEX IF NOT EXISTS idx_receipts_consumer ON receipts(consumer_id);
  `);

  console.log('✅  Database schema initialised at', DB_PATH);
  return database;
}

module.exports = { getDb, initDb };
