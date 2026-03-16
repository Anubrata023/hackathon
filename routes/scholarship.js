const express = require('express');
const router = express.Router();
const scholarshipController = require('../controllers/scholarshipController');
const { authenticate, optionalAuth } = require('../middleware/auth');

// Public routes
router.get('/', optionalAuth, scholarshipController.getScholarships);
router.get('/:id', optionalAuth, scholarshipController.getScholarshipById);
router.post('/check-eligibility', scholarshipController.checkEligibility);

// Protected routes
router.post('/apply', authenticate, scholarshipController.applyScholarship);
router.get('/my-applications', authenticate, scholarshipController.getMyApplications);
router.get('/track/:applicationNumber', authenticate, scholarshipController.trackApplication);

module.exports = router;
