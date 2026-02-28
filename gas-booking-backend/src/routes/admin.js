// src/routes/admin.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../database');
const { successResponse, errorResponse, auditLog } = require('../utils/helpers');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

/**
 * POST /api/admin/login
 */
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return errorResponse(res, 'Username and password required');

    const admin = db.prepare(`SELECT * FROM admin_users WHERE username = ? AND is_active = 1`).get(username);
    if (!admin) return errorResponse(res, 'Invalid credentials', 401);

    const valid = await bcrypt.compare(password, admin.password_hash);
    if (!valid) return errorResponse(res, 'Invalid credentials', 401);

    db.prepare(`UPDATE admin_users SET last_login = datetime('now') WHERE id = ?`).run(admin.id);

    const token = jwt.sign(
      { admin_id: admin.id, username: admin.username, role: admin.role },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    return successResponse(res, { token, role: admin.role, username: admin.username }, 'Login successful');
  } catch (err) {
    console.error('Admin login error:', err);
    return errorResponse(res, 'Login failed', 500);
  }
});

/**
 * GET /api/admin/dashboard
 * Overview stats
 */
router.get('/dashboard', authenticateToken, requireAdmin, (req, res) => {
  try {
    const stats = {
      total_consumers: db.prepare(`SELECT COUNT(*) as c FROM consumers WHERE is_active=1`).get().c,
      total_bookings: db.prepare(`SELECT COUNT(*) as c FROM bookings`).get().c,
      bookings_today: db.prepare(`SELECT COUNT(*) as c FROM bookings WHERE date(booked_at) = date('now')`).get().c,
      pending_bookings: db.prepare(`SELECT COUNT(*) as c FROM bookings WHERE status='pending'`).get().c,
      confirmed_bookings: db.prepare(`SELECT COUNT(*) as c FROM bookings WHERE status='confirmed'`).get().c,
      delivered_today: db.prepare(`SELECT COUNT(*) as c FROM bookings WHERE status='delivered' AND date(delivered_at)=date('now')`).get().c,
      total_revenue: db.prepare(`SELECT COALESCE(SUM(amount),0) as s FROM bookings WHERE status NOT IN ('cancelled')`).get().s,
      pending_subsidy: db.prepare(`SELECT COALESCE(SUM(amount),0) as s FROM subsidy_transactions WHERE status='pending'`).get().s,
    };

    const recent_bookings = db.prepare(`
      SELECT b.booking_ref, b.status, b.booked_at, b.amount,
        c.name as consumer_name, d.name as distributor_name
      FROM bookings b
      JOIN consumers c ON b.consumer_id = c.id
      JOIN distributors d ON b.distributor_id = d.id
      ORDER BY b.booked_at DESC LIMIT 10
    `).all();

    return successResponse(res, { stats, recent_bookings });
  } catch (err) {
    console.error('Dashboard error:', err);
    return errorResponse(res, 'Failed to fetch dashboard data', 500);
  }
});

/**
 * GET /api/admin/bookings
 * All bookings with filters
 */
