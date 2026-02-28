const express = require('express');
const router  = express.Router();
const db      = require('../database');
const { authenticate, isAdmin } = require('../middleware/auth');

function generateBillNumber() {
  return 'APDCL' + Date.now() + Math.floor(10 + Math.random() * 90);
}

// Calculate bill using slab-based tariffs from DB
function calculateBill(units, connectionType = 'domestic') {
  const slabs = db.prepare(
    'SELECT * FROM tariffs WHERE connection_type = ? AND is_active = 1 ORDER BY slab_from ASC'
  ).all(connectionType);

  if (!slabs.length) {
    // fallback flat rate
    return {
      energyCharges: parseFloat((units * 5.0).toFixed(2)),
      fixedCharge: 50,
      fuelAdjustment: parseFloat((units * 0.10).toFixed(2)),
      taxes: parseFloat((units * 5.0 * 0.05).toFixed(2)),
      total: parseFloat((units * 5.0 * 1.05 + 50 + units * 0.10).toFixed(2))
    };
  }

  let energyCharges  = 0;
  let fixedCharge    = slabs[0].fixed_charge;
  let remaining      = units;

  for (const slab of slabs) {
    const slabMax     = slab.slab_to ? slab.slab_to - slab.slab_from + 1 : Infinity;
    const unitsInSlab = Math.min(remaining, slabMax);
    energyCharges    += unitsInSlab * slab.rate_per_unit;
    fixedCharge       = slab.fixed_charge; // last matched slab's fixed charge
    remaining        -= unitsInSlab;
    if (remaining <= 0) break;
  }

  const fuelAdjustment = parseFloat((units * 0.10).toFixed(2));
  const taxes          = parseFloat(((energyCharges + fixedCharge) * 0.05).toFixed(2));
  const total          = parseFloat((energyCharges + fixedCharge + fuelAdjustment + taxes).toFixed(2));

  return {
    energyCharges: parseFloat(energyCharges.toFixed(2)),
    fixedCharge,
    fuelAdjustment,
    taxes,
    total
  };
}

// ─── GET /api/bills  — own bills (auth) ─────────────────────────────────────
router.get('/', authenticate, (req, res) => {
  const bills = db.prepare(
    'SELECT * FROM bills WHERE consumer_id = ? ORDER BY generated_at DESC'
  ).all(req.user.consumer_id);
  res.json({ success: true, data: bills });
});

// ─── GET /api/bills/latest ── latest unpaid bill ─────────────────────────────
router.get('/latest', authenticate, (req, res) => {
  const bill = db.prepare(
    "SELECT * FROM bills WHERE consumer_id = ? AND status = 'unpaid' ORDER BY generated_at DESC LIMIT 1"
  ).get(req.user.consumer_id);
  res.json({ success: true, data: bill || null });
});

// ─── POST /api/bills/check  — public quick bill lookup ───────────────────────
router.post('/check', (req, res) => {
  const { consumer_id } = req.body;
  if (!consumer_id) {
    return res.status(400).json({ success: false, message: 'consumer_id is required' });
  }

  const consumer = db.prepare(
    'SELECT name, phone, address, district, consumer_id FROM users WHERE consumer_id = ?'
  ).get(consumer_id);

  const bills = db.prepare(
    'SELECT * FROM bills WHERE consumer_id = ? ORDER BY generated_at DESC LIMIT 12'
  ).all(consumer_id);

  res.json({ success: true, data: { consumer: consumer || null, bills } });
});

// ─── GET /api/bills/:id ──────────────────────────────────────────────────────
router.get('/:id', authenticate, (req, res) => {
  const bill = db.prepare('SELECT * FROM bills WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!bill) return res.status(404).json({ success: false, message: 'Bill not found' });
  res.json({ success: true, data: bill });
});

// ─── POST /api/bills/generate  (admin) ──────────────────────────────────────
router.post('/generate', authenticate, isAdmin, (req, res) => {
  try {
    const { consumer_id, units_consumed, billing_month, billing_year, arrears = 0 } = req.body;

    if (!consumer_id || !units_consumed || !billing_month || !billing_year) {
      return res.status(400).json({ success: false, message: 'consumer_id, units_consumed, billing_month, billing_year required' });
    }

    const user = db.prepare('SELECT * FROM users WHERE consumer_id = ?').get(consumer_id);
    if (!user) return res.status(404).json({ success: false, message: 'Consumer not found' });

    const meter          = db.prepare('SELECT * FROM meters WHERE consumer_id = ?').get(consumer_id);
    const connectionType = meter?.connection_type || 'domestic';

    const { energyCharges, fixedCharge, fuelAdjustment, taxes, total } =
      calculateBill(parseFloat(units_consumed), connectionType);

    const dueDate    = new Date(); dueDate.setDate(dueDate.getDate() + 15);
    const billNumber = generateBillNumber();
    const totalFinal = parseFloat((total + parseFloat(arrears)).toFixed(2));

    db.prepare(`
      INSERT INTO bills
        (bill_number, consumer_id, user_id, meter_id, billing_month, billing_year,
         units_consumed, energy_charges, fixed_charges, fuel_adjustment, taxes,
         arrears, total_amount, due_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      billNumber, consumer_id, user.id, meter?.id || null,
      billing_month, parseInt(billing_year),
      parseFloat(units_consumed), energyCharges, fixedCharge,
      fuelAdjustment, taxes, parseFloat(arrears), totalFinal,
      dueDate.toISOString().split('T')[0]
    );

    res.status(201).json({
      success: true,
      message: 'Bill generated successfully',
      data: {
        bill_number: billNumber,
        consumer_id,
        billing_month, billing_year,
        units_consumed,
        energy_charges: energyCharges,
        fixed_charges: fixedCharge,
        fuel_adjustment: fuelAdjustment,
        taxes,
        arrears,
        total_amount: totalFinal,
        due_date: dueDate.toISOString().split('T')[0]
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── DELETE /api/bills/:id  (admin) ─────────────────────────────────────────
router.delete('/:id', authenticate, isAdmin, (req, res) => {
  const bill = db.prepare('SELECT id, status FROM bills WHERE id = ?').get(req.params.id);
  if (!bill) return res.status(404).json({ success: false, message: 'Bill not found' });
  if (bill.status === 'paid') return res.status(400).json({ success: false, message: 'Cannot delete a paid bill' });
  db.prepare('DELETE FROM bills WHERE id = ?').run(req.params.id);
  res.json({ success: true, message: 'Bill deleted' });
});

module.exports = router;
