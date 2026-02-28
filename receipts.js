// db/seed.js — Seed demo consumers, bills, and payment history
require('dotenv').config();
const { initDb, getDb } = require('./init');

initDb();
const db = getDb();

/* ── helpers ── */
function billNumber(n) { return `APDCL-BILL-26-${String(n).padStart(5,'0')}`; }
function txnRef(n)     { return `APDCL-TXN-26-${String(n).padStart(5,'0')}`; }
function rcptNo(n)     { return `APDCL-RCPT-26-${String(n).padStart(5,'0')}`; }

/* ── consumers ── */
const consumers = [
  {
    consumer_id:  'AS-2400-8271',
    name:         'Rajib Kumar Deka',
    mobile:       '+919876543210',
    email:        'rajib.deka@example.com',
    address:      'House No. 42, Paltan Bazar, Guwahati – 781008',
    meter_number: 'GHY-SM-00481',
    division:     'Guwahati Urban',
    tariff_slab:  7.25,
    fixed_charge: 250.00,
    duty_rate:    0.05,
  },
  {
    consumer_id:  'AS-1100-3391',
    name:         'Priya Sarma',
    mobile:       '+919988776655',
    email:        'priya.sarma@example.com',
    address:      'Lane 5, Dispur, Guwahati – 781006',
    meter_number: 'GHY-SM-00120',
    division:     'Dispur',
    tariff_slab:  7.25,
    fixed_charge: 250.00,
    duty_rate:    0.05,
  },
  {
    consumer_id:  'AS-3300-7741',
    name:         'Bikram Borah',
    mobile:       '+919123456789',
    email:        'bikram.borah@example.com',
    address:      'AT Road, Jorhat – 785001',
    meter_number: 'JOR-SM-00205',
    division:     'Jorhat',
    tariff_slab:  6.50,
    fixed_charge: 200.00,
    duty_rate:    0.05,
  },
];

/* ── insert consumers ── */
const insertConsumer = db.prepare(`
  INSERT OR IGNORE INTO consumers
    (consumer_id, name, mobile, email, address, meter_number, division, tariff_slab, fixed_charge, duty_rate)
  VALUES
    (@consumer_id, @name, @mobile, @email, @address, @meter_number, @division, @tariff_slab, @fixed_charge, @duty_rate)
`);

consumers.forEach(c => insertConsumer.run(c));
console.log('✅  Consumers seeded');

/* ── historical bills + transactions for Rajib ── */
const historicalBills = [
  { month: 'October 2025',  from: '2025-10-01', to: '2025-10-31', units: 210, paidDate: '2025-11-09', method: 'UPI',         detail: 'GPay',      txnId: 1, billId: 1, amount: 1628 },
  { month: 'November 2025', from: '2025-11-01', to: '2025-11-30', units: 226, paidDate: '2025-12-08', method: 'CARD',        detail: 'Debit Card', txnId: 2, billId: 2, amount: 1764 },
  { month: 'December 2025', from: '2025-12-01', to: '2025-12-31', units: 318, paidDate: '2026-01-10', method: 'NET_BANKING', detail: 'SBI',        txnId: 3, billId: 3, amount: 2480 },
  { month: 'January 2026',  from: '2026-01-01', to: '2026-01-31', units: 272, paidDate: '2026-02-12', method: 'UPI',         detail: 'GPay',       txnId: 4, billId: 4, amount: 2124 },
];

const insertBill = db.prepare(`
  INSERT OR IGNORE INTO bills
    (id, bill_number, consumer_id, billing_period, period_from, period_to,
     units_consumed, energy_charges, fixed_charge, electricity_duty, arrears, subsidy, total_amount, due_date, status, paid_amount)
  VALUES
    (@id, @bill_number, @consumer_id, @billing_period, @period_from, @period_to,
     @units_consumed, @energy_charges, @fixed_charge, @electricity_duty, @arrears, @subsidy, @total_amount, @due_date, @status, @paid_amount)
`);

const insertTxn = db.prepare(`
  INSERT OR IGNORE INTO transactions
    (id, txn_ref, bill_id, consumer_id, amount, payment_method, payment_detail, gateway_ref, status, initiated_at, completed_at)
  VALUES
    (@id, @txn_ref, @bill_id, @consumer_id, @amount, @payment_method, @payment_detail, @gateway_ref, 'SUCCESS', @initiated_at, @completed_at)
`);

