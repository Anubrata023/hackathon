// src/controllers/meterController.js
const { getDb } = require('../db/init');

// GET /meter/:consumerId/readings?hours=24
function getMeterReadings(req, res) {
  const db = getDb();
  const consumer = getConsumerOrFail(db, req.params.consumerId, res);
  if (!consumer) return;

  const hours = parseInt(req.query.hours, 10) || 24;

  const readings = db.prepare(`
    SELECT reading_kwh, recorded_at FROM meter_readings
    WHERE consumer_id = ?
    AND recorded_at >= datetime('now', '-' || ? || ' hours')
    ORDER BY recorded_at ASC
  `).all(consumer.consumer_id, hours);

  const latest = readings.length ? readings[readings.length - 1] : null;

  res.json({
    success: true,
    data: {
      meter_no: consumer.meter_no,
      latest_reading: latest?.reading_kwh || null,
      latest_at: latest?.recorded_at || null,
      is_live: true,
      readings,
    },
  });
}

// POST /meter/:consumerId/readings  (simulate meter push)
function pushMeterReading(req, res) {
  const db = getDb();
  const consumer = getConsumerOrFail(db, req.params.consumerId, res);
  if (!consumer) return;

  const { reading_kwh } = req.body;
  if (reading_kwh === undefined || isNaN(reading_kwh)) {
    return res.status(400).json({ success: false, message: 'reading_kwh is required' });
  }

  const info = db.prepare(`
    INSERT INTO meter_readings (consumer_id, reading_kwh) VALUES (?, ?)
  `).run(consumer.consumer_id, parseFloat(reading_kwh));

  res.status(201).json({ success: true, data: { id: info.lastInsertRowid, reading_kwh } });
}

function getConsumerOrFail(db, consumerId, res) {
  const consumer = db.prepare(
    `SELECT * FROM consumers WHERE consumer_id = ? OR meter_no = ?`
  ).get(consumerId, consumerId);
  if (!consumer) { res.status(404).json({ success: false, message: 'Consumer not found' }); return null; }
  return consumer;
}

module.exports = { getMeterReadings, pushMeterReading };
