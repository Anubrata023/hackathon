const express = require('express');
const router  = express.Router();
const db      = require('../database');
const { authenticate, isAdmin } = require('../middleware/auth');

// ─── GET /api/outages  — public live feed ────────────────────────────────────
router.get('/', (req, res) => {
  const { district, status, type } = req.query;
  let where = []; let params = [];

  if (district) { where.push('district = ?');     params.push(district); }
  if (status)   { where.push('status = ?');        params.push(status); }
  if (type)     { where.push('outage_type = ?');   params.push(type); }

  const whereStr = where.length ? 'WHERE ' + where.join(' AND ') : '';
  const outages  = db.prepare(
    `SELECT * FROM outages ${whereStr} ORDER BY start_time DESC LIMIT 50`
  ).all(...params);

  res.json({ success: true, data: outages });
});

// ─── GET /api/outages/district/:district  — public ──────────────────────────
router.get('/district/:district', (req, res) => {
  const outages = db.prepare(
    "SELECT * FROM outages WHERE district = ? AND status != 'resolved' ORDER BY start_time DESC"
  ).all(req.params.district);
  res.json({ success: true, data: outages });
});

// ─── POST /api/outages  (admin) ─────────────────────────────────────────────
router.post('/', authenticate, isAdmin, (req, res) => {
  try {
    const { title, description, affected_areas, outage_type, district, start_time, end_time } = req.body;

    if (!title || !description || !affected_areas || !start_time) {
      return res.status(400).json({ success: false, message: 'title, description, affected_areas and start_time required' });
    }

    const result = db.prepare(`
      INSERT INTO outages (title, description, affected_areas, outage_type, district, start_time, end_time, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      title, description, affected_areas,
      outage_type || 'unplanned',
      district || null, start_time, end_time || null,
      req.user.id
    );

    res.status(201).json({ success: true, message: 'Outage notice created', data: { id: result.lastInsertRowid } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── PUT /api/outages/:id  (admin) ──────────────────────────────────────────
router.put('/:id', authenticate, isAdmin, (req, res) => {
  const { status, end_time, description } = req.body;
  const outage = db.prepare('SELECT id FROM outages WHERE id = ?').get(req.params.id);
  if (!outage) return res.status(404).json({ success: false, message: 'Outage not found' });

  db.prepare(`
    UPDATE outages SET status = ?, end_time = ?, description = ? WHERE id = ?
  `).run(status || 'active', end_time || null, description, req.params.id);

  res.json({ success: true, message: 'Outage updated' });
});

// ─── DELETE /api/outages/:id  (admin) ───────────────────────────────────────
router.delete('/:id', authenticate, isAdmin, (req, res) => {
  db.prepare('DELETE FROM outages WHERE id = ?').run(req.params.id);
  res.json({ success: true, message: 'Outage deleted' });
});

module.exports = router;
