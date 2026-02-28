// src/routes/bookings.js
const express = require('express');
const router = express.Router();
const db = require('../database');
const { successResponse, errorResponse, generateBookingRef, auditLog } = require('../utils/helpers');
const { authenticateToken } = require('../middleware/auth');
const { validateCreateBooking } = require('../middleware/validate');
const { generateOTP } = require('../utils/otp');

/**
 * POST /api/bookings
 * Create a new booking (requires valid OTP session token)
 */
router.post('/', authenticateToken, validateCreateBooking, (req, res) => {
  try {
    const { consumer_id, distributor_id, slot_id, cylinder_type, quantity, special_instructions } = req.body;

    // Must be a booking session token
    if (req.user.purpose !== 'booking') {
      return errorResponse(res, 'Invalid session for booking', 403);
    }

    const consumer = db.prepare(`SELECT * FROM consumers WHERE id = ? AND is_active = 1`).get(req.user.consumer_db_id);
    if (!consumer) return errorResponse(res, 'Consumer not found', 404);

    const distributor = db.prepare(`SELECT * FROM distributors WHERE id = ? AND is_active = 1`).get(distributor_id);
    if (!distributor) return errorResponse(res, 'Selected distributor not found or inactive', 404);
    if (!distributor.stock_available) return errorResponse(res, 'Selected distributor has no stock currently. Please choose another.', 409);

    // Check for pending/confirmed booking (can't book twice if one is active)
    const activeBooking = db.prepare(`
      SELECT id FROM bookings
      WHERE consumer_id = ? AND status IN ('pending','confirmed','out_for_delivery')
      LIMIT 1
    `).get(consumer.id);

    if (activeBooking) {
      return errorResponse(res, 'You already have an active booking. Please wait for it to be delivered before placing a new one.', 409);
    }

    // Validate and lock slot
    let slot = null;
    if (slot_id) {
      slot = db.prepare(`
        SELECT * FROM delivery_slots
        WHERE id = ? AND distributor_id = ? AND is_active = 1
          AND booked_count < capacity AND slot_date >= date('now')
      `).get(slot_id, distributor_id);

      if (!slot) {
        return errorResponse(res, 'Selected time slot is no longer available. Please choose another slot.', 409);
      }
    }

    const qty = parseInt(quantity) || 1;
    const cylinderType = cylinder_type || '14.2 kg';

    // Pricing table (can be moved to DB)
    const priceMap = { '14.2 kg': 899.50, '5 kg': 410.00, '19 kg': 1849.00 };
    const subsidyMap = { '14.2 kg': 200.00, '5 kg': 0, '19 kg': 0 };
    const unitPrice = priceMap[cylinderType] || 899.50;
    const amount = unitPrice * qty;

    const bookingRef = generateBookingRef(consumer.city || 'GHY');
    const deliveryOtp = generateOTP(4); // 4-digit OTP for delivery person verification

    // Use a transaction to ensure atomicity
    const createBooking = db.transaction(() => {
      const result = db.prepare(`
        INSERT INTO bookings (
          booking_ref, consumer_id, distributor_id, slot_id,
          cylinder_type, quantity, amount, status,
          otp_verified, delivery_otp, special_instructions, booked_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 'confirmed', 1, ?, ?, datetime('now'))
      `).run(bookingRef, consumer.id, distributor_id, slot_id || null,
             cylinderType, qty, amount, deliveryOtp,
             special_instructions || null);

      // Increment slot booking count
      if (slot_id) {
        db.prepare(`
          UPDATE delivery_slots SET booked_count = booked_count + 1 WHERE id = ?
        `).run(slot_id);
      }

      // Create subsidy record if eligible
      if (consumer.subsidy_eligible && subsidyMap[cylinderType]) {
        db.prepare(`
          INSERT INTO subsidy_transactions (booking_id, consumer_id, amount, status)
          VALUES (?, ?, ?, 'pending')
        `).run(result.lastInsertRowid, consumer.id, subsidyMap[cylinderType] * qty);
      }

      return result;
    });

    const insertResult = createBooking();

    auditLog(db, 'booking', insertResult.lastInsertRowid, 'BOOKING_CREATED', {
      booking_ref: bookingRef, consumer_id: consumer.consumer_id, distributor: distributor.name
    }, req.ip);

    // Fetch full booking details for response
    const booking = db.prepare(`
      SELECT b.*, d.name as distributor_name, d.address as distributor_address,
        ds.slot_date, ds.slot_time
      FROM bookings b
      JOIN distributors d ON b.distributor_id = d.id
      LEFT JOIN delivery_slots ds ON b.slot_id = ds.id
      WHERE b.id = ?
    `).get(insertResult.lastInsertRowid);

    return successResponse(res, {
      booking_ref: bookingRef,
      status: 'confirmed',
      consumer_name: consumer.name,
      distributor_name: distributor.name,
      distributor_address: distributor.address,
      cylinder_type: cylinderType,
      quantity: qty,
      amount: amount,
      delivery_slot: slot ? `${slot.slot_date} | ${slot.slot_time}` : 'To be confirmed',
      delivery_otp_hint: `Your delivery OTP will be shown on the delivery screen`,
      subsidy_amount: consumer.subsidy_eligible ? subsidyMap[cylinderType] * qty : 0,
      subsidy_credit_timeline: '2-3 working days post delivery'
    }, 'Booking confirmed successfully! 🎉', 201);

  } catch (err) {
    console.error('Create booking error:', err);
    return errorResponse(res, 'Failed to create booking. Please try again.', 500);
  }
});

