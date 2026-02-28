// src/controllers/billingController.js
const { getDb } = require('../db/init');

// GET /billing/:consumerId/current
function getCurrentBill(req, res) {
  const db = getDb();
  const consumer = getConsumerOrFail(db, req.params.consumerId, res);
  if (!consumer) return;

  const bill = db.prepare(`
    SELECT * FROM monthly_consumption
    WHERE consumer_id = ?
    ORDER BY billing_period DESC LIMIT 1
  `).get(consumer.consumer_id);

  if (!bill) return res.status(404).json({ success: false, message: 'No bill found' });

  res.json({ success: true, data: { ...bill, period_label: formatMonthLabel(bill.billing_period) } });
}

// GET /billing/:consumerId/all
function getAllBills(req, res) {
  const db = getDb();
  const consumer = getConsumerOrFail(db, req.params.consumerId, res);
  if (!consumer) return;

  const bills = db.prepare(`
    SELECT * FROM monthly_consumption
    WHERE consumer_id = ?
    ORDER BY billing_period DESC
  `).all(consumer.consumer_id);

  res.json({
    success: true,
    data: bills.map(b => ({ ...b, period_label: formatMonthLabel(b.billing_period) })),
  });
}

// POST /billing/:consumerId/pay
function payBill(req, res) {
  const db = getDb();
  const consumer = getConsumerOrFail(db, req.params.consumerId, res);
  if (!consumer) return;

  const { billing_period, amount, payment_mode, transaction_ref } = req.body;
  if (!billing_period || !amount) {
    return res.status(400).json({ success: false, message: 'billing_period and amount are required' });
  }

  const bill = db.prepare(`
    SELECT * FROM monthly_consumption WHERE consumer_id = ? AND billing_period = ?
  `).get(consumer.consumer_id, billing_period);

  if (!bill) return res.status(404).json({ success: false, message: 'Bill not found for that period' });
  if (bill.status === 'paid') return res.status(400).json({ success: false, message: 'Bill already paid' });

  const now = new Date().toISOString().replace('T', ' ').slice(0, 19);

  db.prepare(`
    UPDATE monthly_consumption
    SET status = 'paid', paid_at = ? WHERE consumer_id = ? AND billing_period = ?
  `).run(now, consumer.consumer_id, billing_period);

  const txRef = transaction_ref || `TXN${Date.now()}`;
  db.prepare(`
    INSERT INTO payments (consumer_id, billing_period, amount, payment_mode, transaction_ref, paid_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(consumer.consumer_id, billing_period, amount, payment_mode || 'online', txRef, now);

  res.json({
    success: true,
    message: 'Payment recorded successfully',
    data: { transaction_ref: txRef, paid_at: now },
  });
}

// GET /billing/:consumerId/payments
function getPaymentHistory(req, res) {
  const db = getDb();
  const consumer = getConsumerOrFail(db, req.params.consumerId, res);
  if (!consumer) return;

  const payments = db.prepare(`
    SELECT * FROM payments WHERE consumer_id = ? ORDER BY paid_at DESC
  `).all(consumer.consumer_id);

  res.json({ success: true, data: payments });
}

function getConsumerOrFail(db, consumerId, res) {
  const consumer = db.prepare(
    `SELECT * FROM consumers WHERE consumer_id = ? OR meter_no = ?`
  ).get(consumerId, consumerId);
  if (!consumer) { res.status(404).json({ success: false, message: 'Consumer not found' }); return null; }
  return consumer;
}

function formatMonthLabel(period) {
  const [y, m] = period.split('-');
  return new Date(parseInt(y), parseInt(m) - 1, 1).toLocaleString('en-IN', { month: 'long', year: 'numeric' });
}

module.exports = { getCurrentBill, getAllBills, payBill, getPaymentHistory };
