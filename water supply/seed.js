// src/db/seed.js — Seeds realistic initial data
// Usage: npm run seed

require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const Database = require('better-sqlite3');
const bcrypt   = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const path     = require('path');
const fs       = require('fs');

const dbPath = path.resolve(process.env.DB_PATH || './db/water_portal.db');
if (!fs.existsSync(path.dirname(dbPath))) {
  console.error('❌ Run "npm run setup" first to create the database.');
  process.exit(1);
}

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');
console.log('🌱 Seeding database...\n');

// ─── USERS ────────────────────────────────────────────────────────────────────
const adminEmail = process.env.ADMIN_EMAIL || 'admin@gmc.assam.gov.in';
const adminPass  = process.env.ADMIN_PASSWORD || 'Admin@Water2026!';
const adminExists = db.prepare('SELECT id FROM users WHERE email = ?').get(adminEmail);

if (!adminExists) {
  const hash = bcrypt.hashSync(adminPass, 12);
  db.prepare(`INSERT INTO users (id,name,email,phone,password,role) VALUES (?,?,?,?,?,?)`)
    .run(uuidv4(), 'Portal Administrator', adminEmail, '+91-9999900001', hash, 'admin');
  console.log(`  ✅ Admin created: ${adminEmail} / ${adminPass}`);
}

// Seed a test officer
const officerEmail = 'officer@gmc.assam.gov.in';
const officerExists = db.prepare('SELECT id FROM users WHERE email = ?').get(officerEmail);
if (!officerExists) {
  const hash = bcrypt.hashSync('Officer@123', 12);
  db.prepare(`INSERT INTO users (id,name,email,phone,password,role,ward_number) VALUES (?,?,?,?,?,?,?)`)
    .run(uuidv4(), 'Ward Officer - Central Zone', officerEmail, '+91-9999900002', hash, 'officer', 1);
  console.log(`  ✅ Officer created: ${officerEmail} / Officer@123`);
}

// Seed a test citizen
const citizenEmail = 'citizen@example.com';
const citizenExists = db.prepare('SELECT id FROM users WHERE email = ?').get(citizenEmail);
let citizenId = citizenExists?.id;
if (!citizenExists) {
  citizenId = uuidv4();
  const hash = bcrypt.hashSync('Citizen@123', 12);
  db.prepare(`INSERT INTO users (id,name,email,phone,password,role,ward_number,address) VALUES (?,?,?,?,?,?,?,?)`)
    .run(citizenId, 'Rahul Sharma', citizenEmail, '+91-9876543210', hash, 'citizen', 5, 'House No. 12, Dispur, Guwahati - 781006');
  console.log(`  ✅ Citizen created: ${citizenEmail} / Citizen@123`);
}

// ─── WARD SCHEDULES ───────────────────────────────────────────────────────────
const schedCount = db.prepare('SELECT COUNT(*) AS c FROM ward_schedules').get();
if (schedCount.c === 0) {
  const schedules = [
    { ward_range: '1–5',   locality: 'Dispur',         morning_start: '06:00', morning_end: '10:00', evening_start: '17:00', evening_end: '20:00', flow_rate_lph: 750,  status: 'active',      disruption_note: null,                                          alternate_supply: null    },
    { ward_range: '6–10',  locality: 'Bharalumukh',    morning_start: '07:00', morning_end: '11:00', evening_start: '18:00', evening_end: '21:00', flow_rate_lph: 680,  status: 'active',      disruption_note: null,                                          alternate_supply: null    },
    { ward_range: '11–13', locality: 'Paltan Bazaar',  morning_start: '05:30', morning_end: '09:30', evening_start: null,    evening_end: null,    flow_rate_lph: 720,  status: 'scheduled',   disruption_note: null,                                          alternate_supply: null    },
    { ward_range: '14–18', locality: 'Chandmari',      morning_start: null,    morning_end: null,    evening_start: null,    evening_end: null,    flow_rate_lph: null, status: 'disrupted',   disruption_note: 'Pipe maintenance — 2 to 4 March 2026.',      alternate_supply: 'Tanker' },
    { ward_range: '19–25', locality: 'Guwahati Club',  morning_start: '06:00', morning_end: '10:00', evening_start: '16:00', evening_end: '19:00', flow_rate_lph: 810,  status: 'active',      disruption_note: null,                                          alternate_supply: null    },
    { ward_range: '26–30', locality: 'Narengi',        morning_start: '08:00', morning_end: '12:00', evening_start: null,    evening_end: null,    flow_rate_lph: 560,  status: 'scheduled',   disruption_note: null,                                          alternate_supply: null    },
    { ward_range: '31–40', locality: 'Beltola',        morning_start: '06:00', morning_end: '09:00', evening_start: '17:00', evening_end: '19:30', flow_rate_lph: 700,  status: 'active',      disruption_note: null,                                          alternate_supply: null    },
    { ward_range: '41–50', locality: 'Zoo Road',       morning_start: '06:30', morning_end: '10:30', evening_start: '17:30', evening_end: '20:30', flow_rate_lph: 660,  status: 'active',      disruption_note: null,                                          alternate_supply: null    },
    { ward_range: '51–57', locality: 'Khanapara',      morning_start: '07:00', morning_end: '11:00', evening_start: '18:00', evening_end: '21:00', flow_rate_lph: 620,  status: 'active',      disruption_note: null,                                          alternate_supply: null    },
  ];
  const ins = db.prepare(`INSERT INTO ward_schedules (id,ward_range,locality,morning_start,morning_end,evening_start,evening_end,flow_rate_lph,status,disruption_note,alternate_supply) VALUES (?,?,?,?,?,?,?,?,?,?,?)`);
  for (const s of schedules) ins.run(uuidv4(), s.ward_range, s.locality, s.morning_start, s.morning_end, s.evening_start, s.evening_end, s.flow_rate_lph, s.status, s.disruption_note, s.alternate_supply);
  console.log(`  ✅ ${schedules.length} ward schedules seeded`);
}