/**
 * GET /api/bookings/history
 * Consumer's booking history
 */
router.get('/history', authenticateToken, (req, res) => {
  try {
    const consumerId = req.user.consumer_db_id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const total = db.prepare(`SELECT COUNT(*) as cnt FROM bookings WHERE consumer_id = ?`).get(consumerId).cnt;

    const bookings = db.prepare(`
      SELECT b.booking_ref, b.status, b.cylinder_type, b.quantity, b.amount,
        b.booked_at, b.confirmed_at, b.delivered_at, b.otp_verified,
        d.name as distributor_name, d.address as distributor_address,
        ds.slot_date, ds.slot_time,
        st.amount as subsidy_amount, st.status as subsidy_status
      FROM bookings b
      JOIN distributors d ON b.distributor_id = d.id
      LEFT JOIN delivery_slots ds ON b.slot_id = ds.id
      LEFT JOIN subsidy_transactions st ON st.booking_id = b.id
      WHERE b.consumer_id = ?
      ORDER BY b.booked_at DESC
      LIMIT ? OFFSET ?
    `).all(consumerId, limit, offset);

    return successResponse(res, {
      bookings,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (err) {
    console.error('Booking history error:', err);
    return errorResponse(res, 'Failed to fetch booking history', 500);
  }
});

/**
 * GET /api/bookings/:ref
 * Get single booking by reference number
 */
router.get('/:ref', authenticateToken, (req, res) => {
  try {
    const { ref } = req.params;
    const consumerId = req.user.consumer_db_id;

    const booking = db.prepare(`
      SELECT b.*, d.name as distributor_name, d.address as distributor_address,
        d.mobile as distributor_mobile, d.rating as distributor_rating,
        ds.slot_date, ds.slot_time,
        st.amount as subsidy_amount, st.status as subsidy_status, st.credited_at as subsidy_credited_at
      FROM bookings b
      JOIN distributors d ON b.distributor_id = d.id
      LEFT JOIN delivery_slots ds ON b.slot_id = ds.id
      LEFT JOIN subsidy_transactions st ON st.booking_id = b.id
      WHERE b.booking_ref = ? AND b.consumer_id = ?
    `).get(ref, consumerId);

    if (!booking) {
      return errorResponse(res, 'Booking not found', 404);
    }

    // Don't expose delivery OTP unless status requires it
    const responseData = { ...booking };
    if (!['out_for_delivery'].includes(booking.status)) {
      delete responseData.delivery_otp;
    }

    return successResponse(res, { booking: responseData });

  } catch (err) {
    console.error('Get booking error:', err);
    return errorResponse(res, 'Failed to fetch booking details', 500);
  }
});

/**
 * DELETE /api/bookings/:ref/cancel
 * Cancel a booking
 */
router.delete('/:ref/cancel', authenticateToken, (req, res) => {
  try {
    const { ref } = req.params;
    const { reason } = req.body;
    const consumerId = req.user.consumer_db_id;

    const booking = db.prepare(`
      SELECT * FROM bookings WHERE booking_ref = ? AND consumer_id = ?
    `).get(ref, consumerId);

    if (!booking) return errorResponse(res, 'Booking not found', 404);

    if (!['pending', 'confirmed'].includes(booking.status)) {
      return errorResponse(res, `Cannot cancel a booking with status: ${booking.status}`);
    }

    db.transaction(() => {
      db.prepare(`
        UPDATE bookings SET status = 'cancelled', cancelled_at = datetime('now'),
          cancellation_reason = ? WHERE id = ?
      `).run(reason || 'Cancelled by consumer', booking.id);

      // Release slot
      if (booking.slot_id) {
        db.prepare(`
          UPDATE delivery_slots SET booked_count = MAX(0, booked_count - 1) WHERE id = ?
        `).run(booking.slot_id);
      }

      // Cancel subsidy if pending
      db.prepare(`
        UPDATE subsidy_transactions SET status = 'cancelled' WHERE booking_id = ? AND status = 'pending'
      `).run(booking.id);
    })();

    auditLog(db, 'booking', booking.id, 'BOOKING_CANCELLED', { booking_ref: ref, reason }, req.ip);

    return successResponse(res, { booking_ref: ref, status: 'cancelled' }, 'Booking cancelled successfully');

  } catch (err) {
    console.error('Cancel booking error:', err);
    return errorResponse(res, 'Failed to cancel booking', 500);
  }
});

module.exports = router;
