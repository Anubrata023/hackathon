// src/db/seed.js
require('dotenv').config();
const { getDb } = require('./init');

function seed() {
  const db = getDb();

  console.log('🌱 Seeding APDCL database...');

  // ── Platform Stats ────────────────────────────
  const stats = [
    { stat_key: 'total_smart_meters', stat_value: '240000' },
    { stat_key: 'data_refresh_minutes', stat_value: '15' },
    { stat_key: 'uptime_percent', stat_value: '99.2' },
  ];
  const insertStat = db.prepare(`
    INSERT OR REPLACE INTO platform_stats (stat_key, stat_value) VALUES (?, ?)
  `);
  for (const s of stats) insertStat.run(s.stat_key, s.stat_value);

  // ── Tariff Slabs ──────────────────────────────
  db.prepare(`DELETE FROM tariff_slabs`).run();
  const insertSlab = db.prepare(`
    INSERT INTO tariff_slabs (connection_type, slab_label, units_from, units_to, rate_per_unit, effective_from)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  const slabs = [
    ['LT-B Domestic', '0–100 kWh',      0,   100, 3.60, '2024-04-01'],
    ['LT-B Domestic', '101–200 kWh',   101,   200, 4.80, '2024-04-01'],
    ['LT-B Domestic', '201–300 kWh',   201,   300, 6.05, '2024-04-01'],
    ['LT-B Domestic', 'Above 300 kWh', 301,  null, 7.25, '2024-04-01'],
  ];
  for (const s of slabs) insertSlab.run(...s);

  // ── Consumers ─────────────────────────────────
  db.prepare(`DELETE FROM consumers`).run();
  const insertConsumer = db.prepare(`
    INSERT OR IGNORE INTO consumers
      (consumer_id, name, avatar_letter, zone, division, connection_type, meter_no, address, mobile, email)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const consumers = [
    ['ASM-GHY-048271', 'Rajib Kumar Deka',  'R', 'Guwahati North', 'APDCL-GHY-D2', 'LT-B Domestic', 'SM-9847203-GHY', 'House No. 12, Sixmile, Guwahati - 781022', '9876543210', 'rajib.deka@example.com'],
    ['ASM-GHY-048300', 'Priya Sharma',       'P', 'Guwahati South', 'APDCL-GHY-D1', 'LT-B Domestic', 'SM-9847301-GHY', 'Flat 4B, Dispur, Guwahati - 781006',       '9876500001', 'priya.sharma@example.com'],
    ['ASM-GHY-048350', 'Anand Bhushan',      'A', 'Guwahati East',  'APDCL-GHY-D3', 'LT-B Domestic', 'SM-9847350-GHY', 'Noonmati Road, Guwahati - 781020',          '9876500002', 'anand.bhushan@example.com'],
  ];
  for (const c of consumers) insertConsumer.run(...c);

  // ── Monthly Consumption ───────────────────────
  db.prepare(`DELETE FROM monthly_consumption`).run();
  const insertMonth = db.prepare(`
    INSERT OR IGNORE INTO monthly_consumption
      (consumer_id, billing_period, units_kwh, amount_inr, energy_charges, fixed_charge, electricity_duty, meter_rental, arrears, late_payment_surcharge, due_date, paid_at, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const monthlyData = [
    ['ASM-GHY-048271', '2026-02', 284, 2348, 1976, 150, 106, 30, 0, 86,  '2026-03-05', null,           'pending'],
    ['ASM-GHY-048271', '2026-01', 263, 2148, 1862, 150,  98, 30, 0,  8,  '2026-02-05', '2026-02-03',   'paid'],
    ['ASM-GHY-048271', '2025-12', 301, 2498, 2083, 150, 125, 30, 0, 110, '2026-01-05', '2025-12-28',   'paid'],
    ['ASM-GHY-048271', '2025-11', 218, 1764, 1524, 150,  76, 30, 0, -16, '2025-12-05', '2025-11-25',   'paid'],
    ['ASM-GHY-048271', '2025-10', 204, 1628, 1414, 150,  64, 30, 0, -30, '2025-11-05', '2025-11-01',   'paid'],
    ['ASM-GHY-048271', '2025-09', 246, 1992, 1730, 150,  82, 30, 0,   0, '2025-10-05', '2025-10-03',   'paid'],
  ];
  for (const m of monthlyData) insertMonth.run(...m);

  // ── Daily Consumption (Feb 2026) ──────────────
  db.prepare(`DELETE FROM daily_consumption WHERE consumer_id = 'ASM-GHY-048271'`).run();
  const insertDay = db.prepare(`
    INSERT OR IGNORE INTO daily_consumption (consumer_id, date, units_kwh) VALUES (?, ?, ?)
  `);
  const dailyFeb = [
    ['2026-02-01', 8.2],  ['2026-02-02', 9.1],  ['2026-02-03', 9.4],
    ['2026-02-04', 10.0], ['2026-02-05', 10.1],  ['2026-02-06', 10.5],
    ['2026-02-07', 11.8], ['2026-02-08', 11.2],  ['2026-02-09', 9.7],
    ['2026-02-10', 10.3], ['2026-02-11', 12.3],  ['2026-02-12', 13.0],
    ['2026-02-13', 14.1], ['2026-02-14', 18.4],  ['2026-02-15', 9.2],
    ['2026-02-16', 9.5],  ['2026-02-17', 10.8],  ['2026-02-18', 11.0],
    ['2026-02-19', 11.2], ['2026-02-20', 10.7],  ['2026-02-21', 8.9],
    ['2026-02-22', 10.1], ['2026-02-23', 12.6],  ['2026-02-24', 13.1],
    ['2026-02-25', 14.3], ['2026-02-26', 13.9],  ['2026-02-27', 14.1],
    ['2026-02-28', 14.2],
  ];
  for (const [date, kwh] of dailyFeb) insertDay.run('ASM-GHY-048271', date, kwh);

  // Jan 2026 daily
  const dailyJan = [
    8.4, 9.0, 9.3, 8.8, 9.7, 10.2, 10.5, 9.8, 9.2, 8.7,
    9.1, 9.4, 9.9, 10.8, 10.3, 9.6, 8.9, 9.2, 8.4, 8.8,
    9.0, 9.3, 8.7, 8.2, 9.5, 8.6, 8.3, 8.1, 7.9, 8.0, 8.2
  ];
  dailyJan.forEach((v, i) => {
    const d = String(i + 1).padStart(2, '0');
    insertDay.run('ASM-GHY-048271', `2026-01-${d}`, v);
  });

  // ── Meter Readings (last 24 hours) ────────────
  db.prepare(`DELETE FROM meter_readings WHERE consumer_id = 'ASM-GHY-048271'`).run();
  const insertReading = db.prepare(`
    INSERT INTO meter_readings (consumer_id, reading_kwh, recorded_at) VALUES (?, ?, ?)
  `);
  let base = 398.6;
  for (let h = 0; h <= 23; h++) {
    const hr = String(h).padStart(2, '0');
    const inc = (h >= 6 && h <= 9) || (h >= 18 && h <= 21) ? 0.8 + Math.random() * 0.5 : 0.3 + Math.random() * 0.3;
    base += inc;
    insertReading.run('ASM-GHY-048271', parseFloat(base.toFixed(2)), `2026-02-28 ${hr}:00:00`);
  }

  // ── Alerts ────────────────────────────────────
  db.prepare(`DELETE FROM alerts`).run();
  const insertAlert = db.prepare(`
    INSERT INTO alerts (consumer_id, type, severity, title, message, alert_time, is_read)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  const alerts = [
    ['ASM-GHY-048271', 'high_consumption', 'red',   'High Consumption Alert',
      'Your usage today (14.2 kWh) is 40% above your daily average. This will push you into the ₹7.25/unit slab.',
      '2026-02-28 09:34:00', 0],
    ['ASM-GHY-048271', 'bill_due', 'amber', 'Bill Due Reminder',
      'Your February 2026 bill of ₹2,348 is due on 5 March 2026. Late payment surcharge of ₹86 has already been applied.',
      '2026-02-27 10:00:00', 0],
    ['ASM-GHY-048271', 'power_restored', 'green', 'Power Restored',
      'The planned outage for Guwahati North Zone (2:00 PM – 5:00 PM) has been restored ahead of schedule at 4:12 PM.',
      '2026-02-27 16:12:00', 1],
    ['ASM-GHY-048271', 'firmware', 'blue', 'Smart Meter Firmware Updated',
      'Your meter (SM-9847203-GHY) received a remote firmware update improving measurement accuracy.',
      '2026-02-25 11:05:00', 1],
    ['ASM-GHY-048271', 'anomaly', 'amber', 'Unusual Peak Detected',
      'A usage spike of 18.4 kWh was recorded on 14 Feb between 6:00–9:00 PM. Review your appliance usage if unexpected.',
      '2026-02-14 21:00:00', 1],
  ];
  for (const a of alerts) insertAlert.run(...a);

  console.log('✅ Database seeded successfully!');
  console.log('   Consumers  : 3');
  console.log('   Monthly    : 6 periods (ASM-GHY-048271)');
  console.log('   Daily      : 28 days Feb + 31 days Jan');
  console.log('   Alerts     : 5');
  console.log('   Tariff     : 4 slabs (LT-B Domestic)');
  db.close();
}

seed();
