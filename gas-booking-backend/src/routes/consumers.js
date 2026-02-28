// src/routes/consumers.js
const express = require('express');
const router = express.Router();
const db = require('../database');
const { successResponse, errorResponse, maskMobile, auditLog } = require('../utils/helpers');
const { authenticateToken } = require('../middleware/auth');

/**
 * GET /api/consumers/profile
 * Get consumer profile for authenticated session
 */
router.get('/profile', authenticateToken, (req, res) => {
  try {
    const consumer = db.prepare(`
      SELECT id, consumer_id, name, mobile, email, address, city, state, pincode,
        subsidy_eligible, bank_account, ifsc_code, created_at
      FROM consumers WHERE id = ? AND is_active = 1
    `).get(req.user.consumer_db_id);

    if (!consumer) return errorResponse(res, 'Consumer not found', 404);

    // Mask sensitive data
    const response = {
      ...consumer,
      mobile_masked: maskMobile(consumer.mobile),
      aadhaar_linked: false, // don't expose aadhaar
      bank_account: consumer.bank_account
        ? '****' + consumer.bank_account.slice(-4)
        : null
    };
    delete response.mobile; // don't expose full mobile

    return successResponse(res, { consumer: response });
  } catch (err) {
    console.error('Get profile error:', err);
    return errorResponse(res, 'Failed to fetch profile', 500);
  }
});

/**
 * GET /api/consumers/subsidy
 * Get subsidy history
 */
router.get('/subsidy', authenticateToken, (req, res) => {
  try {
    const transactions = db.prepare(`
      SELECT st.*, b.booking_ref, b.cylinder_type, b.quantity, b.delivered_at
      FROM subsidy_transactions st
      JOIN bookings b ON st.booking_id = b.id
      WHERE st.consumer_id = ?
      ORDER BY st.created_at DESC
      LIMIT 20
    `).all(req.user.consumer_db_id);

    const totalCredited = transactions
      .filter(t => t.status === 'credited')
      .reduce((sum, t) => sum + t.amount, 0);

    return successResponse(res, {
      transactions,
      summary: {
        total_credited: totalCredited,
        pending_count: transactions.filter(t => t.status === 'pending').length
      }
    });
  } catch (err) {
    console.error('Subsidy history error:', err);
    return errorResponse(res, 'Failed to fetch subsidy history', 500);
  }
});

/**
 * PATCH /api/consumers/profile
 * Update profile fields (email, address, pincode)
 */
router.patch('/profile', authenticateToken, (req, res) => {
  try {
    const { email, address, pincode } = req.body;
    const consumerId = req.user.consumer_db_id;

    const updates = [];
    const params = [];

    if (email !== undefined) { updates.push('email = ?'); params.push(email); }
    if (address !== undefined) { updates.push('address = ?'); params.push(address); }
    if (pincode !== undefined) { updates.push('pincode = ?'); params.push(pincode); }

    if (updates.length === 0) {
      return errorResponse(res, 'No fields to update');
    }

    updates.push("updated_at = datetime('now')");
    params.push(consumerId);

    db.prepare(`UPDATE consumers SET ${updates.join(', ')} WHERE id = ?`).run(...params);

    auditLog(db, 'consumer', consumerId, 'PROFILE_UPDATED', { fields: Object.keys(req.body) }, req.ip);

    return successResponse(res, {}, 'Profile updated successfully');
  } catch (err) {
    console.error('Update profile error:', err);
    return errorResponse(res, 'Failed to update profile', 500);
  }
});

module.exports = router;
