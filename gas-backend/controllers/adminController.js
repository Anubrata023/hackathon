const { v4: uuid } = require('uuid');
const { getDB }    = require('../database/db');

// ── Dashboard Stats ───────────────────────────────────────────────────────────
exports.getDashboard = (_req, res) => {
  const db = getDB();
  const stats = {
    total_users:       db.prepare("SELECT COUNT(*) AS c FROM users WHERE role = 'customer'").get().c,
    total_connections: db.prepare('SELECT COUNT(*) AS c FROM connections').get().c,
    active_connections:db.prepare("SELECT COUNT(*) AS c FROM connections WHERE status = 'active'").get().c,
    pending_requests:  db.prepare("SELECT COUNT(*) AS c FROM service_requests WHERE status = 'pending'").get().c,
    open_complaints:   db.prepare("SELECT COUNT(*) AS c FROM complaints WHERE status = 'open'").get().c,
    unpaid_bills:      db.prepare("SELECT COUNT(*) AS c FROM bills WHERE status = 'unpaid'").get().c,
    overdue_bills:     db.prepare("SELECT COUNT(*) AS c FROM bills WHERE status = 'overdue'").get().c,
    total_revenue:     db.prepare("SELECT IFNULL(SUM(amount), 0) AS s FROM payments").get().s,
    monthly_revenue:   db.prepare(`
      SELECT IFNULL(SUM(amount), 0) AS s FROM payments
      WHERE strftime('%Y-%m', paid_at) = strftime('%Y-%m', 'now')
    `).get().s,
  };
  res.json({ success: true, stats });
};

// ── Users ─────────────────────────────────────────────────────────────────────
exports.getAllUsers = (req, res) => {
  const db   = getDB();
  const { search } = req.query;
  let query  = 'SELECT id, name, email, phone, role, address, created_at FROM users';
  const params = [];

  if (search) {
    query += ' WHERE name LIKE ? OR email LIKE ?';
    params.push(`%${search}%`, `%${search}%`);
  }

  query += ' ORDER BY created_at DESC';
  const rows = db.prepare(query).all(...params);
  res.json({ success: true, users: rows });
};

exports.updateUserRole = (req, res) => {
  const { role } = req.body;
  if (!['customer', 'admin'].includes(role)) {
    return res.status(400).json({ success: false, message: "role must be 'customer' or 'admin'" });
  }
  const db = getDB();
  db.prepare('UPDATE users SET role = ? WHERE id = ?').run(role, req.params.id);
  res.json({ success: true, message: 'User role updated' });
};

// ── Connections ───────────────────────────────────────────────────────────────
exports.getAllConnections = (_req, res) => {
  const db   = getDB();
  const rows = db.prepare(`
    SELECT c.*, u.name AS user_name, u.email AS user_email, u.phone AS user_phone
    FROM   connections c
    JOIN   users u ON u.id = c.user_id
    ORDER  BY c.created_at DESC
  `).all();
  res.json({ success: true, connections: rows });
};

exports.updateConnectionStatus = (req, res) => {
  const { status } = req.body;
  const valid = ['pending', 'active', 'inactive', 'suspended', 'rejected'];
  if (!valid.includes(status)) {
    return res.status(400).json({ success: false, message: `status must be one of: ${valid.join(', ')}` });
  }

  const db   = getDB();
  const conn = db.prepare('SELECT * FROM connections WHERE id = ?').get(req.params.id);
  if (!conn) return res.status(404).json({ success: false, message: 'Connection not found' });

  db.prepare('UPDATE connections SET status = ? WHERE id = ?').run(status, req.params.id);

  // Notify customer
  const notifId = uuid();
  db.prepare(`
    INSERT INTO notifications (id, user_id, title, message, type)
    VALUES (?, ?, 'Connection Status Updated', ?, 'info')
  `).run(notifId, conn.user_id,
    `Your gas connection (${conn.consumer_number}) status has been updated to: ${status}.`);

  res.json({ success: true, message: 'Connection status updated' });
};

// ── Service Requests ──────────────────────────────────────────────────────────
exports.getAllServiceRequests = (req, res) => {
  const { status } = req.query;
  const db = getDB();

  let query  = `
    SELECT sr.*, u.name AS user_name, u.email AS user_email
    FROM   service_requests sr
    JOIN   users u ON u.id = sr.user_id
  `;
  const params = [];

  if (status) {
    query += ' WHERE sr.status = ?';
    params.push(status);
  }

  query += ' ORDER BY sr.created_at DESC';
  const rows = db.prepare(query).all(...params);
  res.json({ success: true, requests: rows });
};

exports.updateServiceRequest = (req, res) => {
  const { status, assigned_to, scheduled_date } = req.body;
  const db          = getDB();
  const sr          = db.prepare('SELECT * FROM service_requests WHERE id = ?').get(req.params.id);
  if (!sr) return res.status(404).json({ success: false, message: 'Request not found' });

  const resolved_at = status === 'completed' ? new Date().toISOString() : null;

  db.prepare(`
    UPDATE service_requests
    SET status = ?, assigned_to = ?, scheduled_date = ?, resolved_at = ?
    WHERE id = ?
  `).run(status || sr.status, assigned_to || sr.assigned_to,
          scheduled_date || sr.scheduled_date, resolved_at, req.params.id);

  // Notify user if status changed
  if (status && status !== sr.status) {
    const notifId = uuid();
    db.prepare(`
      INSERT INTO notifications (id, user_id, title, message, type)
      VALUES (?, ?, 'Service Request Updated', ?, 'info')
    `).run(notifId, sr.user_id,
      `Your service request (${sr.service_type.replace(/_/g, ' ')}) status changed to: ${status}.`);
  }

  res.json({ success: true, message: 'Service request updated' });
};

