const express = require('express');
const router = express.Router();
const municipalController = require('../controllers/municipalController');
const { authenticate } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

// ═══ WASTE MANAGEMENT ═══
router.post('/waste/report', municipalController.reportWaste);
router.get('/waste/reports', municipalController.getWasteReports);

// ═══ GRIEVANCES ═══
router.post('/grievance/file', municipalController.fileGrievance);
router.get('/grievance/my', municipalController.getGrievances);
router.get('/grievance/track/:grievanceNumber', municipalController.trackGrievance);

// ═══ WATER SUPPLY ═══
router.post('/water/apply', municipalController.applyWaterConnection);
router.get('/water/connections', municipalController.getWaterConnections);
router.get('/water/bills', municipalController.getWaterBills);

module.exports = router;
