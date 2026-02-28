const router                    = require('express').Router();
const ctrl                      = require('../controllers/adminController');
const { authenticate, requireAdmin } = require('../middleware/auth');

// All admin routes require authentication + admin role
router.use(authenticate, requireAdmin);

// Dashboard
router.get('/dashboard',                       ctrl.getDashboard);

// Users
router.get('/users',                           ctrl.getAllUsers);
router.patch('/users/:id/role',                ctrl.updateUserRole);

// Connections
router.get('/connections',                     ctrl.getAllConnections);
router.patch('/connections/:id/status',        ctrl.updateConnectionStatus);

// Service Requests
router.get('/service-requests',                ctrl.getAllServiceRequests);
router.patch('/service-requests/:id',          ctrl.updateServiceRequest);

// Complaints
router.get('/complaints',                      ctrl.getAllComplaints);
router.patch('/complaints/:id',                ctrl.resolveComplaint);

// Billing
router.get('/bills',                           ctrl.getAllBills);
router.post('/bills/generate',                 ctrl.generateBill);
router.post('/bills/mark-overdue',             ctrl.markBillOverdue);

// Notifications
router.post('/notifications/broadcast',        ctrl.broadcastNotification);

module.exports = router;
