const { v4: uuid } = require('uuid');
const { getDB }    = require('../database/db');

// ── Get all bills for logged-in user ──────────────────────────────────────────
exports.getMyBills = (req, res) => {
  const { status } = req.query;
  const db = getDB();

  let query  = 'SELECT * FROM bills WHERE user_id = ?';
  const params = [req.user.id];

  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }

  query += ' ORDER BY created_at DESC';
  const rows = db.prepare(query).all(...params);
  res.json({ success: true, bills: rows });
};

// ── Get single bill ───────────────────────────────────────────────────────────
exports.getBillById = (req, res) => {
  const db  = getDB();
  const row = db.prepare(
    'SELECT * FROM bills WHERE id = ? AND user_id = ?'
  ).get(req.params.id, req.user.id);

  if (!row) return res.status(404).json({ success: false, message: 'Bill not found' });
  res.json({ success: true, bill: row });
};

// ── Pay a bill ────────────────────────────────────────────────────────────────
exports.payBill = (req, res) => {
  const { payment_method, transaction_ref } = req.body;
  const db   = getDB();
  const bill = db.prepare(
    'SELECT * FROM bills WHERE id = ? AND user_id = ?'
  ).get(req.params.id, req.user.id);

  if (!bill) return res.status(404).json({ success: false, message: 'Bill not found' });
  if (bill.status === 'paid') {
    return res.status(400).json({ success: false, message: 'Bill is already paid' });
  }

  const payId = uuid();
  db.prepare(`
    INSERT INTO payments (id, bill_id, user_id, amount, payment_method, transaction_ref)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(payId, bill.id, req.user.id, bill.amount,
         payment_method || 'online', transaction_ref || null);

  db.prepare("UPDATE bills SET status = 'paid' WHERE id = ?").run(bill.id);

  // Notify user
  const notifId = uuid();
  db.prepare(`
    INSERT INTO notifications (id, user_id, title, message, type)
    VALUES (?, ?, 'Payment Successful', ?, 'success')
  `).run(notifId, req.user.id,
    `Payment of ₹${bill.amount} for bill #${bill.bill_number} (${bill.billing_period}) received. Thank you!`);

  res.json({
    success: true,
    message: 'Payment recorded successfully',
    payment_id: payId,
  });
};

// ── Get payment history ───────────────────────────────────────────────────────
exports.getPaymentHistory = (req, res) => {
  const db   = getDB();
  const rows = db.prepare(`
    SELECT p.*, b.bill_number, b.billing_period, b.amount AS bill_amount
    FROM   payments p
    JOIN   bills    b ON b.id = p.bill_id
    WHERE  p.user_id = ?
    ORDER  BY p.paid_at DESC
  `).all(req.user.id);
  res.json({ success: true, payments: rows });
};
