// src/controllers/alertsController.js
const { getDb } = require('../db/init');

// GET /alerts/:consumerId
function getAlerts(req, res) {
  const db = getDb();
  const consumer = getConsumerOrFail(db, req.params.consumerId, res);
  if (!consumer) return;

  const unreadOnly = req.query.unread === 'true';
  let query = `SELECT * FROM alerts WHERE consumer_id = ?`;
  if (unreadOnly) query += ` AND is_read = 0`;
  query += ` ORDER BY alert_time DESC`;

  const alerts = db.prepare(query).all(consumer.consumer_id);
  res.json({ success: true, data: alerts, unread_count: alerts.filter(a => !a.is_read).length });
}

// PATCH /alerts/:consumerId/:alertId/read
function markRead(req, res) {
  const db = getDb();
  const consumer = getConsumerOrFail(db, req.params.consumerId, res);
  if (!consumer) return;

  const { alertId } = req.params;
  const info = db.prepare(`
    UPDATE alerts SET is_read = 1 WHERE id = ? AND consumer_id = ?
  `).run(alertId, consumer.consumer_id);

  if (info.changes === 0) return res.status(404).json({ success: false, message: 'Alert not found' });
  res.json({ success: true, message: 'Alert marked as read' });
}

// PATCH /alerts/:consumerId/read-all
function markAllRead(req, res) {
  const db = getDb();
  const consumer = getConsumerOrFail(db, req.params.consumerId, res);
  if (!consumer) return;

  db.prepare(`UPDATE alerts SET is_read = 1 WHERE consumer_id = ?`).run(consumer.consumer_id);
  res.json({ success: true, message: 'All alerts marked as read' });
}

// POST /alerts/:consumerId  (create alert — for internal/admin use)
function createAlert(req, res) {
  const db = getDb();
  const consumer = getConsumerOrFail(db, req.params.consumerId, res);
  if (!consumer) return;

  const { type, severity, title, message } = req.body;
  if (!type || !title || !message) {
    return res.status(400).json({ success: false, message: 'type, title, and message are required' });
  }

  const info = db.prepare(`
    INSERT INTO alerts (consumer_id, type, severity, title, message)
    VALUES (?, ?, ?, ?, ?)
  `).run(consumer.consumer_id, type, severity || 'info', title, message);

  res.status(201).json({ success: true, data: { id: info.lastInsertRowid } });
}

function getConsumerOrFail(db, consumerId, res) {
  const consumer = db.prepare(
    `SELECT * FROM consumers WHERE consumer_id = ? OR meter_no = ?`
  ).get(consumerId, consumerId);
  if (!consumer) { res.status(404).json({ success: false, message: 'Consumer not found' }); return null; }
  return consumer;
}

module.exports = { getAlerts, markRead, markAllRead, createAlert };
