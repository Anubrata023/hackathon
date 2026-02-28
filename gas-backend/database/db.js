const Database = require('better-sqlite3');
const path     = require('path');

const DB_PATH = path.join(__dirname, 'gas_services.db');
let db;

function getDB() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
  }
  return db;
}

function initializeDatabase(callback) {
  const db = getDB();

  db.exec(`
    -- ── Users ─────────────────────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS users (
      id            TEXT PRIMARY KEY,
      name          TEXT NOT NULL,
      email         TEXT UNIQUE NOT NULL,
      phone         TEXT,
      password_hash TEXT NOT NULL,
      role          TEXT NOT NULL DEFAULT 'customer',
      address       TEXT,
      created_at    DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- ── Gas Connections ────────────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS connections (
      id              TEXT PRIMARY KEY,
      user_id         TEXT NOT NULL,
      consumer_number TEXT UNIQUE NOT NULL,
      address         TEXT NOT NULL,
      connection_type TEXT NOT NULL DEFAULT 'domestic',
      status          TEXT NOT NULL DEFAULT 'pending',
      meter_number    TEXT,
      created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- ── Service Requests ──────────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS service_requests (
      id             TEXT PRIMARY KEY,
      user_id        TEXT NOT NULL,
      connection_id  TEXT,
      service_type   TEXT NOT NULL,
      description    TEXT,
      status         TEXT NOT NULL DEFAULT 'pending',
      priority       TEXT NOT NULL DEFAULT 'normal',
      assigned_to    TEXT,
      scheduled_date DATE,
      resolved_at    DATETIME,
      created_at     DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id)       REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (connection_id) REFERENCES connections(id) ON DELETE SET NULL
    );

    -- ── Bills ─────────────────────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS bills (
      id             TEXT PRIMARY KEY,
      connection_id  TEXT NOT NULL,
      user_id        TEXT NOT NULL,
      bill_number    TEXT UNIQUE NOT NULL,
      billing_period TEXT NOT NULL,
      units_consumed REAL NOT NULL DEFAULT 0,
      amount         REAL NOT NULL,
      due_date       DATE NOT NULL,
      status         TEXT NOT NULL DEFAULT 'unpaid',
      created_at     DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (connection_id) REFERENCES connections(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id)       REFERENCES users(id) ON DELETE CASCADE
    );

    -- ── Payments ──────────────────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS payments (
      id              TEXT PRIMARY KEY,
      bill_id         TEXT NOT NULL,
      user_id         TEXT NOT NULL,
      amount          REAL NOT NULL,
      payment_method  TEXT NOT NULL DEFAULT 'online',
      transaction_ref TEXT,
      paid_at         DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (bill_id)  REFERENCES bills(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id)  REFERENCES users(id) ON DELETE CASCADE
    );

    -- ── Complaints ────────────────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS complaints (
      id            TEXT PRIMARY KEY,
      user_id       TEXT NOT NULL,
      connection_id TEXT,
      subject       TEXT NOT NULL,
      description   TEXT NOT NULL,
      category      TEXT NOT NULL DEFAULT 'general',
      status        TEXT NOT NULL DEFAULT 'open',
      response      TEXT,
      resolved_at   DATETIME,
      created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id)       REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (connection_id) REFERENCES connections(id) ON DELETE SET NULL
    );

    -- ── Notifications ─────────────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS notifications (
      id         TEXT PRIMARY KEY,
      user_id    TEXT NOT NULL,
      title      TEXT NOT NULL,
      message    TEXT NOT NULL,
      type       TEXT NOT NULL DEFAULT 'info',
      is_read    INTEGER NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  console.log('✅  Database initialized →', DB_PATH);
  if (callback) callback();
}

module.exports = { getDB, initializeDatabase };