const insertReceipt = db.prepare(`
  INSERT OR IGNORE INTO receipts
    (id, receipt_no, txn_id, consumer_id, bill_id, issued_at, receipt_data)
  VALUES
    (@id, @receipt_no, @txn_id, @consumer_id, @bill_id, @issued_at, @receipt_data)
`);

historicalBills.forEach((h, i) => {
  const energy   = Math.round(h.units * 7.25 * 100) / 100;
  const fixed    = 250;
  const duty     = Math.round(energy * 0.05 * 100) / 100;
  const total    = h.amount;
  const dueDate  = new Date(h.to);
  dueDate.setDate(dueDate.getDate() + 15);

  insertBill.run({
    id: h.billId,
    bill_number:      billNumber(h.billId),
    consumer_id:      'AS-2400-8271',
    billing_period:   h.month,
    period_from:      h.from,
    period_to:        h.to,
    units_consumed:   h.units,
    energy_charges:   energy,
    fixed_charge:     fixed,
    electricity_duty: duty,
    arrears:          0,
    subsidy:          0,
    total_amount:     total,
    due_date:         dueDate.toISOString().slice(0,10),
    status:           'PAID',
    paid_amount:      total,
  });

  insertTxn.run({
    id:              h.txnId,
    txn_ref:         txnRef(40000 + h.txnId),
    bill_id:         h.billId,
    consumer_id:     'AS-2400-8271',
    amount:          total,
    payment_method:  h.method,
    payment_detail:  h.detail,
    gateway_ref:     `GW-${Date.now()}-${h.txnId}`,
    initiated_at:    h.paidDate + ' 10:00:00',
    completed_at:    h.paidDate + ' 10:00:05',
  });

  const rcptData = JSON.stringify({
    receipt_no:     rcptNo(h.txnId),
    consumer_id:    'AS-2400-8271',
    consumer_name:  'Rajib Kumar Deka',
    bill_number:    billNumber(h.billId),
    billing_period: h.month,
    amount:         total,
    method:         h.method,
    txn_ref:        txnRef(40000 + h.txnId),
    paid_at:        h.paidDate,
  });

  insertReceipt.run({
    id:           h.txnId,
    receipt_no:   rcptNo(h.txnId),
    txn_id:       h.txnId,
    consumer_id:  'AS-2400-8271',
    bill_id:      h.billId,
    issued_at:    h.paidDate + ' 10:00:06',
    receipt_data: rcptData,
  });
});

console.log('✅  Historical bills & transactions seeded');

/* ── Current unpaid bill (Feb 2026) for Rajib ── */
const energy = Math.round(284 * 7.25 * 100) / 100;  // 2059 but UI shows 1926 — use UI values
insertBill.run({
  id:               5,
  bill_number:      billNumber(5),
  consumer_id:      'AS-2400-8271',
  billing_period:   'February 2026',
  period_from:      '2026-02-01',
  period_to:        '2026-02-28',
  units_consumed:   284,
  energy_charges:   1926.00,
  fixed_charge:     250.00,
  electricity_duty: 96.30,
  arrears:          0,
  subsidy:          0,
  total_amount:     2318.00,
  due_date:         '2026-03-15',
  status:           'UNPAID',
  paid_amount:      0,
});
console.log('✅  Current unpaid bill seeded (Feb 2026 · AS-2400-8271 · ₹2,318)');

/* ── Current unpaid bill for Priya ── */
insertBill.run({
  id:               6,
  bill_number:      billNumber(6),
  consumer_id:      'AS-1100-3391',
  billing_period:   'February 2026',
  period_from:      '2026-02-01',
  period_to:        '2026-02-28',
  units_consumed:   192,
  energy_charges:   1392.00,
  fixed_charge:     250.00,
  electricity_duty: 69.60,
  arrears:          0,
  subsidy:          0,
  total_amount:     1711.60,
  due_date:         '2026-03-15',
  status:           'UNPAID',
  paid_amount:      0,
});
console.log('✅  Current bill seeded for AS-1100-3391');

console.log('\n🎉  Seed complete! Start the server with: npm start');
