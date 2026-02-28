// src/routes/application.routes.js

const express    = require('express');
const router     = express.Router();
const controller = require('../controllers/application.controller');
const { authenticate, authorize } = require('../middleware/auth');
const validate   = require('../middleware/validate');
const schema     = require('../validators/application.validator');

// All application routes require authentication
router.use(authenticate);

// ── Student Routes ───────────────────────────────────────

// List own applications
router.get('/', controller.listMyApplications);

// Create (start) a new application
router.post('/', validate(schema.create), controller.createApplication);

// Get a specific application (student sees own; admin sees any)
router.get('/:id', controller.getApplication);

// Update draft application
router.put('/:id', validate(schema.update), controller.updateApplication);

// Submit a draft application
router.post('/:id/submit', controller.submitApplication);

// Cancel an application (student can cancel DRAFT or SUBMITTED)
router.post('/:id/cancel', controller.cancelApplication);

// Track application status / timeline
router.get('/:id/timeline', controller.getApplicationTimeline);

// Download application as PDF
router.get('/:id/download', controller.downloadApplicationPDF);

// ── Verifier Routes ──────────────────────────────────────

// Institutional verifier marks application as verified
router.post('/:id/verify',
  authorize('VERIFIER', 'ADMIN', 'SUPER_ADMIN'),
  validate(schema.verify),
  controller.verifyApplication
);

// ── Admin Routes ─────────────────────────────────────────

// List ALL applications (with filters)
router.get('/admin/all',
  authorize('ADMIN', 'SUPER_ADMIN'),
  controller.listAllApplications
);

// Approve / reject / put on hold
router.patch('/:id/status',
  authorize('ADMIN', 'SUPER_ADMIN'),
  validate(schema.changeStatus),
  controller.changeApplicationStatus
);

// Bulk approve
router.post('/admin/bulk-approve',
  authorize('ADMIN', 'SUPER_ADMIN'),
  validate(schema.bulkAction),
  controller.bulkApprove
);

module.exports = router;
