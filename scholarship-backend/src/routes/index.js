// src/routes/index.js
// Master API router — mounts all sub-routers

const express = require('express');
const router  = express.Router();

const authRoutes          = require('./auth.routes');
const scholarshipRoutes   = require('./scholarship.routes');
const applicationRoutes   = require('./application.routes');
const documentRoutes      = require('./document.routes');
const noticeRoutes        = require('./notice.routes');
const profileRoutes       = require('./profile.routes');
const eligibilityRoutes   = require('./eligibility.routes');
const notificationRoutes  = require('./notification.routes');
const adminRoutes         = require('./admin.routes');
const disbursementRoutes  = require('./disbursement.routes');

router.use('/auth',          authRoutes);
router.use('/scholarships',  scholarshipRoutes);
router.use('/applications',  applicationRoutes);
router.use('/documents',     documentRoutes);
router.use('/notices',       noticeRoutes);
router.use('/profile',       profileRoutes);
router.use('/eligibility',   eligibilityRoutes);
router.use('/notifications', notificationRoutes);
router.use('/admin',         adminRoutes);
router.use('/disbursements', disbursementRoutes);

// API reference
router.get('/', (req, res) => {
  res.json({
    name: 'GMC Scholarship Portal API',
    version: '1.0.0',
    endpoints: [
      'POST   /auth/register',
      'POST   /auth/login',
      'POST   /auth/otp/send',
      'POST   /auth/otp/verify',
      'POST   /auth/refresh',
      'POST   /auth/logout',
      'GET    /scholarships',
      'GET    /scholarships/:slug',
      'POST   /scholarships (admin)',
      'GET    /applications',
      'POST   /applications',
      'GET    /applications/:id',
      'PATCH  /applications/:id/status (admin)',
      'POST   /documents/upload',
      'GET    /documents/:id',
      'GET    /notices',
      'POST   /notices (admin)',
      'GET    /profile',
      'PUT    /profile',
      'POST   /eligibility/check',
      'GET    /notifications',
      'PATCH  /notifications/:id/read',
      'GET    /admin/stats',
      'GET    /disbursements/:applicationId',
    ],
  });
});

module.exports = router;
