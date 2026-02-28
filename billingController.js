const { v4: uuid } = require('uuid');
const { getDB }    = require('../database/db');

const SERVICE_TYPES = [
  { value: 'new_connection', label: 'New Connection' },
  { value: 'disconnection',  label: 'Disconnection' },
  { value: 'repair',         label: 'Repair / Maintenance' },
  { value: 'meter_change',   label: 'Meter Replacement' },
  { value: 'name_change',    label: 'Name Transfer' },
  { value: 'load_change',    label: 'Load Enhancement' },
  { value: 'reconnection',   label: 'Reconnection' },
];

// ── Get available service types ───────────────────────────────────────────────
exports.getServiceTypes = (_req, res) => {
  res.json({ success: true, types: SERVICE_TYPES });
};

// ── Create a service request ──────────────────────────────────────────────────
exports.createRequest = (req, res) => {
  const { connection_id, service_type, description, scheduled_date, priority } = req.body;

  if (!service_type) {
    return res.status(400).json({ success: false, message: 'service_type is required' });
  }

  const validTypes = SERVICE_TYPES.map(t => t.value);
  if (!validTypes.includes(service_type)) {
    return res.status(400).json({ success: false, message: `Invalid service_type. Valid values: ${validTypes.join(', ')}` });
  }

  const db = getDB();
  const id = uuid();

  db.prepare(`
    INSERT INTO service_requests
      (id, user_id, connection_id, service_type, description, scheduled_date, priority)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    id, req.user.id, connection_id || null,
    service_type, description || null,
    scheduled_date || null, priority || 'normal'
  );

  // Notify user
  const notifId = uuid();
  db.prepare(`
    INSERT INTO notifications (id, user_id, title, message, type)
    VALUES (?, ?, 'Service Request Submitted', ?, 'info')
  `).run(notifId, req.user.id,
    `Your ${service_type.replace(/_/g, ' ')} request has been submitted and is pending review.`);

  res.status(201).json({ success: true, message: 'Service request submitted successfully', id });
};

// ── Get all service requests for logged-in user ───────────────────────────────
exports.getMyRequests = (req, res) => {
  const { status } = req.query;
  const db = getDB();

  let query = 'SELECT * FROM service_requests WHERE user_id = ?';
  const params = [req.user.id];

  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }

  query += ' ORDER BY created_at DESC';
  const rows = db.prepare(query).all(...params);
  res.json({ success: true, requests: rows });
};

// ── Get single service request ────────────────────────────────────────────────
exports.getRequestById = (req, res) => {
  const db  = getDB();
  const row = db.prepare(
    'SELECT * FROM service_requests WHERE id = ? AND user_id = ?'
  ).get(req.params.id, req.user.id);

  if (!row) return res.status(404).json({ success: false, message: 'Request not found' });
  res.json({ success: true, request: row });
};

// ── Cancel a pending service request ─────────────────────────────────────────
exports.cancelRequest = (req, res) => {
  const db = getDB();
  const sr = db.prepare(
    'SELECT * FROM service_requests WHERE id = ? AND user_id = ?'
  ).get(req.params.id, req.user.id);

  if (!sr) return res.status(404).json({ success: false, message: 'Request not found' });
  if (sr.status !== 'pending') {
    return res.status(400).json({ success: false, message: 'Only pending requests can be cancelled' });
  }

  db.prepare("UPDATE service_requests SET status = 'cancelled' WHERE id = ?").run(req.params.id);
  res.json({ success: true, message: 'Service request cancelled' });
};
