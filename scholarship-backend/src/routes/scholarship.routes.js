// src/routes/scholarship.routes.js

const express    = require('express');
const router     = express.Router();
const controller = require('../controllers/scholarship.controller');
const { authenticate, authorize } = require('../middleware/auth');
const validate   = require('../middleware/validate');
const schema     = require('../validators/scholarship.validator');
const { cacheMiddleware } = require('../middleware/cache');

// ── Public ──────────────────────────────────────────────
// GET /scholarships?status=ACTIVE&category=SC&level=POST_MATRIC&q=nmms&page=1&limit=12
router.get('/', cacheMiddleware(60), controller.listScholarships);

// GET /scholarships/featured
router.get('/featured', cacheMiddleware(120), controller.getFeaturedScholarship);

// GET /scholarships/:slug
router.get('/:slug', cacheMiddleware(60), controller.getScholarship);

// ── Authenticated ────────────────────────────────────────
// Check if user has already applied for a scholarship
router.get('/:slug/application-status', authenticate, controller.getApplicationStatus);

// ── Admin only ───────────────────────────────────────────
router.post('/',
  authenticate, authorize('ADMIN', 'SUPER_ADMIN'),
  validate(schema.create),
  controller.createScholarship
);

router.put('/:id',
  authenticate, authorize('ADMIN', 'SUPER_ADMIN'),
  validate(schema.update),
  controller.updateScholarship
);

router.patch('/:id/status',
  authenticate, authorize('ADMIN', 'SUPER_ADMIN'),
  validate(schema.updateStatus),
  controller.updateScholarshipStatus
);

router.delete('/:id',
  authenticate, authorize('SUPER_ADMIN'),
  controller.deleteScholarship
);

module.exports = router;
