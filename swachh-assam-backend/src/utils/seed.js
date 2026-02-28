require('dotenv').config();
const bcrypt = require('bcryptjs');
const { initializeDatabase, dbRun, dbGet } = require('../config/database');

async function seed() {
  await initializeDatabase();
  console.log('🌱 Seeding database...');

  // Admin user
  const adminExists = await dbGet("SELECT id FROM users WHERE mobile = '9999999999'");
  if (!adminExists) {
    const hash = await bcrypt.hash('Admin@1234', 12);
    await dbRun(
      "INSERT INTO users (name, email, mobile, password_hash, role, ward) VALUES (?, ?, ?, ?, ?, ?)",
      ['Admin GMC', 'admin@swachh-assam.gov.in', '9999999999', hash, 'admin', null]
    );
    console.log('✅ Admin user created — mobile: 9999999999 | password: Admin@1234');
  }

  // Field officers
  const officers = [
    { name: 'Rajan Borah', mobile: '9876543210', ward: 'Ward 1 – Panbazar' },
    { name: 'Priya Das', mobile: '9876543211', ward: 'Ward 2 – Dispur' },
    { name: 'Amit Saikia', mobile: '9876543212', ward: 'Ward 3 – Chandmari' },
  ];
  for (const o of officers) {
    const exists = await dbGet('SELECT id FROM users WHERE mobile = ?', [o.mobile]);
    if (!exists) {
      const hash = await bcrypt.hash('Officer@123', 12);
      await dbRun(
        "INSERT INTO users (name, mobile, password_hash, role, ward) VALUES (?, ?, ?, 'field_officer', ?)",
        [o.name, o.mobile, hash, o.ward]
      );
    }
  }
  console.log('✅ Field officers seeded');

  // Collection schedules
  const scheduleCount = await dbGet('SELECT COUNT(*) as cnt FROM collection_schedules');
  if (scheduleCount.cnt === 0) {
    const schedules = [
      // Ward 1 Panbazar
      { ward: 'Ward 1 – Panbazar', zone: 'Zone A', day: 1, types: 'Wet Waste', vehicle: 'GUW-W-0001' },
      { ward: 'Ward 1 – Panbazar', zone: 'Zone A', day: 2, types: 'Dry Waste', vehicle: 'GUW-W-0001' },
      { ward: 'Ward 1 – Panbazar', zone: 'Zone A', day: 3, types: 'Wet Waste', vehicle: 'GUW-W-0001' },
      { ward: 'Ward 1 – Panbazar', zone: 'Zone A', day: 4, types: 'Dry Waste', vehicle: 'GUW-W-0001' },
      { ward: 'Ward 1 – Panbazar', zone: 'Zone A', day: 5, types: 'Wet Waste, Dry Waste', vehicle: 'GUW-W-0001' },
      { ward: 'Ward 1 – Panbazar', zone: 'Zone A', day: 6, types: 'Hazardous Waste', vehicle: 'GUW-H-0001' },
      // Ward 2 Dispur
      { ward: 'Ward 2 – Dispur', zone: 'Zone A', day: 1, types: 'Wet Waste', vehicle: 'GUW-W-0002' },
      { ward: 'Ward 2 – Dispur', zone: 'Zone A', day: 2, types: 'Dry Waste', vehicle: 'GUW-W-0002' },
      { ward: 'Ward 2 – Dispur', zone: 'Zone A', day: 3, types: 'Wet Waste', vehicle: 'GUW-W-0002' },
      { ward: 'Ward 2 – Dispur', zone: 'Zone A', day: 4, types: 'Dry Waste', vehicle: 'GUW-W-0002' },
      { ward: 'Ward 2 – Dispur', zone: 'Zone A', day: 5, types: 'Wet Waste, Dry Waste', vehicle: 'GUW-W-0002' },
      { ward: 'Ward 2 – Dispur', zone: 'Zone A', day: 6, types: 'Hazardous Waste', vehicle: 'GUW-H-0001' },
    ];
    for (const s of schedules) {
      await dbRun(
        `INSERT INTO collection_schedules (ward, zone, day_of_week, waste_types, shift, timing, vehicle_number)
         VALUES (?, ?, ?, ?, 'morning', '06:30 AM - 09:30 AM', ?)`,
        [s.ward, s.zone, s.day, s.types, s.vehicle]
      );
    }
    console.log('✅ Collection schedules seeded');
  }

  // Sample notices
  const noticeCount = await dbGet('SELECT COUNT(*) as cnt FROM notices');
  if (noticeCount.cnt === 0) {
    await dbRun(
      `INSERT INTO notices (title, body, notice_type, ward, expires_at) VALUES (?, ?, ?, ?, ?)`,
      [
        'Republic Day Schedule Change',
        'Due to the Republic Day parade on 26th January, garbage collection in Dispur and Panbazar wards will be rescheduled to 27th January (morning shift). Residents are advised to keep waste bags ready by 6 AM.',
        'warning',
        null,
        '2026-02-01'
      ]
    );
    await dbRun(
      `INSERT INTO notices (title, body, notice_type) VALUES (?, ?, ?)`,
      ['Plastic Ban Reminder', 'Single-use plastics under 75 microns remain banned in Assam. Please use cloth bags and report violations to the helpline.', 'info']
    );
    console.log('✅ Notices seeded');
  }

  // Sample complaints
  const complaintCount = await dbGet('SELECT COUNT(*) as cnt FROM complaints');
  if (complaintCount.cnt === 0) {
    const sampleComplaints = [
      { ref: 'GUW-2026-11001', name: 'Ramesh Kalita', mobile: '9876500001', ward: 'Ward 1 – Panbazar', type: 'Missed Garbage Collection', desc: 'Garbage not collected for 3 days', status: 'resolved' },
      { ref: 'GUW-2026-11002', name: 'Minakshi Bora', mobile: '9876500002', ward: 'Ward 2 – Dispur', type: 'Overflowing Public Bin', desc: 'Public bin near market overflowing', status: 'in_progress' },
      { ref: 'GUW-2026-11003', name: 'Dipak Gogoi', mobile: '9876500003', ward: 'Ward 3 – Chandmari', type: 'Illegal Dumping / Littering', desc: 'Large pile of debris dumped on roadside', status: 'pending', priority: 'high' },
    ];
    for (const c of sampleComplaints) {
      const result = await dbRun(
        `INSERT INTO complaints (reference_number, user_name, mobile, ward, issue_type, description, status, priority)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [c.ref, c.name, c.mobile, c.ward, c.type, c.desc, c.status, c.priority || 'normal']
      );
      if (c.status === 'resolved') {
        await dbRun('UPDATE complaints SET resolved_at = CURRENT_TIMESTAMP, resolution_note = "Resolved by field team" WHERE id = ?', [result.lastID]);
      }
      await dbRun(
        'INSERT INTO complaint_history (complaint_id, new_status, note) VALUES (?, ?, ?)',
        [result.lastID, c.status, 'Initial status']
      );
    }
    console.log('✅ Sample complaints seeded');
  }

  console.log('\n🎉 Database seeded successfully!\n');
  console.log('Admin Login:');
  console.log('  Mobile: 9999999999');
  console.log('  Password: Admin@1234\n');
  process.exit(0);
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
