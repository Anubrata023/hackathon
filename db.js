/**
 * seed.js — Run once to populate demo data
 * Usage: node seed.js
 */
require('dotenv').config();
const bcrypt       = require('bcryptjs');
const { v4: uuid } = require('uuid');
const { getDB, initializeDatabase } = require('./database/db');

initializeDatabase(() => {
  const db = getDB();

  console.log('\n🌱  Seeding database...\n');

  // ── Admin User ─────────────────────────────────────────────────────────────
  const adminId = uuid();
  const adminExists = db.prepare("SELECT id FROM users WHERE email = 'admin@gasportal.com'").get();
  if (!adminExists) {
    db.prepare(`
      INSERT INTO users (id, name, email, phone, password_hash, role, address)
      VALUES (?, ?, ?, ?, ?, 'admin', ?)
    `).run(adminId, 'Admin User', 'admin@gasportal.com', '9999999999',
           bcrypt.hashSync('Admin@123', 10), 'Head Office, New Delhi');
    console.log('✅  Admin user created → admin@gasportal.com / Admin@123');
  } else {
    console.log('ℹ️   Admin already exists, skipping...');
  }

  // ── Demo Customer ──────────────────────────────────────────────────────────
  const custId = uuid();
  const custExists = db.prepare("SELECT id FROM users WHERE email = 'customer@example.com'").get();
  if (!custExists) {
    db.prepare(`
      INSERT INTO users (id, name, email, phone, password_hash, role, address)
      VALUES (?, ?, ?, ?, ?, 'customer', ?)
    `).run(custId, 'Rahul Sharma', 'customer@example.com', '9876543210',
           bcrypt.hashSync('Customer@123', 10), '42, Sector 15, Gurgaon, Haryana');
    console.log('✅  Customer created  → customer@example.com / Customer@123');
  } else {
    console.log('ℹ️   Customer already exists, skipping...');
  }

  // ── Demo Connection ────────────────────────────────────────────────────────
  const userId = db.prepare("SELECT id FROM users WHERE email = 'customer@example.com'").get()?.id;
  if (userId) {
    const connExists = db.prepare("SELECT id FROM connections WHERE user_id = ?").get(userId);
    if (!connExists) {
      const connId = uuid();
      db.prepare(`
        INSERT INTO connections (id, user_id, consumer_number, address, connection_type, status, meter_number)
        VALUES (?, ?, ?, ?, 'domestic', 'active', ?)
      `).run(connId, userId, 'GAS-10001', '42, Sector 15, Gurgaon, Haryana', 'MTR-5001');

      // Demo Bill
      const billId = uuid();
      db.prepare(`
        INSERT INTO bills (id, connection_id, user_id, bill_number, billing_period, units_consumed, amount, due_date, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'unpaid')
      `).run(billId, connId, userId, 'BILL-10001', '2025-01', 45.5, 1820.00, '2025-02-15');

      // Demo Overdue Bill
      const billId2 = uuid();
      db.prepare(`
        INSERT INTO bills (id, connection_id, user_id, bill_number, billing_period, units_consumed, amount, due_date, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'overdue')
      `).run(billId2, connId, userId, 'BILL-10002', '2024-12', 52.0, 2080.00, '2025-01-15');

      // Demo Complaint
      const complId = uuid();
      db.prepare(`
        INSERT INTO complaints (id, user_id, connection_id, subject, description, category, status)
        VALUES (?, ?, ?, ?, ?, 'billing', 'open')
      `).run(complId, userId, connId,
        'Incorrect bill amount for January',
        'The bill for January 2025 seems too high compared to previous months. Please review.');

      // Demo Notification
      db.prepare(`
        INSERT INTO notifications (id, user_id, title, message, type)
        VALUES (?, ?, 'Welcome to Gas Services Portal!', ?, 'info')
      `).run(uuid(), userId, 'Your account is set up. You can apply for services, view bills, and raise complaints here.');

      console.log('✅  Demo connection, bills, complaint & notification created');
    }
  }

  console.log('\n🎉  Seeding complete!\n');
  process.exit(0);
});
