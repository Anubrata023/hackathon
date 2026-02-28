"""
db.py — SQLite data layer for GMC Portal.

Single connection-per-request strategy (thread-safe via check_same_thread=False
since we're single-threaded stdlib HTTPServer).
"""
import sqlite3
import os
import config

_conn: sqlite3.Connection = None


def get_conn() -> sqlite3.Connection:
    global _conn
    if _conn is None:
        _conn = sqlite3.connect(
            config.DB_PATH,
            check_same_thread=False,
            detect_types=sqlite3.PARSE_DECLTYPES | sqlite3.PARSE_COLNAMES,
        )
        _conn.row_factory = sqlite3.Row
        _conn.execute("PRAGMA journal_mode=WAL")
        _conn.execute("PRAGMA foreign_keys=ON")
    return _conn


def q(sql, params=(), one=False):
    """Execute a SELECT and return Row(s)."""
    cur = get_conn().execute(sql, params)
    if one:
        row = cur.fetchone()
        return dict(row) if row else None
    return [dict(r) for r in cur.fetchall()]


def run(sql, params=()):
    """Execute INSERT / UPDATE / DELETE, return lastrowid."""
    conn = get_conn()
    cur  = conn.execute(sql, params)
    conn.commit()
    return cur.lastrowid


SCHEMA = """
-- ── Citizens ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS citizens (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    mobile      TEXT NOT NULL UNIQUE,
    name        TEXT NOT NULL,
    email       TEXT,
    aadhaar_ref TEXT,                    -- last 4 digits only (privacy)
    ward        INTEGER,
    address     TEXT,
    password_hash TEXT NOT NULL,
    created_at  TEXT DEFAULT (datetime('now')),
    updated_at  TEXT DEFAULT (datetime('now'))
);

-- ── Services catalogue ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS services (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    slug        TEXT NOT NULL UNIQUE,
    title       TEXT NOT NULL,
    description TEXT,
    category    TEXT NOT NULL,
    badge       TEXT,
    badge_type  TEXT,
    active      INTEGER DEFAULT 1
);

-- ── Complaints / Jan Sunwai ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS complaints (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    citizen_id      INTEGER REFERENCES citizens(id),
    category        TEXT NOT NULL,
    subject         TEXT NOT NULL,
    description     TEXT NOT NULL,
    ward            INTEGER NOT NULL,
    status          TEXT DEFAULT 'pending',   -- pending | open | resolved | escalated | closed
    priority        TEXT DEFAULT 'normal',
    officer_id      INTEGER,
    hearing_date    TEXT,
    resolution_note TEXT,
    created_at      TEXT DEFAULT (datetime('now')),
    updated_at      TEXT DEFAULT (datetime('now')),
    resolved_at     TEXT
);

-- ── Water connections ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS water_connections (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    citizen_id      INTEGER REFERENCES citizens(id),
    connection_type TEXT NOT NULL,           -- new | transfer | disconnection
    address         TEXT NOT NULL,
    ward            INTEGER NOT NULL,
    pipe_size       TEXT,
    status          TEXT DEFAULT 'pending',  -- pending | approved | rejected | active
    ref_no          TEXT UNIQUE,
    applied_at      TEXT DEFAULT (datetime('now')),
    approved_at     TEXT
);

CREATE TABLE IF NOT EXISTS water_leakages (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    citizen_id  INTEGER REFERENCES citizens(id),
    ward        INTEGER NOT NULL,
    location    TEXT NOT NULL,
    severity    TEXT DEFAULT 'medium',
    status      TEXT DEFAULT 'reported',
    reported_at TEXT DEFAULT (datetime('now')),
    resolved_at TEXT
);

CREATE TABLE IF NOT EXISTS water_quality (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    ward        INTEGER NOT NULL,
    tested_at   TEXT NOT NULL,
    ph          REAL,
    turbidity   REAL,
    coliform    TEXT,
    result      TEXT DEFAULT 'pass',
    cert_no     TEXT UNIQUE
);

-- ── Garbage ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS garbage_reports (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    citizen_id  INTEGER REFERENCES citizens(id),
    ward        INTEGER NOT NULL,
    address     TEXT NOT NULL,
    type        TEXT DEFAULT 'missed_pickup',  -- missed_pickup | illegal_dumping | overflow
    status      TEXT DEFAULT 'reported',
    reported_at TEXT DEFAULT (datetime('now')),
    resolved_at TEXT
);

CREATE TABLE IF NOT EXISTS bulk_pickup_requests (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    citizen_id      INTEGER REFERENCES citizens(id),
    ward            INTEGER NOT NULL,
    address         TEXT NOT NULL,
    scheduled_date  TEXT NOT NULL,
    waste_type      TEXT,
    weight_estimate TEXT,
    status          TEXT DEFAULT 'scheduled',
    created_at      TEXT DEFAULT (datetime('now'))
);

-- ── Property Tax ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS properties (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    citizen_id      INTEGER REFERENCES citizens(id),
    property_uid    TEXT UNIQUE NOT NULL,
    address         TEXT NOT NULL,
    ward            INTEGER NOT NULL,
    area_sqft       REAL NOT NULL,
    usage_type      TEXT DEFAULT 'residential',  -- residential | commercial | industrial
    annual_value    REAL NOT NULL,
    created_at      TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS tax_payments (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    property_id INTEGER REFERENCES properties(id),
    citizen_id  INTEGER REFERENCES citizens(id),
    financial_year TEXT NOT NULL,
    amount_due  REAL NOT NULL,
    rebate_pct  REAL DEFAULT 0,
    amount_paid REAL,
    payment_ref TEXT UNIQUE,
    payment_mode TEXT,                     -- upi | netbanking | card | cash
    status      TEXT DEFAULT 'pending',   -- pending | paid | failed
    paid_at     TEXT,
    receipt_no  TEXT UNIQUE,
    created_at  TEXT DEFAULT (datetime('now'))
);

-- ── Trade Licence ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS trade_licences (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    citizen_id      INTEGER REFERENCES citizens(id),
    business_name   TEXT NOT NULL,
    business_type   TEXT NOT NULL,
    address         TEXT NOT NULL,
    ward            INTEGER NOT NULL,
    licence_no      TEXT UNIQUE,
    issue_date      TEXT,
    expiry_date     TEXT,
    status          TEXT DEFAULT 'applied',  -- applied | approved | rejected | expired
    applied_at      TEXT DEFAULT (datetime('now')),
    renewed_at      TEXT
);

-- ── Certificates ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS certificate_requests (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    citizen_id      INTEGER REFERENCES citizens(id),
    cert_type       TEXT NOT NULL,          -- birth | death
    person_name     TEXT NOT NULL,
    dob             TEXT,
    dod             TEXT,
    hospital        TEXT,
    ward            INTEGER NOT NULL,
    status          TEXT DEFAULT 'processing', -- processing | issued | rejected
    cert_no         TEXT UNIQUE,
    issued_at       TEXT,
    digital_hash    TEXT,                    -- simulated tamper-proof hash
    applied_at      TEXT DEFAULT (datetime('now'))
);

-- ── Building Plans ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS building_plans (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    citizen_id      INTEGER REFERENCES citizens(id),
    plot_no         TEXT NOT NULL,
    ward            INTEGER NOT NULL,
    address         TEXT NOT NULL,
    floors          INTEGER DEFAULT 1,
    total_area_sqft REAL,
    usage           TEXT DEFAULT 'residential',
    architect_name  TEXT,
    plan_file_ref   TEXT,
    status          TEXT DEFAULT 'submitted', -- submitted | under_review | approved | rejected
    sanction_no     TEXT UNIQUE,
    submitted_at    TEXT DEFAULT (datetime('now')),
    reviewed_at     TEXT
);

-- ── RTI ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS rti_requests (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    citizen_id      INTEGER REFERENCES citizens(id),
    department      TEXT NOT NULL,
    subject         TEXT NOT NULL,
    description     TEXT NOT NULL,
    fee_paid        REAL DEFAULT 10.0,
    payment_ref     TEXT,
    status          TEXT DEFAULT 'filed',   -- filed | processing | responded | rejected
    due_date        TEXT,
    response_text   TEXT,
    filed_at        TEXT DEFAULT (datetime('now')),
    responded_at    TEXT
);

-- ── AI Document Verification ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS document_verifications (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    citizen_id      INTEGER,
    filename        TEXT,
    doc_type        TEXT,                   -- property | trade_licence | building_plan | birth | death
    file_hash       TEXT NOT NULL,
    verification_status TEXT DEFAULT 'verified', -- verified | rejected | pending
    confidence_pct  INTEGER,
    ai_notes        TEXT,
    digital_stamp   TEXT,
    verified_at     TEXT DEFAULT (datetime('now'))
);

-- ── Notices ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notices (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    tag         TEXT NOT NULL,              -- alert | notice | order | tender | update
    title       TEXT NOT NULL,
    body        TEXT,
    department  TEXT,
    published_at TEXT DEFAULT (datetime('now')),
    valid_until TEXT,
    active      INTEGER DEFAULT 1
);

-- ── Payments ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payments (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    citizen_id  INTEGER,
    ref         TEXT UNIQUE NOT NULL,
    purpose     TEXT NOT NULL,             -- tax | rti | trade_licence | building_plan
    amount      REAL NOT NULL,
    mode        TEXT,                      -- upi | netbanking | card
    status      TEXT DEFAULT 'pending',   -- pending | success | failed
    gateway_ref TEXT,
    initiated_at TEXT DEFAULT (datetime('now')),
    completed_at TEXT
);
"""


