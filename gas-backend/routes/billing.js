const router           = require('express').Router();
const ctrl             = require('../controllers/billingController');
const { authenticate } = require('../middleware/auth');

router.get('/',             authenticate, ctrl.getMyBills);
router.get('/payments',     authenticate, ctrl.getPaymentHistory);
router.get('/:id',          authenticate, ctrl.getBillById);
router.post('/:id/pay',     authenticate, ctrl.payBill);

module.exports = router;
