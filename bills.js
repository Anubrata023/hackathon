require('dotenv').config();
const db = require('./db');

console.log('🌱 Seeding database...');

// Divisions
const divisions = [
  'Guwahati Urban', 'Guwahati Rural', 'Dispur',
  'Jorhat', 'Dibrugarh', 'Silchar', 'Tezpur', 'Nagaon'
];
const insertDiv = db.prepare(`INSERT OR IGNORE INTO divisions (name) VALUES (?)`);
divisions.forEach(d => insertDiv.run(d));

// Sample consumers
const consumers = [
  {
    consumer_id: 'AS-2400-8271', name: 'Rajib Kumar Deka',
    meter_number: 'GHY-SM-00481', mobile: '+919876543210',
    email: 'rajib.deka@email.com', division: 'Guwahati Urban',
    address: '14, Paltan Bazar, Guwahati, Assam 781008'
  },
  {
    consumer_id: 'AS-1100-3344', name: 'Priya Borah',
    meter_number: 'GHY-SM-00992', mobile: '+919988776655',
    email: 'priya.borah@email.com', division: 'Dispur',
    address: '22, GS Road, Dispur, Guwahati 781006'
  },
  {
    consumer_id: 'AS-3300-5566', name: 'Akhil Sharma',
    meter_number: 'JHT-SM-00210', mobile: '+917011223344',
    email: 'akhil.sharma@email.com', division: 'Jorhat',
    address: '7, AT Road, Jorhat, Assam 785001'
  }
];
const insertConsumer = db.prepare(`
  INSERT OR IGNORE INTO consumers (consumer_id, name, meter_number, mobile, email, division, address)
  VALUES (@consumer_id, @name, @meter_number, @mobile, @email, @division, @address)
`);
consumers.forEach(c => insertConsumer.run(c));

// Sample bills
const bills = [
  // Rajib — February 2026 UNPAID
  {
    consumer_id: 'AS-2400-8271', bill_month: 'February 2026',
    billing_period: '1 Feb – 28 Feb 2026', units_consumed: 284,
    energy_charges: 1926.00, fixed_charges: 250.00,
    electricity_duty: 96.30, arrears: 0.00, subsidy: 0.00,
    total_payable: 2318.00, due_date: '2026-03-15', status: 'UNPAID'
  },
  // Rajib — January 2026 PAID
  {
    consumer_id: 'AS-2400-8271', bill_month: 'January 2026',
    billing_period: '1 Jan – 31 Jan 2026', units_consumed: 310,
    energy_charges: 2108.00, fixed_charges: 250.00,
    electricity_duty: 107.90, arrears: 0.00, subsidy: 0.00,
    total_payable: 2540.00, due_date: '2026-02-15', status: 'PAID'
  },
  // Rajib — December 2025 PAID
  {
    consumer_id: 'AS-2400-8271', bill_month: 'December 2025',
    billing_period: '1 Dec – 31 Dec 2025', units_consumed: 298,
    energy_charges: 2026.40, fixed_charges: 250.00,
    electricity_duty: 103.82, arrears: 0.00, subsidy: 0.00,
    total_payable: 2444.00, due_date: '2026-01-15', status: 'PAID'
  },
  // Priya — February 2026 UNPAID
  {
    consumer_id: 'AS-1100-3344', bill_month: 'February 2026',
    billing_period: '1 Feb – 28 Feb 2026', units_consumed: 195,
    energy_charges: 1326.00, fixed_charges: 250.00,
    electricity_duty: 66.30, arrears: 0.00, subsidy: 0.00,
    total_payable: 1642.00, due_date: '2026-03-15', status: 'UNPAID'
  },
  // Akhil — February 2026 UNPAID
  {
    consumer_id: 'AS-3300-5566', bill_month: 'February 2026',
    billing_period: '1 Feb – 28 Feb 2026', units_consumed: 420,
    energy_charges: 2856.00, fixed_charges: 250.00,
    electricity_duty: 145.80, arrears: 120.00, subsidy: 0.00,
    total_payable: 3371.80, due_date: '2026-03-15', status: 'UNPAID'
  }
];
const insertBill = db.prepare(`
  INSERT OR IGNORE INTO bills
    (consumer_id, bill_month, billing_period, units_consumed, energy_charges,
     fixed_charges, electricity_duty, arrears, subsidy, total_payable, due_date, status)
  VALUES
    (@consumer_id, @bill_month, @billing_period, @units_consumed, @energy_charges,
     @fixed_charges, @electricity_duty, @arrears, @subsidy, @total_payable, @due_date, @status)
`);
bills.forEach(b => insertBill.run(b));

// Payment history for Rajib
const historyRows = [
  {
    consumer_id: 'AS-2400-8271', bill_month: 'January 2026',
    amount_paid: 2540.00, payment_method: 'UPI',
    transaction_id: 'TXN-JAN26-001', status: 'PAID',
    paid_at: '2026-02-10 14:23:11'
  },
  {
    consumer_id: 'AS-2400-8271', bill_month: 'December 2025',
    amount_paid: 2444.00, payment_method: 'Net Banking',
    transaction_id: 'TXN-DEC25-001', status: 'PAID',
    paid_at: '2026-01-08 10:45:00'
  },
  {
    consumer_id: 'AS-2400-8271', bill_month: 'November 2025',
    amount_paid: 1988.00, payment_method: 'Debit/Credit Card',
    transaction_id: 'TXN-NOV25-001', status: 'PAID',
    paid_at: '2025-12-09 09:12:30'
  }
];
const insertHistory = db.prepare(`
  INSERT OR IGNORE INTO payment_history
    (consumer_id, bill_month, amount_paid, payment_method, transaction_id, status, paid_at)
  VALUES
    (@consumer_id, @bill_month, @amount_paid, @payment_method, @transaction_id, @status, @paid_at)
`);
historyRows.forEach(h => insertHistory.run(h));

console.log('✅ Seed complete!');
console.log('   Consumers:', db.prepare('SELECT COUNT(*) as c FROM consumers').get().c);
console.log('   Bills:', db.prepare('SELECT COUNT(*) as c FROM bills').get().c);
console.log('   Payment History:', db.prepare('SELECT COUNT(*) as c FROM payment_history').get().c);
