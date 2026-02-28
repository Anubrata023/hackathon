// src/controllers/complaintsController.js
const { getDb } = require('../db/init');

// GET /complaints/:consumerId
function getComplaints(req, res) {
  const db = getDb();
  const consumer = getConsumerOrFail(db, req.params.consumerId, res);
  if (!consumer) return;

  const complaints = db.prepare(`
    SELECT * FROM complaints WHERE consumer_id = ? ORDER BY submitted_at DESC
  `).all(consumer.consumer_id);

  res.json({ success: true, data: complaints });
}

// POST /complaints/:consumerId
function raiseComplaint(req, res) {
  const db = getDb();
  const consumer = getConsumerOrFail(db, req.params.consumerId, res);
  if (!consumer) return;

  const { subject, description, category } = req.body;
  if (!subject || !description) {
    return res.status(400).json({ success: false, message: 'subject and description are required' });
  }

  const info = db.prepare(`
    INSERT INTO complaints (consumer_id, subject, description, category)
    VALUES (?, ?, ?, ?)
  `).run(consumer.consumer_id, subject, description, category || 'general');

  res.status(201).json({
    success: true,
    message: 'Complaint submitted successfully',
    data: { id: info.lastInsertRowid, complaint_id: `CMP-${info.lastInsertRowid.toString().padStart(6, '0')}` },
  });
}

// PATCH /complaints/:consumerId/:complaintId/status
function updateComplaintStatus(req, res) {
  const db = getDb();
  const consumer = getConsumerOrFail(db, req.params.consumerId, res);
  if (!consumer) return;

  const { status } = req.body;
  const validStatuses = ['open', 'in_progress', 'resolved', 'closed'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ success: false, message: `Status must be one of: ${validStatuses.join(', ')}` });
  }

  const resolved_at = status === 'resolved' ? new Date().toISOString().replace('T', ' ').slice(0, 19) : null;
  const info = db.prepare(`
    UPDATE complaints SET status = ?, resolved_at = ? WHERE id = ? AND consumer_id = ?
  `).run(status, resolved_at, req.params.complaintId, consumer.consumer_id);

  if (info.changes === 0) return res.status(404).json({ success: false, message: 'Complaint not found' });
  res.json({ success: true, message: 'Complaint status updated' });
}

function getConsumerOrFail(db, consumerId, res) {
  const consumer = db.prepare(
    `SELECT * FROM consumers WHERE consumer_id = ? OR meter_no = ?`
  ).get(consumerId, consumerId);
  if (!consumer) { res.status(404).json({ success: false, message: 'Consumer not found' }); return null; }
  return consumer;
}

module.exports = { getComplaints, raiseComplaint, updateComplaintStatus };