// ─── WATER QUALITY ────────────────────────────────────────────────────────────
const qCount = db.prepare('SELECT COUNT(*) AS c FROM quality_readings').get();
if (qCount.c === 0) {
  db.prepare(`INSERT INTO quality_readings (id,zone,ph_level,turbidity_ntu,chlorine_mgl,hardness_mgl,tds_mgl,coliform,overall_grade,test_date) VALUES (?,?,?,?,?,?,?,?,?,?)`)
    .run(uuidv4(), 'City-Wide', 7.4, 0.8, 0.4, 145, 210, 'Absent', 'A+', '2026-02-28');
  db.prepare(`INSERT INTO quality_readings (id,zone,ph_level,turbidity_ntu,chlorine_mgl,hardness_mgl,tds_mgl,coliform,overall_grade,test_date) VALUES (?,?,?,?,?,?,?,?,?,?)`)
    .run(uuidv4(), 'Chandmari Zone', 7.2, 1.1, 0.35, 155, 225, 'Absent', 'A', '2026-02-28');
  console.log('  ✅ Water quality readings seeded');
}

// ─── NOTICES ─────────────────────────────────────────────────────────────────
const nCount = db.prepare('SELECT COUNT(*) AS c FROM notices').get();
if (nCount.c === 0) {
  const notices = [
    { title: 'Water supply disruption in Wards 14–18 due to pipe maintenance — 2 to 4 March 2026. Tanker service deployed.', tag: 'Alert',  tag_color: 'red',   department: 'Water Supply Dept., GMC',        published_date: '2026-02-27', is_pinned: 1 },
    { title: 'New online self-meter-reading portal launched — submit readings monthly to ensure accurate billing from April 2026.', tag: 'Notice', tag_color: 'green', department: 'Revenue Cell, Water Dept.',      published_date: '2026-02-26', is_pinned: 0 },
    { title: 'Water bill arrears waiver scheme extended to 31 March 2026 — residential connections with dues up to ₹5,000 eligible.', tag: 'Order',  tag_color: 'amber', department: 'Finance Department, GMC',        published_date: '2026-02-24', is_pinned: 1 },
    { title: 'e-NIT for water distribution pipeline expansion in Wards 41–57 — bid deadline: 20 March 2026.', tag: 'Tender', tag_color: 'blue',  department: 'Engineering Cell, GMC',          published_date: '2026-02-22', is_pinned: 0 },
    { title: 'Ward 19–30 Borewell re-charging work completed. Supply pressure restored to normal levels.', tag: 'Update', tag_color: 'green', department: 'Water Supply Dept., GMC',        published_date: '2026-02-20', is_pinned: 0 },
    { title: 'Annual water audit report 2025-26 published. Download from the Quality Reports section.', tag: 'Notice', tag_color: 'blue',  department: 'Quality Control Cell, GMC',      published_date: '2026-02-15', is_pinned: 0 },
    { title: 'Jal Jeevan Mission: 12,000 new household connections sanctioned for FY 2026-27.', tag: 'Notice', tag_color: 'green', department: 'Water Supply Dept., GMC',        published_date: '2026-02-10', is_pinned: 0 },
  ];
  const ins = db.prepare(`INSERT INTO notices (id,title,tag,tag_color,department,published_date,is_pinned,is_active) VALUES (?,?,?,?,?,?,?,1)`);
  for (const n of notices) ins.run(uuidv4(), n.title, n.tag, n.tag_color, n.department, n.published_date, n.is_pinned);
  console.log(`  ✅ ${notices.length} notices seeded`);
}

