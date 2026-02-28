const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/divisions — list all divisions
router.get('/divisions', (req, res) => {
  const divisions = db.prepare(`SELECT name FROM divisions ORDER BY name`).all();
  res.json({ success: true, data: divisions.map(d => d.name) });
});

// GET /api/stats — dashboard stats (admin)
router.get('/stats', (req, res) => {
  const totalConsumers = db.prepare(`SELECT COUNT(*) as c FROM consumers`).get().c;
  const totalBills = db.prepare(`SELECT COUNT(*) as c FROM bills`).get().c;
  const unpaidBills = db.prepare(`SELECT COUNT(*) as c FROM bills WHERE status = 'UNPAID'`).get().c;
  const totalCollected = db.prepare(`SELECT COALESCE(SUM(amount_paid), 0) as s FROM payments WHERE status = 'SUCCESS'`).get().s;
  const todayPayments = db.prepare(`SELECT COUNT(*) as c FROM payments WHERE status = 'SUCCESS' AND date(paid_at) = date('now')`).get().c;

  res.json({
    success: true, data: {
      total_consumers: totalConsumers,
      total_bills: totalBills,
      unpaid_bills: unpaidBills,
      total_collected: totalCollected,
      today_payments: todayPayments
    }
  });
});

// GET /api/health
router.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'UP',
    service: 'APDCL Bill Payment API',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
