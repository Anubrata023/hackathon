const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = process.env.DB_PATH || './data/apdcl.db';
const dir = path.dirname(DB_PATH);
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ─── SCHEMA ────────────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS consumers (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    consumer_id    TEXT    NOT NULL UNIQUE,
    name           TEXT    NOT NULL,
    meter_number   TEXT    NOT NULL,
    mobile         TEXT    NOT NULL,
    email          TEXT,
    division       TEXT    NOT NULL,
    address        TEXT,
    tariff_type    TEXT    DEFAULT 'LT-Domestic',
    created_at     TEXT    DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS bills (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    consumer_id      TEXT    NOT NULL,
    bill_month       TEXT    NOT NULL,
    billing_period   TEXT    NOT NULL,
    units_consumed   REAL    NOT NULL,
    energy_charges   REAL    NOT NULL,
    fixed_charges    REAL    NOT NULL DEFAULT 250.00,
    electricity_duty REAL    NOT NULL,
    arrears          REAL    NOT NULL DEFAULT 0.00,
    subsidy          REAL    NOT NULL DEFAULT 0.00,
    total_payable    REAL    NOT NULL,
    due_date         TEXT    NOT NULL,
    status           TEXT    NOT NULL DEFAULT 'UNPAID',
    created_at       TEXT    DEFAULT (datetime('now')),
    FOREIGN KEY (consumer_id) REFERENCES consumers(consumer_id)
  );

  CREATE TABLE IF NOT EXISTS payments (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    transaction_id   TEXT    NOT NULL UNIQUE,
    consumer_id      TEXT    NOT NULL,
    bill_id          INTEGER,
    amount_paid      REAL    NOT NULL,
    payment_method   TEXT    NOT NULL,
    payment_detail   TEXT,
    status           TEXT    NOT NULL DEFAULT 'PENDING',
    gateway_ref      TEXT,
    paid_at          TEXT,
    created_at       TEXT    DEFAULT (datetime('now')),
    FOREIGN KEY (consumer_id) REFERENCES consumers(consumer_id),
    FOREIGN KEY (bill_id) REFERENCES bills(id)
  );

  CREATE TABLE IF NOT EXISTS payment_history (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    consumer_id      TEXT    NOT NULL,
    bill_month       TEXT    NOT NULL,
    amount_paid      REAL    NOT NULL,
    payment_method   TEXT    NOT NULL,
    transaction_id   TEXT    NOT NULL,
    status           TEXT    NOT NULL DEFAULT 'PAID',
    paid_at          TEXT    NOT NULL,
    FOREIGN KEY (consumer_id) REFERENCES consumers(consumer_id)
  );

  CREATE TABLE IF NOT EXISTS divisions (
    id    INTEGER PRIMARY KEY AUTOINCREMENT,
    name  TEXT NOT NULL UNIQUE
  );

  CREATE INDEX IF NOT EXISTS idx_bills_consumer ON bills(consumer_id);
  CREATE INDEX IF NOT EXISTS idx_payments_consumer ON payments(consumer_id);
  CREATE INDEX IF NOT EXISTS idx_payments_txn ON payments(transaction_id);
`);

module.exports = db;
