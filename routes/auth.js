const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

// Public routes
router.post('/send-otp', authController.sendOTPController);
router.post('/verify-otp', authController.verifyOTPController);

// Protected routes
router.get('/me', authenticate, authController.getMeController);
router.put('/profile', authenticate, authController.updateProfileController);
router.post('/logout', authenticate, authController.logoutController);

module.exports = router;
