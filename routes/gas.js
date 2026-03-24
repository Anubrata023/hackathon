const express = require('express');
const router = express.Router();
const gasController = require('../controllers/gasController');
const { authenticate } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

router.post('/apply', gasController.applyConnection);
router.get('/connections', gasController.getConnections);
router.post('/book', gasController.bookCylinder);
router.get('/bookings', gasController.getBookings);
router.get('/track/:bookingNumber', gasController.trackBooking);

module.exports = router;
