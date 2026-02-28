const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();

const { authenticate, authorize } = require('../middleware/auth');
const complaintsCtrl = require('../controllers/complaintsController');
const scheduleCtrl = require('../controllers/scheduleController');
const bulkPickupCtrl = require('../controllers/bulkPickupController');
const authCtrl = require('../controllers/authController');
const servicesCtrl = require('../controllers/servicesController');

// ── File Upload Setup ─────────────────────────────────────────────
const UPLOAD_DIR = path.join(__dirname, '../../uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  }
});
const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|webp/;
  if (allowed.test(path.extname(file.originalname).toLowerCase()) && allowed.test(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files (jpg, png, webp) are allowed'));
  }
};
const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });

// ── AUTH ──────────────────────────────────────────────────────────
router.post('/auth/register', authCtrl.register);
router.post('/auth/login', authCtrl.login);
router.get('/auth/me', authenticate, authCtrl.getMe);
router.post('/auth/change-password', authenticate, authCtrl.changePassword);

// ── COMPLAINTS ────────────────────────────────────────────────────
router.post('/complaints', upload.single('image'), complaintsCtrl.submitComplaint);
router.get('/complaints/track/:refNum', complaintsCtrl.trackComplaint);
router.get('/complaints/stats', authenticate, authorize('admin'), complaintsCtrl.getComplaintStats);
router.get('/complaints', authenticate, authorize('admin', 'field_officer'), complaintsCtrl.listComplaints);
router.patch('/complaints/:id/status', authenticate, authorize('admin', 'field_officer'), complaintsCtrl.updateComplaintStatus);

// ── SCHEDULE ──────────────────────────────────────────────────────
router.get('/schedule', scheduleCtrl.getSchedule);
router.get('/schedule/today', scheduleCtrl.getTodaySchedule);
router.post('/schedule', authenticate, authorize('admin'), scheduleCtrl.createSchedule);
router.post('/schedule/override', authenticate, authorize('admin'), scheduleCtrl.addOverride);

// ── BULK PICKUP ───────────────────────────────────────────────────
router.get('/bulk-pickup/options', bulkPickupCtrl.getOptions);
router.post('/bulk-pickup', bulkPickupCtrl.bookPickup);
router.get('/bulk-pickup/track/:refNum', bulkPickupCtrl.trackPickup);
router.get('/bulk-pickup', authenticate, authorize('admin', 'field_officer'), bulkPickupCtrl.listPickups);
router.patch('/bulk-pickup/:id/status', authenticate, authorize('admin'), bulkPickupCtrl.updatePickupStatus);

// ── SWACHH POINTS ─────────────────────────────────────────────────
router.get('/points', authenticate, servicesCtrl.getMyPoints);
router.post('/points/award', authenticate, authorize('admin'), servicesCtrl.awardPoints);
router.post('/points/redeem', authenticate, authorize('citizen'), servicesCtrl.redeemPoints);

// ── NOTICES ───────────────────────────────────────────────────────
router.get('/notices', servicesCtrl.getNotices);
router.post('/notices', authenticate, authorize('admin'), servicesCtrl.createNotice);
router.delete('/notices/:id', authenticate, authorize('admin'), servicesCtrl.deleteNotice);

// ── WASTE AUDIT ───────────────────────────────────────────────────
router.post('/audit/request', servicesCtrl.requestAudit);

// ── COMPOSTING ────────────────────────────────────────────────────
router.post('/composting/register', servicesCtrl.registerComposting);

// ── PORTAL STATS & WARDS ─────────────────────────────────────────
router.get('/stats', servicesCtrl.getPortalStats);
router.get('/wards', servicesCtrl.getWards);

module.exports = router;
