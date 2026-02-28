// src/controllers/consumptionController.js
const { getDb } = require('../db/init');

// GET /consumption/:consumerId/daily?month=2026-02
function getDailyConsumption(req, res) {
  const db = getDb();
  const { consumerId } = req.params;
  const month = req.query.month || getCurrentMonth();

  const consumer = getConsumerOrFail(db, consumerId, res);
  if (!consumer) return;

  const rows = db.prepare(`
    SELECT date, units_kwh
    FROM daily_consumption
    WHERE consumer_id = ? AND date LIKE ?
    ORDER BY date ASC
  `).all(consumer.consumer_id, `${month}%`);

  const values = rows.map(r => r.units_kwh);
  const avg = values.length ? parseFloat((values.reduce((a, b) => a + b, 0) / values.length).toFixed(2)) : 0;
  const peak = values.length ? Math.max(...values) : 0;

  res.json({
    success: true,
    data: {
      period: month,
      labels: rows.map(r => r.date.split('-')[2]),   // day number
      values,
      avg,
      peak,
      unit: 'kWh',
    },
  });
}

// GET /consumption/:consumerId/weekly?month=2026-02
function getWeeklyConsumption(req, res) {
  const db = getDb();
  const { consumerId } = req.params;
  const month = req.query.month || getCurrentMonth();

  const consumer = getConsumerOrFail(db, consumerId, res);
  if (!consumer) return;

  const rows = db.prepare(`
    SELECT date, units_kwh
    FROM daily_consumption
    WHERE consumer_id = ? AND date LIKE ?
    ORDER BY date ASC
  `).all(consumer.consumer_id, `${month}%`);

  // Group into 4 weeks
  const weeks = [0, 0, 0, 0];
  rows.forEach(r => {
    const day = parseInt(r.date.split('-')[2], 10);
    const wk = Math.min(Math.floor((day - 1) / 7), 3);
    weeks[wk] += r.units_kwh;
  });
  const rounded = weeks.map(v => parseFloat(v.toFixed(1)));
  const avg = parseFloat((rounded.reduce((a, b) => a + b, 0) / rounded.filter(v => v > 0).length || 1).toFixed(1));

  res.json({
    success: true,
    data: {
      period: month,
      labels: ['Wk 1', 'Wk 2', 'Wk 3', 'Wk 4'],
      values: rounded,
      avg,
      unit: 'kWh',
    },
  });
}

// GET /consumption/:consumerId/monthly?count=6
function getMonthlyConsumption(req, res) {
  const db = getDb();
  const { consumerId } = req.params;
  const count = parseInt(req.query.count, 10) || 6;

  const consumer = getConsumerOrFail(db, consumerId, res);
  if (!consumer) return;

  const rows = db.prepare(`
    SELECT billing_period, units_kwh, amount_inr, status
    FROM monthly_consumption
    WHERE consumer_id = ?
    ORDER BY billing_period DESC
    LIMIT ?
  `).all(consumer.consumer_id, count);

  const reversed = [...rows].reverse();
  const values = reversed.map(r => r.units_kwh);
  const avg = values.length ? parseFloat((values.reduce((a, b) => a + b, 0) / values.length).toFixed(1)) : 0;

  res.json({
    success: true,
    data: {
      labels: reversed.map(r => formatMonthLabel(r.billing_period)),
      values,
      avg,
      unit: 'kWh',
      records: reversed,
    },
  });
}

// GET /consumption/:consumerId/summary  (KPI cards)
function getConsumptionSummary(req, res) {
  const db = getDb();
  const { consumerId } = req.params;

  const consumer = getConsumerOrFail(db, consumerId, res);
  if (!consumer) return;

  // Current month bill
  const currentBill = db.prepare(`
    SELECT * FROM monthly_consumption
    WHERE consumer_id = ? ORDER BY billing_period DESC LIMIT 1
  `).get(consumer.consumer_id);

  // Previous month for comparison
  const prevBill = db.prepare(`
    SELECT units_kwh FROM monthly_consumption
    WHERE consumer_id = ? ORDER BY billing_period DESC LIMIT 1 OFFSET 1
  `).get(consumer.consumer_id);

  // Daily average this month
  const dailyRows = db.prepare(`
    SELECT units_kwh FROM daily_consumption
    WHERE consumer_id = ? AND date LIKE ?
  `).all(consumer.consumer_id, `${currentBill?.billing_period || getCurrentMonth()}%`);

  const dailyAvg = dailyRows.length
    ? parseFloat((dailyRows.reduce((a, r) => a + r.units_kwh, 0) / dailyRows.length).toFixed(2))
    : 0;

  // Peak day
  const peakDay = db.prepare(`
    SELECT date, units_kwh FROM daily_consumption
    WHERE consumer_id = ? AND date LIKE ?
    ORDER BY units_kwh DESC LIMIT 1
  `).get(consumer.consumer_id, `${currentBill?.billing_period || getCurrentMonth()}%`);

  // % change
  const unitsChange = prevBill && currentBill
    ? parseFloat((((currentBill.units_kwh - prevBill.units_kwh) / prevBill.units_kwh) * 100).toFixed(1))
    : 0;

  res.json({
    success: true,
    data: {
      current_month_units: currentBill?.units_kwh || 0,
      current_month_change_pct: unitsChange,
      current_bill_amount: currentBill?.amount_inr || 0,
      current_bill_due: currentBill?.due_date || null,
      current_bill_status: currentBill?.status || 'pending',
      daily_avg_kwh: dailyAvg,
      peak_day_kwh: peakDay?.units_kwh || 0,
      peak_day_date: peakDay?.date || null,
    },
  });
}

// GET /consumption/:consumerId/history?limit=12
function getConsumptionHistory(req, res) {
  const db = getDb();
  const { consumerId } = req.params;
  const limit = parseInt(req.query.limit, 10) || 12;

  const consumer = getConsumerOrFail(db, consumerId, res);
  if (!consumer) return;

  const rows = db.prepare(`
    SELECT billing_period, units_kwh, amount_inr, status, due_date, paid_at
    FROM monthly_consumption
    WHERE consumer_id = ?
    ORDER BY billing_period DESC
    LIMIT ?
  `).all(consumer.consumer_id, limit);

  const maxUnits = rows.length ? Math.max(...rows.map(r => r.units_kwh)) : 1;

  const enriched = rows.map(r => ({
    ...r,
    period_label: formatMonthLabel(r.billing_period),
    bar_pct: Math.round((r.units_kwh / maxUnits) * 100),
  }));

  res.json({ success: true, data: enriched });
}

// ── Helpers ──────────────────────────────────────
function getConsumerOrFail(db, consumerId, res) {
  const consumer = db.prepare(
    `SELECT * FROM consumers WHERE consumer_id = ? OR meter_no = ?`
  ).get(consumerId, consumerId);

  if (!consumer) {
    res.status(404).json({ success: false, message: 'Consumer not found' });
    return null;
  }
  return consumer;
}

function getCurrentMonth() {
  return new Date().toISOString().slice(0, 7);
}

function formatMonthLabel(period) {
  const [y, m] = period.split('-');
  const d = new Date(parseInt(y), parseInt(m) - 1, 1);
  return d.toLocaleString('en-IN', { month: 'short', year: 'numeric' });
}

module.exports = {
  getDailyConsumption,
  getWeeklyConsumption,
  getMonthlyConsumption,
  getConsumptionSummary,
  getConsumptionHistory,
};
