// src/controllers/consumerController.js
const { getDb } = require('../db/init');

// GET /consumers/:consumerId
function getConsumer(req, res) {
  const db = getDb();
  const { consumerId } = req.params;

  const consumer = db.prepare(`
    SELECT * FROM consumers WHERE consumer_id = ? OR meter_no = ?
  `).get(consumerId, consumerId);

  if (!consumer) {
    return res.status(404).json({ success: false, message: 'Consumer not found' });
  }

  // Latest meter reading
  const latestReading = db.prepare(`
    SELECT reading_kwh, recorded_at FROM meter_readings
    WHERE consumer_id = ? ORDER BY recorded_at DESC LIMIT 1
  `).get(consumer.consumer_id);

  return res.json({
    success: true,
    data: {
      ...consumer,
      latest_reading: latestReading || null,
    },
  });
}

// GET /consumers  (list all, for admin/testing)
function listConsumers(req, res) {
  const db = getDb();
  const consumers = db.prepare(`SELECT consumer_id, name, zone, division, meter_no, status FROM consumers`).all();
  res.json({ success: true, data: consumers });
}

module.exports = { getConsumer, listConsumers };