// ── Complaints ────────────────────────────────────────────────────────────────
exports.getAllComplaints = (req, res) => {
  const { status } = req.query;
  const db = getDB();

  let query = `
    SELECT c.*, u.name AS user_name, u.email AS user_email
    FROM   complaints c
    JOIN   users u ON u.id = c.user_id
  `;
  const params = [];

  if (status) {
    query += ' WHERE c.status = ?';
    params.push(status);
  }

  query += ' ORDER BY c.created_at DESC';
  const rows = db.prepare(query).all(...params);
  res.json({ success: true, complaints: rows });
};

exports.resolveComplaint = (req, res) => {
  const { response, status } = req.body;
  const db = getDB();
  const c  = db.prepare('SELECT * FROM complaints WHERE id = ?').get(req.params.id);
  if (!c) return res.status(404).json({ success: false, message: 'Complaint not found' });

  const newStatus   = status || 'resolved';
  const resolved_at = newStatus === 'resolved' || newStatus === 'closed'
    ? new Date().toISOString() : null;

  db.prepare(`
    UPDATE complaints
    SET status = ?, response = ?, resolved_at = ?
    WHERE id = ?
  `).run(newStatus, response || null, resolved_at, req.params.id);

  // Notify customer
  const notifId = uuid();
  db.prepare(`
    INSERT INTO notifications (id, user_id, title, message, type)
    VALUES (?, ?, 'Complaint Update', ?, 'info')
  `).run(notifId, c.user_id,
    `Your complaint "${c.subject}" has been updated to: ${newStatus}.${response ? ' Response: ' + response : ''}`);

  res.json({ success: true, message: 'Complaint updated' });
};

// ── Billing ───────────────────────────────────────────────────────────────────
exports.getAllBills = (_req, res) => {
  const db   = getDB();
  const rows = db.prepare(`
    SELECT b.*, u.name AS user_name, u.email AS user_email, c.consumer_number
    FROM   bills b
    JOIN   users u ON u.id = b.user_id
    JOIN   connections c ON c.id = b.connection_id
    ORDER  BY b.created_at DESC
  `).all();
  res.json({ success: true, bills: rows });
};

exports.generateBill = (req, res) => {
  const { connection_id, billing_period, units_consumed, amount, due_date } = req.body;

  if (!connection_id || !billing_period || !amount || !due_date) {
    return res.status(400).json({ success: false, message: 'connection_id, billing_period, amount and due_date are required' });
  }

  const db   = getDB();
  const conn = db.prepare('SELECT * FROM connections WHERE id = ?').get(connection_id);
  if (!conn) return res.status(404).json({ success: false, message: 'Connection not found' });

  // Check for duplicate bill in same period
  const dup = db.prepare(
    'SELECT id FROM bills WHERE connection_id = ? AND billing_period = ?'
  ).get(connection_id, billing_period);
  if (dup) {
    return res.status(409).json({ success: false, message: 'Bill for this period already exists' });
  }

  const id          = uuid();
  const bill_number = 'BILL-' + Date.now();

  db.prepare(`
    INSERT INTO bills (id, connection_id, user_id, bill_number, billing_period, units_consumed, amount, due_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, connection_id, conn.user_id, bill_number,
         billing_period, units_consumed || 0, amount, due_date);

  // Notify customer
  const notifId = uuid();
  db.prepare(`
    INSERT INTO notifications (id, user_id, title, message, type)
    VALUES (?, ?, 'New Bill Generated', ?, 'warning')
  `).run(notifId, conn.user_id,
    `Your gas bill for ${billing_period} amounting ₹${amount} is due on ${due_date}. Bill No: ${bill_number}`);

  res.status(201).json({ success: true, message: 'Bill generated successfully', bill_number, id });
};

exports.markBillOverdue = (req, res) => {
  const db = getDB();
  const result = db.prepare(`
    UPDATE bills SET status = 'overdue'
    WHERE status = 'unpaid' AND due_date < date('now')
  `).run();
  res.json({ success: true, message: `${result.changes} bill(s) marked as overdue` });
};

// ── Broadcast Notification ────────────────────────────────────────────────────
exports.broadcastNotification = (req, res) => {
  const { title, message, type } = req.body;
  if (!title || !message) {
    return res.status(400).json({ success: false, message: 'title and message are required' });
  }

  const db    = getDB();
  const users = db.prepare("SELECT id FROM users WHERE role = 'customer'").all();

  const insertNotif = db.prepare(`
    INSERT INTO notifications (id, user_id, title, message, type)
    VALUES (?, ?, ?, ?, ?)
  `);

  const insertMany = db.transaction((users) => {
    for (const u of users) {
      insertNotif.run(uuid(), u.id, title, message, type || 'info');
    }
  });

  insertMany(users);
  res.json({ success: true, message: `Notification sent to ${users.length} users` });
};
