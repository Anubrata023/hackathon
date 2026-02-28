// src/controllers/platformController.js
const { getDb } = require('../db/init');

// GET /platform/stats
function getPlatformStats(req, res) {
  const db = getDb();
  const rows = db.prepare(`SELECT stat_key, stat_value FROM platform_stats`).all();
  const stats = {};
  for (const r of rows) stats[r.stat_key] = r.stat_value;
  res.json({ success: true, data: stats });
}

// GET /platform/health
function getHealth(req, res) {
  res.json({
    success: true,
    status: 'ok',
    service: 'APDCL Smart Meter API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
}

module.exports = { getPlatformStats, getHealth };
