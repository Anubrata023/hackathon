// src/routes/disbursement.routes.js
const express    = require('express');
const router     = express.Router();
const controller = require('../controllers/disbursement.controller');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

// Student: view own disbursement
router.get('/my',              controller.listMyDisbursements);
router.get('/:applicationId',  controller.getDisbursement);

// Admin: initiate and process
router.post('/',
  authorize('ADMIN', 'SUPER_ADMIN'),
  controller.initiateDisbursement
);
router.patch('/:id/status',
  authorize('ADMIN', 'SUPER_ADMIN'),
  controller.updateDisbursementStatus
);

module.exports = router;
