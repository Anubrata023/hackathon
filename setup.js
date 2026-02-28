// src/db/setup.js
// Run once to create all tables

require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbDir = path.dirname(process.env.DB_PATH || './db/assam_portal.db');
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

const db = new Database(path.resolve(process.env.DB_PATH || './db/assam_portal.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  -- ─── USERS ───
  CREATE TABLE IF NOT EXISTS users (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    email       TEXT UNIQUE NOT NULL,
    phone       TEXT UNIQUE,
    password    TEXT NOT NULL,
    role        TEXT NOT NULL DEFAULT 'citizen' CHECK(role IN ('citizen','admin','officer')),
    is_active   INTEGER NOT NULL DEFAULT 1,
    created_at  TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
  );

  -- ─── SERVICES ───
  CREATE TABLE IF NOT EXISTS services (
    id          TEXT PRIMARY KEY,
    category    TEXT NOT NULL,
    title_en    TEXT NOT NULL,
    title_hi    TEXT,
    title_bn    TEXT,
    title_as    TEXT,
    desc_en     TEXT,
    desc_hi     TEXT,
    desc_bn     TEXT,
    desc_as     TEXT,
    icon        TEXT,
    url         TEXT,
    is_active   INTEGER NOT NULL DEFAULT 1,
    sort_order  INTEGER DEFAULT 0,
    created_at  TEXT NOT NULL DEFAULT (datetime('now'))
  );

  -- ─── NOTICES ───
  CREATE TABLE IF NOT EXISTS notices (
    id          TEXT PRIMARY KEY,
    title_en    TEXT NOT NULL,
    title_hi    TEXT,
    title_bn    TEXT,
    title_as    TEXT,
    content_en  TEXT,
    content_hi  TEXT,
    content_bn  TEXT,
    content_as  TEXT,
    category    TEXT NOT NULL DEFAULT 'general'
                  CHECK(category IN ('general','tender','recruitment','circular','order','gazette')),
    department  TEXT,
    file_url    TEXT,
    is_active   INTEGER NOT NULL DEFAULT 1,
    is_pinned   INTEGER NOT NULL DEFAULT 0,
    published_at TEXT NOT NULL DEFAULT (datetime('now')),
    expires_at  TEXT,
    created_by  TEXT REFERENCES users(id),
    created_at  TEXT NOT NULL DEFAULT (datetime('now'))
  );

  -- ─── DEPARTMENTS ───
  CREATE TABLE IF NOT EXISTS departments (
    id          TEXT PRIMARY KEY,
    name_en     TEXT NOT NULL,
    name_hi     TEXT,
    name_bn     TEXT,
    name_as     TEXT,
    icon        TEXT,
    url         TEXT,
    description TEXT,
    minister    TEXT,
    is_active   INTEGER NOT NULL DEFAULT 1,
    sort_order  INTEGER DEFAULT 0,
    created_at  TEXT NOT NULL DEFAULT (datetime('now'))
  );

  -- ─── CONTACT FORM SUBMISSIONS ───
  CREATE TABLE IF NOT EXISTS contact_submissions (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    email       TEXT NOT NULL,
    phone       TEXT,
    subject     TEXT NOT NULL,
    message     TEXT NOT NULL,
    department  TEXT,
    status      TEXT NOT NULL DEFAULT 'pending'
                  CHECK(status IN ('pending','in_progress','resolved','closed')),
    assigned_to TEXT REFERENCES users(id),
    resolved_at TEXT,
    created_at  TEXT NOT NULL DEFAULT (datetime('now'))
  );

  -- ─── GRIEVANCES ───
  CREATE TABLE IF NOT EXISTS grievances (
    id            TEXT PRIMARY KEY,
    ticket_id     TEXT UNIQUE NOT NULL,
    citizen_name  TEXT NOT NULL,
    citizen_email TEXT NOT NULL,
    citizen_phone TEXT,
    category      TEXT NOT NULL,
    department    TEXT NOT NULL,
    subject       TEXT NOT NULL,
    description   TEXT NOT NULL,
    file_url      TEXT,
    status        TEXT NOT NULL DEFAULT 'submitted'
                    CHECK(status IN ('submitted','under_review','in_progress','resolved','rejected')),
    priority      TEXT NOT NULL DEFAULT 'normal'
                    CHECK(priority IN ('low','normal','high','urgent')),
    assigned_to   TEXT REFERENCES users(id),
    remarks       TEXT,
    resolved_at   TEXT,
    created_at    TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
  );

  -- ─── SERVICE APPLICATIONS ───
  CREATE TABLE IF NOT EXISTS service_applications (
    id            TEXT PRIMARY KEY,
    app_number    TEXT UNIQUE NOT NULL,
    service_id    TEXT REFERENCES services(id),
    applicant_id  TEXT REFERENCES users(id),
    applicant_name TEXT NOT NULL,
    applicant_email TEXT NOT NULL,
    applicant_phone TEXT,
    form_data     TEXT,
    file_urls     TEXT,
    status        TEXT NOT NULL DEFAULT 'submitted'
                    CHECK(status IN ('submitted','under_review','approved','rejected','pending_docs')),
    remarks       TEXT,
    processed_by  TEXT REFERENCES users(id),
    processed_at  TEXT,
    created_at    TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
  );

  -- ─── SEARCH LOGS ───
  CREATE TABLE IF NOT EXISTS search_logs (
    id          TEXT PRIMARY KEY,
    query       TEXT NOT NULL,
    results     INTEGER DEFAULT 0,
    ip          TEXT,
    lang        TEXT DEFAULT 'en',
    created_at  TEXT NOT NULL DEFAULT (datetime('now'))
  );

  -- ─── QUICK LINKS ───
  CREATE TABLE IF NOT EXISTS quick_links (
    id          TEXT PRIMARY KEY,
    title_en    TEXT NOT NULL,
    title_hi    TEXT,
    title_bn    TEXT,
    title_as    TEXT,
    url         TEXT NOT NULL,
    icon        TEXT,
    category    TEXT DEFAULT 'general',
    is_active   INTEGER NOT NULL DEFAULT 1,
    sort_order  INTEGER DEFAULT 0,
    created_at  TEXT NOT NULL DEFAULT (datetime('now'))
  );

  -- ─── SITE STATS ───
  CREATE TABLE IF NOT EXISTS site_stats (
    key         TEXT PRIMARY KEY,
    value       TEXT NOT NULL,
    updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
  );

  -- ─── INDEXES ───
  CREATE INDEX IF NOT EXISTS idx_notices_active    ON notices(is_active, published_at DESC);
  CREATE INDEX IF NOT EXISTS idx_notices_category  ON notices(category);
  CREATE INDEX IF NOT EXISTS idx_services_category ON services(category, is_active);
  CREATE INDEX IF NOT EXISTS idx_grievances_ticket ON grievances(ticket_id);
  CREATE INDEX IF NOT EXISTS idx_grievances_email  ON grievances(citizen_email);
  CREATE INDEX IF NOT EXISTS idx_apps_number       ON service_applications(app_number);
  CREATE INDEX IF NOT EXISTS idx_search_logs_query ON search_logs(query);
`);

console.log('✅ Database tables created successfully.');
db.close();
