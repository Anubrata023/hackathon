const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = process.env.DB_PATH || './data/electricity.db';

// Ensure data directory exists
const dir = path.dirname(DB_PATH);
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

let db;

function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
  }
  return db;
}

function initializeDatabase() {
  return new Promise((resolve, reject) => {
    try {
      const database = getDb();

      // ── Users / Consumers ────────────────────────────────────────────────
      database.exec(`
        CREATE TABLE IF NOT EXISTS users (
          id            INTEGER PRIMARY KEY AUTOINCREMENT,
          name          TEXT    NOT NULL,
          email         TEXT    UNIQUE NOT NULL,
          phone         TEXT    NOT NULL,
          password_hash TEXT    NOT NULL,
          role          TEXT    NOT NULL DEFAULT 'consumer',  -- consumer | admin | officer
          consumer_id   TEXT    UNIQUE,
          address       TEXT,
          district      TEXT,
          pincode       TEXT,
          meter_number  TEXT    UNIQUE,
          connection_type TEXT  DEFAULT 'domestic',           -- domestic | commercial | industrial
          tariff_category TEXT  DEFAULT 'LT-1',
          status        TEXT    DEFAULT 'active',             -- active | suspended | disconnected
          created_at    TEXT    DEFAULT (datetime('now')),
          updated_at    TEXT    DEFAULT (datetime('now'))
        );

        -- ── Bills ───────────────────────────────────────────────────────────
        CREATE TABLE IF NOT EXISTS bills (
          id              INTEGER PRIMARY KEY AUTOINCREMENT,
          bill_number     TEXT    UNIQUE NOT NULL,
          user_id         INTEGER NOT NULL REFERENCES users(id),
          consumer_id     TEXT    NOT NULL,
          meter_number    TEXT    NOT NULL,
          billing_month   TEXT    NOT NULL,        -- e.g. 2024-03
          reading_date    TEXT    NOT NULL,
          previous_reading INTEGER DEFAULT 0,
          current_reading  INTEGER DEFAULT 0,
          units_consumed   INTEGER GENERATED ALWAYS AS (current_reading - previous_reading) STORED,
          energy_charges   REAL    DEFAULT 0,
          fixed_charges    REAL    DEFAULT 0,
          tax_charges      REAL    DEFAULT 0,
          other_charges    REAL    DEFAULT 0,
          total_amount     REAL    DEFAULT 0,
          due_date         TEXT    NOT NULL,
          status           TEXT    DEFAULT 'unpaid', -- unpaid | paid | overdue | disputed
          created_at       TEXT    DEFAULT (datetime('now'))
        );

        -- ── Payments ────────────────────────────────────────────────────────
        CREATE TABLE IF NOT EXISTS payments (
          id                INTEGER PRIMARY KEY AUTOINCREMENT,
          transaction_id    TEXT    UNIQUE NOT NULL,
          user_id           INTEGER NOT NULL REFERENCES users(id),
          bill_id           INTEGER REFERENCES bills(id),
          amount            REAL    NOT NULL,
          payment_method    TEXT    NOT NULL,       -- online | upi | netbanking | card | cash
          payment_gateway   TEXT,
          gateway_ref       TEXT,
          status            TEXT    DEFAULT 'pending', -- pending | success | failed | refunded
          remarks           TEXT,
          paid_at           TEXT    DEFAULT (datetime('now')),
          created_at        TEXT    DEFAULT (datetime('now'))
        );

        -- ── Complaints ──────────────────────────────────────────────────────
        CREATE TABLE IF NOT EXISTS complaints (
          id              INTEGER PRIMARY KEY AUTOINCREMENT,
          ticket_number   TEXT    UNIQUE NOT NULL,
          user_id         INTEGER NOT NULL REFERENCES users(id),
          category        TEXT    NOT NULL,         -- power_outage | billing | meter_fault | new_connection | others
          subject         TEXT    NOT NULL,
          description     TEXT    NOT NULL,
          priority        TEXT    DEFAULT 'normal', -- low | normal | high | urgent
          status          TEXT    DEFAULT 'open',   -- open | in_progress | resolved | closed
          assigned_to     INTEGER REFERENCES users(id),
          resolution_note TEXT,
          created_at      TEXT    DEFAULT (datetime('now')),
          updated_at      TEXT    DEFAULT (datetime('now')),
          resolved_at     TEXT
        );

        -- ── New Connection Requests ──────────────────────────────────────────
        CREATE TABLE IF NOT EXISTS connection_requests (
          id                INTEGER PRIMARY KEY AUTOINCREMENT,
          application_no    TEXT    UNIQUE NOT NULL,
          user_id           INTEGER NOT NULL REFERENCES users(id),
          applicant_name    TEXT    NOT NULL,
          applicant_phone   TEXT    NOT NULL,
          applicant_email   TEXT    NOT NULL,
          address           TEXT    NOT NULL,
          district          TEXT    NOT NULL,
          pincode           TEXT    NOT NULL,
          connection_type   TEXT    NOT NULL,         -- domestic | commercial | industrial
          load_required     REAL    NOT NULL,          -- in kW
          purpose           TEXT,
          ownership_proof   TEXT,                      -- stored doc name/path
          id_proof          TEXT,
          status            TEXT    DEFAULT 'pending', -- pending | documents_verified | approved | rejected | installed
          remarks           TEXT,
          approved_by       INTEGER REFERENCES users(id),
          approved_at       TEXT,
          created_at        TEXT    DEFAULT (datetime('now')),
          updated_at        TEXT    DEFAULT (datetime('now'))
        );

        -- ── Power Outage Notices ─────────────────────────────────────────────
        CREATE TABLE IF NOT EXISTS outages (
          id           INTEGER PRIMARY KEY AUTOINCREMENT,
          title        TEXT NOT NULL,
          description  TEXT NOT NULL,
          area         TEXT NOT NULL,
          district     TEXT NOT NULL,
          outage_type  TEXT DEFAULT 'planned',        -- planned | unplanned | maintenance
          start_time   TEXT NOT NULL,
          end_time     TEXT,
          status       TEXT DEFAULT 'scheduled',      -- scheduled | active | resolved
          posted_by    INTEGER REFERENCES users(id),
          created_at   TEXT DEFAULT (datetime('now')),
          updated_at   TEXT DEFAULT (datetime('now'))
        );

        -- ── Meter Reading Requests ──────────────────────────────────────────
        CREATE TABLE IF NOT EXISTS meter_reading_requests (
          id           INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id      INTEGER NOT NULL REFERENCES users(id),
          consumer_id  TEXT    NOT NULL,
          meter_number TEXT    NOT NULL,
          requested_at TEXT    DEFAULT (datetime('now')),
          preferred_date TEXT,
          status       TEXT    DEFAULT 'pending',     -- pending | scheduled | completed
          officer_id   INTEGER REFERENCES users(id),
          reading_value INTEGER,
          reading_date TEXT,
          notes        TEXT
        );
      `);

      // ── Seed admin user ───────────────────────────────────────────────────
      const bcrypt = require('bcryptjs');
      const existingAdmin = database.prepare("SELECT id FROM users WHERE email = ?").get('admin@apdcl.gov.in');
      if (!existingAdmin) {
        const hash = bcrypt.hashSync('Admin@1234', 10);
        database.prepare(`
          INSERT INTO users (name, email, phone, password_hash, role, consumer_id)
          VALUES (?, ?, ?, ?, 'admin', 'ADMIN001')
        `).run('APDCL Admin', 'admin@apdcl.gov.in', '9999999999', hash);

        // Seed a demo consumer
        const consumerHash = bcrypt.hashSync('Consumer@123', 10);
        database.prepare(`
          INSERT INTO users (name, email, phone, password_hash, role, consumer_id, meter_number, address, district, pincode, connection_type)
          VALUES (?, ?, ?, ?, 'consumer', ?, ?, ?, ?, ?, ?)
        `).run('Rahul Sharma', 'rahul@example.com', '9876543210', consumerHash,
          'AS-GUW-001234', 'MTR-56789', '123, GS Road, Paltan Bazaar', 'Kamrup Metro', '781001', 'domestic');

        console.log('✅ Seeded admin and demo consumer');
      }

      console.log('✅ Database initialized successfully');
      resolve(database);
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = { getDb, initializeDatabase };
