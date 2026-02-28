const { v4: uuid } = require('uuid');
const { getDB }    = require('../database/db');

const CATEGORIES = ['billing', 'technical', 'general', 'safety', 'supply', 'meter'];

// ── Submit a new complaint ────────────────────────────────────────────────────
exports.submitComplaint = (req, res) => {
  const { connection_id, subject, description, category } = req.body;

  if (!subject || !description) {
    return res.status(400).json({ success: false, message: 'subject and description are required' });
  }

  const db = getDB();
  const id = uuid();

  db.prepare(`
    INSERT INTO complaints (id, user_id, connection_id, subject, description, category)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    id, req.user.id, connection_id || null,
    subject, description,
    CATEGORIES.includes(category) ? category : 'general'
  );

  // Notify user
  const notifId = uuid();
  db.prepare(`
    INSERT INTO notifications (id, user_id, title, message, type)
    VALUES (?, ?, 'Complaint Registered', ?, 'info')
  `).run(notifId, req.user.id,
    `Your complaint "${subject}" has been registered. We'll respond within 48 hours.`);

  res.status(201).json({ success: true, message: 'Complaint submitted successfully', id });
};

// ── Get all complaints for logged-in user ─────────────────────────────────────
exports.getMyComplaints = (req, res) => {
  const { status } = req.query;
  const db = getDB();

  let query  = 'SELECT * FROM complaints WHERE user_id = ?';
  const params = [req.user.id];

  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }

  query += ' ORDER BY created_at DESC';
  const rows = db.prepare(query).all(...params);
  res.json({ success: true, complaints: rows });
};

// ── Get single complaint ──────────────────────────────────────────────────────
exports.getComplaintById = (req, res) => {
  const db  = getDB();
  const row = db.prepare(
    'SELECT * FROM complaints WHERE id = ? AND user_id = ?'
  ).get(req.params.id, req.user.id);

  if (!row) return res.status(404).json({ success: false, message: 'Complaint not found' });
  res.json({ success: true, complaint: row });
};

// ── Get complaint categories ──────────────────────────────────────────────────
exports.getCategories = (_req, res) => {
  res.json({ success: true, categories: CATEGORIES });
};
