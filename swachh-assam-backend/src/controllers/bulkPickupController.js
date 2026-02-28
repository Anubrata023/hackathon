const { dbRun, dbGet, dbAll } = require('../config/database');
const { generatePickupRef, sendSMS } = require('../utils/helpers');

const TIME_SLOTS = ['06:00 AM - 09:00 AM', '09:00 AM - 12:00 PM', '02:00 PM - 05:00 PM'];
const WASTE_TYPES = ['Construction Debris', 'Old Furniture', 'E-Waste', 'Garden Waste', 'Event Waste', 'Bulk Household Items', 'Other'];

// GET /api/bulk-pickup/options
async function getOptions(req, res) {
  return res.json({ success: true, data: { time_slots: TIME_SLOTS, waste_types: WASTE_TYPES } });
}

// POST /api/bulk-pickup — Book a bulk pickup
async function bookPickup(req, res, next) {
  try {
    const { user_name, mobile, email, ward, address, waste_type, estimated_quantity, preferred_date, preferred_time_slot, notes } = req.body;

    if (!user_name || !mobile || !ward || !address || !waste_type || !preferred_date || !preferred_time_slot) {
      return res.status(400).json({ success: false, message: 'All required fields must be provided' });
    }

    // Ensure date is in future
    if (new Date(preferred_date) <= new Date()) {
      return res.status(400).json({ success: false, message: 'Preferred date must be in the future' });
    }

    const refNum = generatePickupRef();
    const result = await dbRun(
      `INSERT INTO bulk_pickups 
       (reference_number, user_name, mobile, email, ward, address, waste_type, estimated_quantity, preferred_date, preferred_time_slot, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [refNum, user_name.trim(), mobile.trim(), email || null, ward, address.trim(),
       waste_type, estimated_quantity || null, preferred_date, preferred_time_slot, notes || null]
    );

    await sendSMS(mobile,
      `Dear ${user_name}, your bulk pickup request ${refNum} on ${preferred_date} (${preferred_time_slot}) is confirmed. - Swachh Assam`
    );

    return res.status(201).json({
      success: true,
      message: 'Bulk pickup booked successfully',
      data: { reference_number: refNum, id: result.lastID, status: 'booked', preferred_date, preferred_time_slot }
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/bulk-pickup/track/:refNum
async function trackPickup(req, res, next) {
  try {
    const pickup = await dbGet(
      'SELECT * FROM bulk_pickups WHERE reference_number = ?',
      [req.params.refNum.toUpperCase()]
    );
    if (!pickup) return res.status(404).json({ success: false, message: 'Booking not found' });
    return res.json({ success: true, data: pickup });
  } catch (err) {
    next(err);
  }
}

// GET /api/bulk-pickup — List all (admin)
async function listPickups(req, res, next) {
  try {
    const { status, ward, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let where = [];
    let params = [];
    if (status) { where.push('status = ?'); params.push(status); }
    if (ward) { where.push('ward = ?'); params.push(ward); }
    const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const total = await dbGet(`SELECT COUNT(*) as cnt FROM bulk_pickups ${whereClause}`, params);
    const pickups = await dbAll(
      `SELECT * FROM bulk_pickups ${whereClause} ORDER BY preferred_date ASC LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), parseInt(offset)]
    );

    return res.json({
      success: true,
      data: pickups,
      pagination: { total: total.cnt, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total.cnt / limit) }
    });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/bulk-pickup/:id/status (admin)
async function updatePickupStatus(req, res, next) {
  try {
    const { status } = req.body;
    const valid = ['booked', 'confirmed', 'completed', 'cancelled'];
    if (!valid.includes(status)) return res.status(400).json({ success: false, message: 'Invalid status' });

    const pickup = await dbGet('SELECT * FROM bulk_pickups WHERE id = ?', [req.params.id]);
    if (!pickup) return res.status(404).json({ success: false, message: 'Booking not found' });

    await dbRun('UPDATE bulk_pickups SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [status, req.params.id]);

    if (status === 'confirmed') {
      await sendSMS(pickup.mobile,
        `Your bulk pickup ${pickup.reference_number} is confirmed for ${pickup.preferred_date} (${pickup.preferred_time_slot}). - Swachh Assam`
      );
    }

    return res.json({ success: true, message: 'Pickup status updated' });
  } catch (err) {
    next(err);
  }
}

module.exports = { getOptions, bookPickup, trackPickup, listPickups, updatePickupStatus };
