const express = require('express');
const router  = express.Router();
const db      = require('../database');
const { authenticate, isAdmin } = require('../middleware/auth');

// All admin routes require authentication + admin role
router.use(authenticate, isAdmin);

// ─── GET /api/admin/dashboard ────────────────────────────────────────────────
router.get('/dashboard', (req, res) => {
  const totalConsumers   = db.prepare("SELECT COUNT(*) AS c FROM users WHERE role = 'customer'").get().c;
  const activeConsumers  = db.prepare("SELECT COUNT(*) AS c FROM users WHERE role = 'customer' AND is_active = 1").get().c;
  const totalBills       = db.prepare('SELECT COUNT(*) AS c FROM bills').get().c;
  const unpaidBills      = db.prepare("SELECT COUNT(*) AS c, COALESCE(SUM(total_amount),0) AS t FROM bills WHERE status = 'unpaid'").get();
  const totalRevenue     = db.prepare("SELECT COALESCE(SUM(amount),0) AS t FROM payments WHERE payment_status = 'success'").get().t;
  const openComplaints   = db.prepare("SELECT COUNT(*) AS c FROM complaints WHERE status IN ('pending','open')").get().c;
  const pendingConns     = db.prepare("SELECT COUNT(*) AS c FROM connection_requests WHERE status = 'pending'").get().c;
  const activeOutages    = db.prepare("SELECT COUNT(*) AS c FROM outages WHERE status = 'active'").get().c;

  res.json({
    success: true,
    data: {
      total_consumers   : totalConsumers,
      active_consumers  : activeConsumers,
      total_bills       : totalBills,
      unpaid_bills      : unpaidBills.c,
      pending_revenue   : unpaidBills.t,
      total_revenue     : totalRevenue,
      open_complaints   : openComplaints,
      pending_connections: pendingConns,
      active_outages    : activeOutages
    }
  });
});

// ─── GET /api/admin/consumers ────────────────────────────────────────────────
router.get('/consumers', (req, res) => {
  const { search, district, page = 1, limit = 20 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  let where = ["role = 'customer'"]; let params = [];

  if (search) {
    where.push('(name LIKE ? OR consumer_id LIKE ? OR phone LIKE ? OR email LIKE ?)');
    const s = `%${search}%`;
    params.push(s, s, s, s);
  }
  if (district) { where.push('district = ?'); params.push(district); }

  const whereStr = 'WHERE ' + where.join(' AND ');
  const total    = db.prepare(`SELECT COUNT(*) AS c FROM users ${whereStr}`).get(...params).c;
  const rows     = db.prepare(
    `SELECT id, name, email, phone, consumer_id, district, address, is_active, created_at
     FROM users ${whereStr}
     ORDER BY created_at DESC LIMIT ? OFFSET ?`
  ).all(...params, parseInt(limit), offset);

  res.json({ success: true, total, page: parseInt(page), data: rows });
});

// ─── GET /api/admin/consumers/:id ───────────────────────────────────────────
router.get('/consumers/:id', (req, res) => {
  const user = db.prepare(
    'SELECT id, name, email, phone, consumer_id, district, address, is_active, created_at FROM users WHERE id = ?'
  ).get(req.params.id);
  if (!user) return res.status(404).json({ success: false, message: 'Consumer not found' });

  const meter    = db.prepare('SELECT * FROM meters WHERE user_id = ?').get(req.params.id);
  const bills    = db.prepare('SELECT * FROM bills WHERE user_id = ? ORDER BY generated_at DESC LIMIT 6').all(req.params.id);
  const payments = db.prepare('SELECT * FROM payments WHERE user_id = ? ORDER BY payment_date DESC LIMIT 6').all(req.params.id);

  res.json({ success: true, data: { user, meter, recent_bills: bills, recent_payments: payments } });
});

// ─── PUT /api/admin/consumers/:id/toggle ────────────────────────────────────
router.put('/consumers/:id/toggle', (req, res) => {
  const user = db.prepare('SELECT id, is_active FROM users WHERE id = ? AND role = ?').get(req.params.id, 'customer');
  if (!user) return res.status(404).json({ success: false, message: 'Consumer not found' });

  const newStatus = user.is_active ? 0 : 1;
  db.prepare('UPDATE users SET is_active = ? WHERE id = ?').run(newStatus, req.params.id);
  res.json({ success: true, message: `Consumer ${newStatus ? 'activated' : 'deactivated'}` });
});

// ─── POST /api/admin/meters  — register a meter to a consumer ────────────────
router.post('/meters', (req, res) => {
  try {
    const { consumer_id, meter_number, meter_type, connection_type, sanctioned_load, installation_date } = req.body;

    if (!consumer_id || !meter_number) {
      return res.status(400).json({ success: false, message: 'consumer_id and meter_number are required' });
    }

    const user = db.prepare('SELECT id FROM users WHERE consumer_id = ?').get(consumer_id);
    if (!user) return res.status(404).json({ success: false, message: 'Consumer not found' });

    const existing = db.prepare('SELECT id FROM meters WHERE consumer_id = ?').get(consumer_id);
    if (existing) return res.status(409).json({ success: false, message: 'A meter is already registered for this consumer' });

    db.prepare(`
      INSERT INTO meters (consumer_id, user_id, meter_number, meter_type, connection_type, sanctioned_load, installation_date)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      consumer_id, user.id, meter_number,
      meter_type       || 'single_phase',
      connection_type  || 'domestic',
      parseFloat(sanctioned_load) || 2.0,
      installation_date || null
    );

    res.status(201).json({ success: true, message: 'Meter registered successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── GET /api/admin/tariffs ──────────────────────────────────────────────────
router.get('/tariffs', (req, res) => {
  const tariffs = db.prepare('SELECT * FROM tariffs WHERE is_active = 1 ORDER BY connection_type, slab_from').all();
  res.json({ success: true, data: tariffs });
});

// ─── POST /api/admin/tariffs ─────────────────────────────────────────────────
router.post('/tariffs', (req, res) => {
  try {
    const { connection_type, slab_from, slab_to, rate_per_unit, fixed_charge, effective_from } = req.body;
    db.prepare(`
      INSERT INTO tariffs (connection_type, slab_from, slab_to, rate_per_unit, fixed_charge, effective_from)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(connection_type, slab_from, slab_to || null, rate_per_unit, fixed_charge || 0, effective_from);
    res.status(201).json({ success: true, message: 'Tariff slab added' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── GET /api/admin/reports/revenue  ─────────────────────────────────────────
router.get('/reports/revenue', (req, res) => {
  const monthly = db.prepare(`
    SELECT strftime('%Y-%m', payment_date) AS month,
           COUNT(*)                        AS transactions,
           SUM(amount)                     AS revenue
    FROM   payments
    WHERE  payment_status = 'success'
    GROUP  BY month
    ORDER  BY month DESC
    LIMIT  12
  `).all();

  const byDistrict = db.prepare(`
    SELECT u.district,
           COUNT(p.id)  AS transactions,
           SUM(p.amount) AS revenue
    FROM   payments p
    JOIN   users    u ON p.user_id = u.id
    WHERE  p.payment_status = 'success'
    GROUP  BY u.district
    ORDER  BY revenue DESC
  `).all();

  res.json({ success: true, data: { monthly, by_district: byDistrict } });
});

module.exports = router;
