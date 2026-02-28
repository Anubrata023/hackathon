// src/routes/admin.routes.js
const express    = require('express');
const router     = express.Router();
const controller = require('../controllers/admin.controller');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate, authorize('ADMIN', 'SUPER_ADMIN'));

// Dashboard statistics
router.get('/stats',             controller.getDashboardStats);

// User management
router.get('/users',             controller.listUsers);
router.get('/users/:id',         controller.getUser);
router.patch('/users/:id/role',  controller.changeUserRole);
router.patch('/users/:id/block', controller.blockUser);

// Reports
router.get('/reports/applications',   controller.applicationReport);
router.get('/reports/disbursements',  controller.disbursementReport);
router.get('/reports/scholarships',   controller.scholarshipReport);

// Audit log
router.get('/audit-log', controller.getAuditLog);

module.exports = router;