router.get('/bookings', authenticateToken, requireAdmin, (req, res) => {
  try {
    const { status, date, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let where = 'WHERE 1=1';
    const params = [];

    if (status) { where += ' AND b.status = ?'; params.push(status); }
    if (date) { where += ' AND date(b.booked_at) = ?'; params.push(date); }

    const total = db.prepare(`SELECT COUNT(*) as c FROM bookings b ${where}`).get(...params).c;

    const bookings = db.prepare(`
      SELECT b.*, c.name as consumer_name, c.mobile as consumer_mobile,
        d.name as distributor_name, ds.slot_date, ds.slot_time
      FROM bookings b
      JOIN consumers c ON b.consumer_id = c.id
      JOIN distributors d ON b.distributor_id = d.id
      LEFT JOIN delivery_slots ds ON b.slot_id = ds.id
      ${where}
      ORDER BY b.booked_at DESC
      LIMIT ? OFFSET ?
    `).all(...params, parseInt(limit), offset);

    return successResponse(res, { bookings, pagination: { total, page: parseInt(page), limit: parseInt(limit) } });
  } catch (err) {
    console.error('Admin bookings error:', err);
    return errorResponse(res, 'Failed to fetch bookings', 500);
  }
});

/**
 * PATCH /api/admin/bookings/:ref/status
 * Update booking status (e.g. mark as delivered)
 */
router.patch('/bookings/:ref/status', authenticateToken, requireAdmin, (req, res) => {
  try {
    const { ref } = req.params;
    const { status } = req.body;

    const allowed = ['pending', 'confirmed', 'out_for_delivery', 'delivered', 'cancelled'];
    if (!allowed.includes(status)) return errorResponse(res, `Invalid status. Must be one of: ${allowed.join(', ')}`);

    const booking = db.prepare(`SELECT * FROM bookings WHERE booking_ref = ?`).get(ref);
    if (!booking) return errorResponse(res, 'Booking not found', 404);

    const updates = { status };
    if (status === 'delivered') updates.delivered_at = new Date().toISOString();
    if (status === 'confirmed') updates.confirmed_at = new Date().toISOString();

    const setClauses = Object.keys(updates).map(k => `${k} = ?`).join(', ');
    db.prepare(`UPDATE bookings SET ${setClauses} WHERE booking_ref = ?`).run(...Object.values(updates), ref);

    // If delivered, schedule subsidy credit
    if (status === 'delivered') {
      db.prepare(`
        UPDATE subsidy_transactions SET status = 'credited', credited_at = datetime('now', '+2 days')
        WHERE booking_id = ? AND status = 'pending'
      `).run(booking.id);
    }

    auditLog(db, 'booking', booking.id, 'STATUS_UPDATED', { ref, old_status: booking.status, new_status: status }, req.ip);

    return successResponse(res, { booking_ref: ref, status }, 'Status updated');
  } catch (err) {
    console.error('Update status error:', err);
    return errorResponse(res, 'Failed to update status', 500);
  }
});

/**
 * POST /api/admin/consumers
 * Register a new consumer (admin only)
 */
router.post('/consumers', authenticateToken, requireAdmin, (req, res) => {
  try {
    const { consumer_id, name, mobile, aadhaar, email, address, city, state, pincode, bank_account, ifsc_code } = req.body;

    if (!consumer_id || !name || !mobile) {
      return errorResponse(res, 'consumer_id, name, and mobile are required');
    }

    const exists = db.prepare(`SELECT id FROM consumers WHERE consumer_id = ? OR mobile = ?`).get(consumer_id, mobile);
    if (exists) return errorResponse(res, 'Consumer with this ID or mobile already exists', 409);

    const result = db.prepare(`
      INSERT INTO consumers (consumer_id, name, mobile, aadhaar, email, address, city, state, pincode, bank_account, ifsc_code)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(consumer_id, name, mobile, aadhaar || null, email || null, address || null,
           city || 'Guwahati', state || 'Assam', pincode || null, bank_account || null, ifsc_code || null);

    auditLog(db, 'consumer', result.lastInsertRowid, 'CONSUMER_CREATED', { consumer_id, name }, req.ip);

    return successResponse(res, { id: result.lastInsertRowid, consumer_id, name }, 'Consumer registered', 201);
  } catch (err) {
    console.error('Create consumer error:', err);
    return errorResponse(res, 'Failed to create consumer', 500);
  }
});

/**
 * GET /api/admin/consumers
 * List consumers
 */
router.get('/consumers', authenticateToken, requireAdmin, (req, res) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let where = 'WHERE is_active = 1';
    const params = [];
    if (search) {
      where += ' AND (name LIKE ? OR consumer_id LIKE ? OR mobile LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    const total = db.prepare(`SELECT COUNT(*) as c FROM consumers ${where}`).get(...params).c;
    const consumers = db.prepare(`SELECT * FROM consumers ${where} ORDER BY name ASC LIMIT ? OFFSET ?`).all(...params, parseInt(limit), offset);

    return successResponse(res, { consumers, pagination: { total, page: parseInt(page), limit: parseInt(limit) } });
  } catch (err) {
    console.error('List consumers error:', err);
    return errorResponse(res, 'Failed to list consumers', 500);
  }
});

/**
 * POST /api/admin/slots
 * Create delivery slots
 */
router.post('/slots', authenticateToken, requireAdmin, (req, res) => {
  try {
    const { distributor_id, slot_date, slot_time, capacity } = req.body;
    if (!distributor_id || !slot_date || !slot_time) {
      return errorResponse(res, 'distributor_id, slot_date, and slot_time are required');
    }

    const result = db.prepare(`
      INSERT INTO delivery_slots (distributor_id, slot_date, slot_time, capacity)
      VALUES (?, ?, ?, ?)
    `).run(distributor_id, slot_date, slot_time, capacity || 20);

    return successResponse(res, { id: result.lastInsertRowid }, 'Slot created', 201);
  } catch (err) {
    console.error('Create slot error:', err);
    return errorResponse(res, 'Failed to create slot', 500);
  }
});

module.exports = router;
