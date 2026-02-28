// src/seed.js  –  Run: node src/seed.js
require('dotenv').config();
const db = require('./database');
const bcrypt = require('bcryptjs');

console.log('🌱  Seeding database...\n');

// ── DISTRIBUTORS ─────────────────────────────────────────────────
const distributors = [
  {
    dist_code: 'GHY-001',
    name: 'Guwahati Gas Agency',
    address: 'House No. 12, GS Road, Ulubari',
    city: 'Guwahati',
    pincode: '781007',
    mobile: '9876543210',
    rating: 4.7,
    distance_km: 1.2
  },
  {
    dist_code: 'GHY-002',
    name: 'Dispur LPG Centre',
    address: '45, Ganeshguri, Dispur',
    city: 'Guwahati',
    pincode: '781006',
    mobile: '9876543211',
    rating: 4.5,
    distance_km: 2.4
  },
  {
    dist_code: 'GHY-003',
    name: 'Bharatpur Gas Service',
    address: 'Plot 7, Beltola Basistha Road',
    city: 'Guwahati',
    pincode: '781028',
    mobile: '9876543212',
    rating: 4.3,
    distance_km: 3.8
  },
  {
    dist_code: 'GHY-004',
    name: 'Kamrup Energy Solutions',
    address: '22, Panjabari Road, Six Mile',
    city: 'Guwahati',
    pincode: '781037',
    mobile: '9876543213',
    rating: 4.6,
    distance_km: 5.1
  }
];

const insertDist = db.prepare(`
  INSERT OR IGNORE INTO distributors (dist_code, name, address, city, pincode, mobile, rating, distance_km)
  VALUES (@dist_code, @name, @address, @city, @pincode, @mobile, @rating, @distance_km)
`);
distributors.forEach(d => insertDist.run(d));
console.log(`✅  ${distributors.length} distributors seeded`);

// ── DELIVERY SLOTS (next 7 days) ──────────────────────────────────
const dbDists = db.prepare(`SELECT id FROM distributors`).all();
const timeSlots = ['09:00-12:00', '12:00-15:00', '15:00-18:00', '18:00-20:00'];
const insertSlot = db.prepare(`
  INSERT OR IGNORE INTO delivery_slots (distributor_id, slot_date, slot_time, capacity)
  VALUES (?, ?, ?, ?)
`);

let slotCount = 0;
for (let dayOffset = 1; dayOffset <= 7; dayOffset++) {
  const d = new Date();
  d.setDate(d.getDate() + dayOffset);
  const dateStr = d.toISOString().slice(0, 10);

  dbDists.forEach(dist => {
    timeSlots.forEach(time => {
      insertSlot.run(dist.id, dateStr, time, 15);
      slotCount++;
    });
  });
}
console.log(`✅  ${slotCount} delivery slots seeded`);

// ── CONSUMERS ─────────────────────────────────────────────────────
const consumers = [
  {
    consumer_id: '6200012345678',
    name: 'Rajesh Kumar Sharma',
    mobile: '9876543001',
    aadhaar: '123456789012',
    email: 'rajesh.sharma@email.com',
    address: 'House No. 3B, Lachit Nagar',
    city: 'Guwahati',
    state: 'Assam',
    pincode: '781001',
    bank_account: '12345678901234',
    ifsc_code: 'SBIN0001234',
    subsidy_eligible: 1
  },
  {
    consumer_id: '6200023456789',
    name: 'Priya Devi Kalita',
    mobile: '9876543002',
    aadhaar: '234567890123',
    email: 'priya.kalita@email.com',
    address: '45/A, Paltan Bazar',
    city: 'Guwahati',
    state: 'Assam',
    pincode: '781008',
    bank_account: '23456789012345',
    ifsc_code: 'PUNB0001234',
    subsidy_eligible: 1
  },
  {
    consumer_id: '6200034567890',
    name: 'Mohammed Iqbal Hussain',
    mobile: '9876543003',
    aadhaar: '345678901234',
    email: 'iqbal.hussain@email.com',
    address: 'Ward 12, Fancy Bazar',
    city: 'Guwahati',
    state: 'Assam',
    pincode: '781001',
    bank_account: '34567890123456',
    ifsc_code: 'UTBI0001234',
    subsidy_eligible: 1
  },
  {
    consumer_id: '6200045678901',
    name: 'Anita Bora Gogoi',
    mobile: '9876543004',
    aadhaar: '456789012345',
    email: 'anita.gogoi@email.com',
    address: '8, Rukmini Nagar, Beltola',
    city: 'Guwahati',
    state: 'Assam',
    pincode: '781028',
    bank_account: null,
    ifsc_code: null,
    subsidy_eligible: 0
  }
];

