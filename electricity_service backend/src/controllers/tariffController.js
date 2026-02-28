// src/controllers/tariffController.js
const { getDb } = require('../db/init');

// GET /tariff?connection_type=LT-B+Domestic
function getTariffSlabs(req, res) {
  const db = getDb();
  const connectionType = req.query.connection_type || 'LT-B Domestic';

  const slabs = db.prepare(`
    SELECT * FROM tariff_slabs
    WHERE connection_type = ?
    ORDER BY units_from ASC
  `).all(connectionType);

  res.json({ success: true, data: slabs });
}

// GET /tariff/calculate?units=284&connection_type=LT-B+Domestic
function calculateBill(req, res) {
  const db = getDb();
  const units = parseFloat(req.query.units);
  const connectionType = req.query.connection_type || 'LT-B Domestic';

  if (isNaN(units) || units < 0) {
    return res.status(400).json({ success: false, message: 'Invalid units value' });
  }

  const slabs = db.prepare(`
    SELECT * FROM tariff_slabs WHERE connection_type = ? ORDER BY units_from ASC
  `).all(connectionType);

  if (!slabs.length) {
    return res.status(404).json({ success: false, message: 'No tariff slabs found' });
  }

  let remaining = units;
  let energyCharges = 0;
  const breakdown = [];

  for (const slab of slabs) {
    if (remaining <= 0) break;
    const upper = slab.units_to !== null ? slab.units_to : Infinity;
    const slabSize = upper - slab.units_from + 1;
    const consumed = Math.min(remaining, slabSize);
    const charge = parseFloat((consumed * slab.rate_per_unit).toFixed(2));
    energyCharges += charge;
    breakdown.push({
      slab_label: slab.slab_label,
      units_consumed: consumed,
      rate: slab.rate_per_unit,
      charge,
    });
    remaining -= consumed;
  }

  const fixedCharge = 150;
  const meterRental = 30;
  const dutyPct = 0.05;
  const dutyAmount = parseFloat((energyCharges * dutyPct).toFixed(2));
  const total = parseFloat((energyCharges + fixedCharge + dutyAmount + meterRental).toFixed(2));

  res.json({
    success: true,
    data: {
      units,
      energy_charges: parseFloat(energyCharges.toFixed(2)),
      fixed_charge: fixedCharge,
      electricity_duty: dutyAmount,
      meter_rental: meterRental,
      total_amount: total,
      slab_breakdown: breakdown,
    },
  });
}

module.exports = { getTariffSlabs, calculateBill };
