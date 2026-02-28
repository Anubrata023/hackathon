const { v4: uuid } = require('uuid');
const { getDB }    = require('../database/db');

// ── Get all connections for logged-in user ────────────────────────────────────
exports.getMyConnections = (req, res) => {
  const db   = getDB();
  const rows = db.prepare(
    'SELECT * FROM connections WHERE user_id = ? ORDER BY created_at DESC'
  ).all(req.user.id);
  res.json({ success: true, connections: rows });
};

// ── Get single connection ─────────────────────────────────────────────────────
exports.getConnectionById = (req, res) => {
  const db  = getDB();
  const row = db.prepare(
    'SELECT * FROM connections WHERE id = ? AND user_id = ?'
  ).get(req.params.id, req.user.id);

  if (!row) return res.status(404).json({ success: false, message: 'Connection not found' });
  res.json({ success: true, connection: row });
};

// ── Apply for new connection ──────────────────────────────────────────────────
exports.applyNewConnection = (req, res) => {
  const { address, connection_type, meter_number } = req.body;

  if (!address) {
    return res.status(400).json({ success: false, message: 'address is required' });
  }

  const db              = getDB();
  const id              = uuid();
  const consumer_number = 'GAS-' + Date.now();

  db.prepare(`
    INSERT INTO connections (id, user_id, consumer_number, address, connection_type, status, meter_number)
    VALUES (?, ?, ?, ?, ?, 'pending', ?)
  `).run(id, req.user.id, consumer_number, address, connection_type || 'domestic', meter_number || null);

  // Auto-create a service request for the new connection
  const srId = uuid();
  db.prepare(`
    INSERT INTO service_requests (id, user_id, connection_id, service_type, description, status)
    VALUES (?, ?, ?, 'new_connection', 'New gas connection application submitted.', 'pending')
  `).run(srId, req.user.id, id);

  // Notify the user
  const notifId = uuid();
  db.prepare(`
    INSERT INTO notifications (id, user_id, title, message, type)
    VALUES (?, ?, 'Application Submitted', ?, 'info')
  `).run(notifId, req.user.id,
    `Your new connection application (${consumer_number}) has been submitted and is under review.`);

  res.status(201).json({
    success: true,
    message: 'Connection application submitted successfully',
    consumer_number,
    connection_id: id,
  });
};
