const express = require('express');
const router  = express.Router();
const db      = require('../database');
const { authenticate, isAdmin } = require('../middleware/auth');

const COMPLAINT_TYPES = [
  'power_outage', 'billing_error', 'voltage_fluctuation',
  'transformer_fault', 'meter_fault', 'new_connection',
  'street_light', 'other'
];

function genComplaintNo() {
  return 'CMP' + Date.now().toString().slice(-9);
}

// ─── POST /api/complaints  — public or logged-in ─────────────────────────────
router.post('/', (req, res) => {
  try {
    const { name, phone, email, consumer_id, complaint_type, subject, description, address, district } = req.body;

    if (!name || !phone || !complaint_type || !subject || !description) {
      return res.status(400).json({
        success: false,
        message: 'name, phone, complaint_type, subject and description are required'
      });
    }

    if (!COMPLAINT_TYPES.includes(complaint_type)) {
      return res.status(400).json({
        success: false,
        message: `complaint_type must be one of: ${COMPLAINT_TYPES.join(', ')}`
      });
    }

    let userId = null;
    if (consumer_id) {
      const user = db.prepare('SELECT id FROM users WHERE consumer_id = ?').get(consumer_id);
      if (user) userId = user.id;
    }

    const complaintNumber = genComplaintNo();

    db.prepare(`
      INSERT INTO complaints
        (complaint_number, consumer_id, user_id, name, phone, email,
         complaint_type, subject, description, address, district)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      complaintNumber, consumer_id || null, userId,
      name, phone, email || null,
      complaint_type, subject, description,
      address || null, district || null
    );

    res.status(201).json({
      success: true,
      message: 'Complaint submitted successfully. You will receive an SMS update.',
      data: { complaint_number: complaintNumber }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── GET /api/complaints/track/:complaint_number  — public ──────────────────
router.get('/track/:complaint_number', (req, res) => {
  const complaint = db.prepare('SELECT * FROM complaints WHERE complaint_number = ?')
    .get(req.params.complaint_number);
  if (!complaint) return res.status(404).json({ success: false, message: 'Complaint not found' });
  res.json({ success: true, data: complaint });
});

// ─── GET /api/complaints/my  — own complaints ───────────────────────────────
router.get('/my', authenticate, (req, res) => {
  const complaints = db.prepare(
    'SELECT * FROM complaints WHERE user_id = ? ORDER BY created_at DESC'
  ).all(req.user.id);
  res.json({ success: true, data: complaints });
});

// ─── GET /api/complaints  (admin) ───────────────────────────────────────────
router.get('/', authenticate, isAdmin, (req, res) => {
  const { status, district, type, page = 1, limit = 20 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  let where  = [];
  let params = [];

  if (status)   { where.push('status = ?');         params.push(status); }
  if (district) { where.push('district = ?');        params.push(district); }
  if (type)     { where.push('complaint_type = ?');  params.push(type); }

  const whereStr = where.length ? 'WHERE ' + where.join(' AND ') : '';

  const total = db.prepare(`SELECT COUNT(*) AS count FROM complaints ${whereStr}`).get(...params);
  const rows  = db.prepare(
    `SELECT * FROM complaints ${whereStr} ORDER BY created_at DESC LIMIT ? OFFSET ?`
  ).all(...params, parseInt(limit), offset);

  res.json({ success: true, total: total.count, page: parseInt(page), data: rows });
});

// ─── PUT /api/complaints/:id  (admin) ───────────────────────────────────────
router.put('/:id', authenticate, isAdmin, (req, res) => {
  try {
    const { status, resolution, priority } = req.body;
    const complaint = db.prepare('SELECT id FROM complaints WHERE id = ?').get(req.params.id);
    if (!complaint) return res.status(404).json({ success: false, message: 'Complaint not found' });

    db.prepare(`
      UPDATE complaints
      SET status = ?, resolution = ?, priority = ?,
          resolved_at = CASE WHEN ? = 'resolved' THEN datetime('now') ELSE resolved_at END,
          updated_at  = datetime('now')
      WHERE id = ?
    `).run(
      status       || 'pending',
      resolution   || null,
      priority     || 'normal',
      status,
      req.params.id
    );

    res.json({ success: true, message: 'Complaint updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── GET /api/complaints/types  — useful for frontend dropdowns ──────────────
router.get('/types/list', (_req, res) => {
  res.json({ success: true, data: COMPLAINT_TYPES });
});

module.exports = router;