const insertConsumer = db.prepare(`
  INSERT OR IGNORE INTO consumers
    (consumer_id, name, mobile, aadhaar, email, address, city, state, pincode, bank_account, ifsc_code, subsidy_eligible)
  VALUES
    (@consumer_id, @name, @mobile, @aadhaar, @email, @address, @city, @state, @pincode, @bank_account, @ifsc_code, @subsidy_eligible)
`);
consumers.forEach(c => insertConsumer.run(c));
console.log(`✅  ${consumers.length} consumers seeded`);

// ── ADMIN USERS ───────────────────────────────────────────────────
async function seedAdmins() {
  const admins = [
    { username: 'admin', password: 'Admin@1234', role: 'superadmin' },
    { username: 'operator', password: 'Operator@1234', role: 'admin' }
  ];

  const insertAdmin = db.prepare(`
    INSERT OR IGNORE INTO admin_users (username, password_hash, role)
    VALUES (?, ?, ?)
  `);

  for (const a of admins) {
    const hash = await bcrypt.hash(a.password, 10);
    insertAdmin.run(a.username, hash, a.role);
  }
  console.log(`✅  ${admins.length} admin users seeded`);
  console.log('\n📋  Admin Credentials:');
  console.log('   Superadmin: admin / Admin@1234');
  console.log('   Operator:   operator / Operator@1234');
}

// ── SAMPLE PAST BOOKINGS ──────────────────────────────────────────
function seedSampleBookings() {
  const distId = db.prepare(`SELECT id FROM distributors LIMIT 1`).get().id;
  const consumer = db.prepare(`SELECT id FROM consumers WHERE consumer_id = '6200012345678'`).get();
  if (!consumer) return;

  const pastBookings = [
    { ref: 'OTP-26-GHY-67821', status: 'delivered', booked_at: '2026-02-18 10:30:00', delivered_at: '2026-02-18 14:00:00' },
    { ref: 'OTP-26-GHY-53490', status: 'delivered', booked_at: '2026-01-21 09:15:00', delivered_at: '2026-01-21 13:30:00' },
    { ref: 'OTP-25-GHY-44107', status: 'delivered', booked_at: '2025-12-15 11:00:00', delivered_at: '2025-12-15 15:00:00' }
  ];

  const insertBooking = db.prepare(`
    INSERT OR IGNORE INTO bookings
      (booking_ref, consumer_id, distributor_id, cylinder_type, quantity, amount,
       status, otp_verified, booked_at, confirmed_at, delivered_at)
    VALUES (?, ?, ?, '14.2 kg', 1, 899.50, ?, 1, ?, ?, ?)
  `);

  pastBookings.forEach(b => {
    insertBooking.run(b.ref, consumer.id, distId, b.status, b.booked_at, b.booked_at, b.delivered_at);
  });
  console.log(`✅  ${pastBookings.length} sample bookings seeded`);
}

seedAdmins().then(() => {
  seedSampleBookings();
  console.log('\n🚀  Seeding complete! Run: npm start\n');
  console.log('📱  Test Consumer Credentials:');
  console.log('   Mobile: 9876543001  |  Consumer ID: 6200012345678');
  console.log('   Mobile: 9876543002  |  Consumer ID: 6200023456789');
  console.log('   Mobile: 9876543003  |  Consumer ID: 6200034567890');
  console.log('');
  process.exit(0);
}).catch(err => {
  console.error('Seed error:', err);
  process.exit(1);
});