def init_db():
    conn = get_conn()
    conn.executescript(SCHEMA)
    conn.commit()
    _seed_data()
    print("[DB] Initialized:", config.DB_PATH)


def _seed_data():
    """Insert demo data if tables are empty."""
    import hashlib, secrets
    from datetime import datetime, timedelta

    conn = get_conn()

    # Services catalogue
    if not q("SELECT 1 FROM services LIMIT 1"):
        services = [
            ("jan-sunwai",      "Digital Jan Sunwai",       "File grievances through live digital hearings with your ward officer.",  "Grievances",     "Live",    "badge-live"),
            ("water-supply",    "Water Supply",             "Apply for new connections, report leakages, track pipe repairs.",         "Water",          "Online",  "badge-req"),
            ("garbage",         "Garbage & Sanitation",     "Report missed pickups, schedule bulk waste, track cleanliness scores.",  "Sanitation",     "Online",  "badge-req"),
            ("ai-doc-verify",   "AI Document Verification", "Upload property papers — AI cross-checks authenticity instantly.",       "Documents",      "AI",      "badge-ai"),
            ("property-tax",    "Property Tax Payment",     "Calculate dues, pay via UPI or net banking, download receipts.",         "Taxation",       "Rebate",  "badge-new"),
            ("trade-licence",   "Trade Licence",            "Apply for new trade licences, renew existing ones.",                     "Licensing",      "Online",  "badge-req"),
            ("certificates",    "Birth & Death Certificate","Download digitally-signed certificates. Apply for corrections online.",  "Documents",      "Instant", "badge-new"),
            ("building-plan",   "Building Plan Approval",   "Submit building plans digitally for municipal approval.",               "Infrastructure", "Online",  "badge-req"),
            ("rti",             "RTI Portal",               "File Right to Information requests online. Track responses.",           "Governance",     "30 Days", "badge-live"),
        ]
        for s in services:
            run("INSERT OR IGNORE INTO services(slug,title,description,category,badge,badge_type) VALUES(?,?,?,?,?,?)", s)

    # Notices
    if not q("SELECT 1 FROM notices LIMIT 1"):
        now = datetime.now()
        notices_data = [
            ("alert",  "Water supply disruption in Wards 14–18",           "Maintenance work 2–3 March 2026. Alternate supply arrangements made.", "Water Supply Dept.", (now - timedelta(days=1)).isoformat()),
            ("notice", "Digital Jan Sunwai — March 2026 hearing calendar", "Ward-wise hearing calendar published for March 2026.",                 "Public Grievance Cell", (now - timedelta(days=2)).isoformat()),
            ("order",  "Property Tax FY 2025–26: 10% rebate extended",     "Early-bird rebate deadline extended to 31 March 2026.",                "Revenue Department",  (now - timedelta(days=3)).isoformat()),
            ("tender", "e-NIT for Solid Waste Management Vehicles",         "Bid deadline: 15 March 2026. Download NIT from portal.",              "Engineering Cell",    (now - timedelta(days=4)).isoformat()),
            ("update", "AI Verification now supports Trade Licence docs",   "Trade Licence and Building Plan certificates now verifiable via AI.", "IT Department",       (now - timedelta(days=6)).isoformat()),
        ]
        for n in notices_data:
            run("INSERT INTO notices(tag,title,body,department,published_at) VALUES(?,?,?,?,?)", n)

    # Water quality data for some wards
    if not q("SELECT 1 FROM water_quality LIMIT 1"):
        from datetime import date
        for ward in [1, 2, 3, 14, 15, 25, 30]:
            run("""INSERT OR IGNORE INTO water_quality(ward,tested_at,ph,turbidity,coliform,result,cert_no)
                   VALUES(?,?,?,?,?,?,?)""",
                (ward, str(date.today()), round(6.8 + ward*0.02, 2),
                 round(0.5 + ward*0.01, 2), "nil", "pass",
                 f"WQ-2026-{ward:03d}"))

    # Demo citizen (mobile: 9876543210, password: Demo@1234)
    if not q("SELECT 1 FROM citizens WHERE mobile=?", ("9876543210",)):
        pw_hash = hashlib.sha256("Demo@1234".encode()).hexdigest()
        run("""INSERT INTO citizens(mobile,name,email,ward,address,password_hash)
               VALUES(?,?,?,?,?,?)""",
            ("9876543210", "Rajiv Sharma", "rajiv@example.com", 5,
             "12 Lachit Nagar, Guwahati", pw_hash))
        cid = q("SELECT id FROM citizens WHERE mobile=?", ("9876543210",), one=True)["id"]

        # Demo property
        run("""INSERT OR IGNORE INTO properties(citizen_id,property_uid,address,ward,area_sqft,usage_type,annual_value)
               VALUES(?,?,?,?,?,?,?)""",
            (cid, "GMC-PROP-000001", "12 Lachit Nagar", 5, 1200, "residential", 84000))
