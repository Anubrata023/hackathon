// src/db/setup.js — Run once to create all database tables
// Usage: npm run setup

require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.resolve(process.env.DB_PATH || './db/water_portal.db');
const dbDir  = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`

  -- ═══════════════════════════════════════════════
  -- USERS  (citizens + admin staff)
  -- ═══════════════════════════════════════════════
  CREATE TABLE IF NOT EXISTS users (
    id            TEXT PRIMARY KEY,
    name          TEXT NOT NULL,
    email         TEXT UNIQUE NOT NULL,
    phone         TEXT UNIQUE,
    password      TEXT NOT NULL,
    role          TEXT NOT NULL DEFAULT 'citizen'
                    CHECK(role IN ('citizen','officer','admin')),
    ward_number   INTEGER,
    address       TEXT,
    is_active     INTEGER NOT NULL DEFAULT 1,
    last_login    TEXT,
    created_at    TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
  );

  -- ═══════════════════════════════════════════════
  -- WATER CONNECTIONS
  -- ═══════════════════════════════════════════════
  CREATE TABLE IF NOT EXISTS connections (
    id              TEXT PRIMARY KEY,
    app_number      TEXT UNIQUE NOT NULL,    -- e.g. WC-2026-00123
    user_id         TEXT REFERENCES users(id),
    applicant_name  TEXT NOT NULL,
    applicant_email TEXT NOT NULL,
    applicant_phone TEXT NOT NULL,
    connection_type TEXT NOT NULL DEFAULT 'domestic'
                      CHECK(connection_type IN ('domestic','commercial','industrial')),
    property_address TEXT NOT NULL,
    ward_number     INTEGER NOT NULL,
    property_type   TEXT,                   -- owned / rented
    pipe_size       TEXT DEFAULT '15mm',    -- 15mm / 20mm / 25mm
    status          TEXT NOT NULL DEFAULT 'submitted'
                      CHECK(status IN ('submitted','under_review','approved',
                                       'pending_docs','inspection_scheduled',
                                       'connected','rejected','cancelled')),
    deposit_amount  REAL DEFAULT 0,
    deposit_paid    INTEGER DEFAULT 0,
    meter_number    TEXT,
    inspection_date TEXT,
    connection_date TEXT,
    remarks         TEXT,
    assigned_to     TEXT REFERENCES users(id),
    documents       TEXT,                   -- JSON array of file URLs
    created_at      TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
  );

  -- ═══════════════════════════════════════════════
  -- WATER BILLS
  -- ═══════════════════════════════════════════════
  CREATE TABLE IF NOT EXISTS bills (
    id              TEXT PRIMARY KEY,
    bill_number     TEXT UNIQUE NOT NULL,   -- e.g. WB-2026-02-00456
    connection_id   TEXT REFERENCES connections(id),
    user_id         TEXT REFERENCES users(id),
    meter_number    TEXT NOT NULL,
    billing_period  TEXT NOT NULL,          -- e.g. "Feb 2026"
    reading_prev    REAL NOT NULL DEFAULT 0,
    reading_curr    REAL NOT NULL DEFAULT 0,
    units_consumed  REAL NOT NULL DEFAULT 0,
    amount_basic    REAL NOT NULL DEFAULT 0,
    amount_tax      REAL NOT NULL DEFAULT 0,
    amount_arrears  REAL DEFAULT 0,
    amount_total    REAL NOT NULL DEFAULT 0,
    due_date        TEXT NOT NULL,
    status          TEXT NOT NULL DEFAULT 'unpaid'
                      CHECK(status IN ('unpaid','paid','overdue','waived','disputed')),
    payment_date    TEXT,
    payment_method  TEXT,
    payment_ref     TEXT,
    receipt_url     TEXT,
    created_at      TEXT NOT NULL DEFAULT (datetime('now'))
  );

  -- ═══════════════════════════════════════════════
  -- METER READINGS  (citizen self-submissions)
  -- ═══════════════════════════════════════════════
  CREATE TABLE IF NOT EXISTS meter_readings (
    id              TEXT PRIMARY KEY,
    connection_id   TEXT REFERENCES connections(id),
    user_id         TEXT REFERENCES users(id),
    meter_number    TEXT NOT NULL,
    reading_value   REAL NOT NULL,
    reading_date    TEXT NOT NULL DEFAULT (date('now')),
    reading_month   TEXT NOT NULL,          -- "2026-02"
    photo_url       TEXT,
    is_verified     INTEGER DEFAULT 0,
    verified_by     TEXT REFERENCES users(id),
    notes           TEXT,
    submitted_at    TEXT NOT NULL DEFAULT (datetime('now'))
  );

  -- ═══════════════════════════════════════════════
  -- LEAKAGE / BURST PIPE COMPLAINTS
  -- ═══════════════════════════════════════════════
  CREATE TABLE IF NOT EXISTS leakage_complaints (
    id              TEXT PRIMARY KEY,
    ticket_id       TEXT UNIQUE NOT NULL,   -- e.g. LK-2026-00789
    reporter_name   TEXT NOT NULL,
    reporter_phone  TEXT NOT NULL,
    reporter_email  TEXT,
    ward_number     INTEGER NOT NULL,
    location_address TEXT NOT NULL,
    latitude        REAL,
    longitude       REAL,
    severity        TEXT NOT NULL DEFAULT 'medium'
                      CHECK(severity IN ('minor','medium','major','burst')),
    description     TEXT,
    photo_url       TEXT,
    status          TEXT NOT NULL DEFAULT 'reported'
                      CHECK(status IN ('reported','acknowledged','assigned',
                                       'in_progress','resolved','closed')),
    assigned_to     TEXT REFERENCES users(id),
    assigned_at     TEXT,
    resolved_at     TEXT,
    resolution_note TEXT,
    reported_at     TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
  );

  -- ═══════════════════════════════════════════════
  -- TANKER REQUESTS
  -- ═══════════════════════════════════════════════
  CREATE TABLE IF NOT EXISTS tanker_requests (
    id              TEXT PRIMARY KEY,
    request_number  TEXT UNIQUE NOT NULL,   -- e.g. TK-2026-00321
    requester_name  TEXT NOT NULL,
    requester_phone TEXT NOT NULL,
    requester_email TEXT,
    delivery_address TEXT NOT NULL,
    ward_number     INTEGER NOT NULL,
    capacity_litres INTEGER NOT NULL DEFAULT 5000,
    request_type    TEXT NOT NULL DEFAULT 'emergency'
                      CHECK(request_type IN ('emergency','scheduled','commercial')),
    preferred_date  TEXT NOT NULL,
    preferred_time  TEXT,
    reason          TEXT,
    status          TEXT NOT NULL DEFAULT 'pending'
                      CHECK(status IN ('pending','confirmed','dispatched',
                                       'delivered','cancelled')),
    tanker_number   TEXT,
    driver_name     TEXT,
    driver_phone    TEXT,
    charge_amount   REAL DEFAULT 0,
    charge_paid     INTEGER DEFAULT 0,
    dispatched_at   TEXT,
    delivered_at    TEXT,
    created_at      TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
  );

  -- ═══════════════════════════════════════════════
  -- METER COMPLAINTS
  -- ═══════════════════════════════════════════════
  CREATE TABLE IF NOT EXISTS meter_complaints (
    id              TEXT PRIMARY KEY,
    ticket_id       TEXT UNIQUE NOT NULL,   -- e.g. MC-2026-00111
    user_id         TEXT REFERENCES users(id),
    connection_id   TEXT REFERENCES connections(id),
    meter_number    TEXT NOT NULL,
    complaint_type  TEXT NOT NULL
                      CHECK(complaint_type IN ('faulty','damaged','tampered',
                                               'slow','fast','no_reading')),
    description     TEXT,
    photo_url       TEXT,
    status          TEXT NOT NULL DEFAULT 'submitted'
                      CHECK(status IN ('submitted','inspecting','replacement_scheduled',
                                       'replaced','closed')),
    technician_name TEXT,
    scheduled_date  TEXT,
    resolved_at     TEXT,
    created_at      TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
  );

  -- ═══════════════════════════════════════════════
  -- CONNECTION TRANSFERS / NOC
  -- ═══════════════════════════════════════════════
  CREATE TABLE IF NOT EXISTS connection_transfers (
    id              TEXT PRIMARY KEY,
    app_number      TEXT UNIQUE NOT NULL,   -- e.g. CT-2026-00050
    connection_id   TEXT REFERENCES connections(id),
    transfer_type   TEXT NOT NULL DEFAULT 'transfer'
                      CHECK(transfer_type IN ('transfer','noc')),
    current_owner   TEXT NOT NULL,
    new_owner_name  TEXT NOT NULL,
    new_owner_phone TEXT NOT NULL,
    new_owner_email TEXT,
    sale_deed_url   TEXT,
    id_proof_url    TEXT,
    status          TEXT NOT NULL DEFAULT 'submitted'
                      CHECK(status IN ('submitted','under_review','approved',
                                       'rejected','completed')),
    dues_cleared    INTEGER DEFAULT 0,
    remarks         TEXT,
    created_at      TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
  );

  -- ═══════════════════════════════════════════════
  -- WARD SUPPLY SCHEDULES
  -- ═══════════════════════════════════════════════
  CREATE TABLE IF NOT EXISTS ward_schedules (
    id              TEXT PRIMARY KEY,
    ward_range      TEXT NOT NULL,          -- e.g. "1–5"
    locality        TEXT NOT NULL,          -- e.g. "Dispur"
    morning_start   TEXT,                   -- "06:00"
    morning_end     TEXT,                   -- "10:00"
    evening_start   TEXT,
    evening_end     TEXT,
    flow_rate_lph   INTEGER,                -- litres per hour
    status          TEXT NOT NULL DEFAULT 'active'
                      CHECK(status IN ('active','disrupted','scheduled','maintenance')),
    disruption_note TEXT,
    alternate_supply TEXT,                  -- e.g. "Tanker"
    schedule_date   TEXT NOT NULL DEFAULT (date('now')),
    updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
  );

  -- ═══════════════════════════════════════════════
  -- WATER QUALITY READINGS
  -- ═══════════════════════════════════════════════
  CREATE TABLE IF NOT EXISTS quality_readings (
    id              TEXT PRIMARY KEY,
    zone            TEXT NOT NULL DEFAULT 'City-Wide',
    ph_level        REAL,
    turbidity_ntu   REAL,
    chlorine_mgl    REAL,
    hardness_mgl    REAL,
    tds_mgl         REAL,
    coliform        TEXT DEFAULT 'Absent',
    overall_grade   TEXT DEFAULT 'A+'
                      CHECK(overall_grade IN ('A+','A','B','C','D','Fail')),
    test_date       TEXT NOT NULL DEFAULT (date('now')),
    lab_name        TEXT DEFAULT 'GMC Water Testing Laboratory',
    report_url      TEXT,
    created_at      TEXT NOT NULL DEFAULT (datetime('now'))
  );

  -- ═══════════════════════════════════════════════
  -- NOTICES / ALERTS
  -- ═══════════════════════════════════════════════
  CREATE TABLE IF NOT EXISTS notices (
    id              TEXT PRIMARY KEY,
    title           TEXT NOT NULL,
    body            TEXT,
    tag             TEXT NOT NULL DEFAULT 'Notice'
                      CHECK(tag IN ('Alert','Notice','Order','Tender','Update')),
    tag_color       TEXT NOT NULL DEFAULT 'green'
                      CHECK(tag_color IN ('red','green','amber','blue')),
    department      TEXT DEFAULT 'Water Supply Dept., GMC',
    is_active       INTEGER DEFAULT 1,
    is_pinned       INTEGER DEFAULT 0,
    published_date  TEXT DEFAULT (date('now')),
    expiry_date     TEXT,
    attachment_url  TEXT,
    created_by      TEXT REFERENCES users(id),
    created_at      TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
  );

  -- ═══════════════════════════════════════════════
  -- SITE STATS  (hero counters)
  -- ═══════════════════════════════════════════════
  CREATE TABLE IF NOT EXISTS site_stats (
    key             TEXT PRIMARY KEY,
    value           TEXT NOT NULL,
    updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
  );

  -- ═══════════════════════════════════════════════
  -- SEARCH LOGS  (analytics)
  -- ═══════════════════════════════════════════════
  CREATE TABLE IF NOT EXISTS search_logs (
    id              TEXT PRIMARY KEY,
    query           TEXT NOT NULL,
    results_count   INTEGER DEFAULT 0,
    ip              TEXT,
    created_at      TEXT NOT NULL DEFAULT (datetime('now'))
  );

  -- ═══════════════════════════════════════════════
  -- INDEXES
  -- ═══════════════════════════════════════════════
  CREATE INDEX IF NOT EXISTS idx_connections_user     ON connections(user_id);
  CREATE INDEX IF NOT EXISTS idx_connections_status   ON connections(status);
  CREATE INDEX IF NOT EXISTS idx_connections_ward     ON connections(ward_number);
  CREATE INDEX IF NOT EXISTS idx_bills_user           ON bills(user_id);
  CREATE INDEX IF NOT EXISTS idx_bills_status         ON bills(status);
  CREATE INDEX IF NOT EXISTS idx_bills_connection     ON bills(connection_id);
  CREATE INDEX IF NOT EXISTS idx_leakage_ward         ON leakage_complaints(ward_number, status);
  CREATE INDEX IF NOT EXISTS idx_leakage_ticket       ON leakage_complaints(ticket_id);
  CREATE INDEX IF NOT EXISTS idx_tanker_status        ON tanker_requests(status);
  CREATE INDEX IF NOT EXISTS idx_notices_active       ON notices(is_active, published_date DESC);
  CREATE INDEX IF NOT EXISTS idx_schedules_date       ON ward_schedules(schedule_date);
  CREATE INDEX IF NOT EXISTS idx_quality_date         ON quality_readings(test_date DESC);
  CREATE INDEX IF NOT EXISTS idx_meter_readings_conn  ON meter_readings(connection_id, reading_month);
`);

console.log('✅ All database tables and indexes created successfully.');
db.close();
