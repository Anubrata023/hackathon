const router           = require('express').Router();
const ctrl             = require('../controllers/complaintController');
const { authenticate } = require('../middleware/auth');

router.get('/categories',  ctrl.getCategories);
router.post('/',           authenticate, ctrl.submitComplaint);
router.get('/',            authenticate, ctrl.getMyComplaints);
router.get('/:id',         authenticate, ctrl.getComplaintById);

module.exports = router;
