const express = require('express');
const router  = express.Router();
const { authenticate }  = require('../middleware/auth');
const { asyncHandler }  = require('../middleware/errorHandler');
const ctrl              = require('../controllers/applicationController');

// All routes protected
router.use(authenticate);

router.post('/',                       asyncHandler(ctrl.createApplication));
router.get('/',                        asyncHandler(ctrl.getApplications));
router.get('/:id',                     asyncHandler(ctrl.getApplication));
router.put('/:id',                     asyncHandler(ctrl.updateApplication));
router.patch('/:id/submit',            asyncHandler(ctrl.submitApplication));
router.patch('/:id/status',            asyncHandler(ctrl.updateStatus));   // Officer endpoint
router.delete('/:id',                  asyncHandler(ctrl.deleteApplication));

module.exports = router;
