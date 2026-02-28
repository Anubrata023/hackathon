// src/routes/distributors.js
const express = require('express');
const router = express.Router();
const db = require('../database');
const { successResponse, errorResponse } = require('../utils/helpers');
const { authenticateToken } = require('../middleware/auth');

/**
 * GET /api/distributors
 * List all active distributors with availability
 */
router.get('/', authenticateToken, (req, res) => {
  try {
    const { city, pincode } = req.query;

    let query = `
      SELECT d.*,
        (SELECT COUNT(*) FROM delivery_slots ds 
         WHERE ds.distributor_id = d.id 
         AND ds.slot_date >= date('now') 
         AND ds.booked_count < ds.capacity
         AND ds.is_active = 1) AS available_slots_count
      FROM distributors d
      WHERE d.is_active = 1
    `;
    const params = [];

    if (city) {
      query += ` AND LOWER(d.city) = LOWER(?)`;
      params.push(city);
    }
    if (pincode) {
      query += ` AND d.pincode = ?`;
      params.push(pincode);
    }

    query += ` ORDER BY d.rating DESC, d.name ASC`;

    const distributors = db.prepare(query).all(...params);

    return successResponse(res, { distributors });

  } catch (err) {
    console.error('Get distributors error:', err);
    return errorResponse(res, 'Failed to fetch distributors', 500);
  }
});

/**
 * GET /api/distributors/:id/slots
 * Get available delivery slots for a distributor
 */
router.get('/:id/slots', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const { date } = req.query;  // optional filter by date

    let query = `
      SELECT ds.*,
        (ds.capacity - ds.booked_count) AS available_count
      FROM delivery_slots ds
      WHERE ds.distributor_id = ?
        AND ds.is_active = 1
        AND ds.slot_date >= date('now')
        AND ds.booked_count < ds.capacity
    `;
    const params = [id];

    if (date) {
      query += ` AND ds.slot_date = ?`;
      params.push(date);
    }

    query += ` ORDER BY ds.slot_date ASC, ds.slot_time ASC LIMIT 30`;

    const slots = db.prepare(query).all(...params);

    // Group by date
    const grouped = slots.reduce((acc, slot) => {
      const d = slot.slot_date;
      if (!acc[d]) acc[d] = [];
      acc[d].push({
        id: slot.id,
        time: slot.slot_time,
        available: slot.available_count,
        capacity: slot.capacity
      });
      return acc;
    }, {});

    return successResponse(res, { slots, grouped_by_date: grouped });

  } catch (err) {
    console.error('Get slots error:', err);
    return errorResponse(res, 'Failed to fetch delivery slots', 500);
  }
});

module.exports = router;