// ─── SAMPLE CONNECTION (for test citizen) ────────────────────────────────────
const connCount = db.prepare('SELECT COUNT(*) AS c FROM connections').get();
if (connCount.c === 0 && citizenId) {
  const connId = uuidv4();
  db.prepare(`INSERT INTO connections (id,app_number,user_id,applicant_name,applicant_email,applicant_phone,connection_type,property_address,ward_number,status,meter_number,connection_date) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`)
    .run(connId, 'WC-2026-00001', citizenId, 'Rahul Sharma', citizenEmail, '+91-9876543210', 'domestic', 'House No. 12, Dispur, Guwahati - 781006', 5, 'connected', 'MTR-2026-0001', '2024-06-15');

  // Seed 3 bills for this connection
  const bills = [
    { num: 'WB-2026-02-00001', period: 'Feb 2026', prev: 1240, curr: 1318, due: '2026-03-15', status: 'unpaid'  },
    { num: 'WB-2026-01-00001', period: 'Jan 2026', prev: 1165, curr: 1240, due: '2026-02-15', status: 'paid',   paid_date: '2026-02-10', method: 'UPI', ref: 'UPI2026021012345' },
    { num: 'WB-2025-12-00001', period: 'Dec 2025', prev: 1090, curr: 1165, due: '2026-01-15', status: 'paid',   paid_date: '2026-01-08', method: 'Net Banking', ref: 'NB2026010800987' },
  ];
  const insB = db.prepare(`INSERT INTO bills (id,bill_number,connection_id,user_id,meter_number,billing_period,reading_prev,reading_curr,units_consumed,amount_basic,amount_tax,amount_total,due_date,status,payment_date,payment_method,payment_ref) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`);
  for (const b of bills) {
    const units = b.curr - b.prev;
    const basic = units * 8.5;
    const tax   = basic * 0.05;
    insB.run(uuidv4(), b.num, connId, citizenId, 'MTR-2026-0001', b.period, b.prev, b.curr, units, basic, tax, +(basic + tax).toFixed(2), b.due, b.status, b.paid_date||null, b.method||null, b.ref||null);
  }

  // Seed 1 sample leakage complaint
  db.prepare(`INSERT INTO leakage_complaints (id,ticket_id,reporter_name,reporter_phone,ward_number,location_address,severity,status,reported_at) VALUES (?,?,?,?,?,?,?,?,?)`)
    .run(uuidv4(), 'LK-2026-00001', 'Rahul Sharma', '+91-9876543210', 5, 'Near Dispur Post Office, GS Road', 'medium', 'resolved', '2026-02-10T09:30:00');

  console.log('  ✅ Sample connection, bills, and leakage complaint seeded');
}

// ─── SITE STATS ───────────────────────────────────────────────────────────────
const statsData = [
  { key: 'wards_served',        value: '57'  },
  { key: 'coverage_percent',    value: '98'  },
  { key: 'leak_response_hours', value: '24'  },
  { key: 'water_quality_grade', value: 'A+'  },
  { key: 'active_connections',  value: '1,24,500' },
  { key: 'daily_supply_mld',    value: '180' },
];
const insStat = db.prepare(`INSERT OR IGNORE INTO site_stats (key, value) VALUES (?, ?)`);
for (const s of statsData) insStat.run(s.key, s.value);
console.log('  ✅ Site stats seeded');

console.log('\n🎉 Seed complete!');
console.log('─────────────────────────────────');
console.log(`  Admin   : ${adminEmail}`);
console.log(`  Officer : officer@gmc.assam.gov.in / Officer@123`);
console.log(`  Citizen : citizen@example.com / Citizen@123`);
console.log('─────────────────────────────────\n');
db.close();
