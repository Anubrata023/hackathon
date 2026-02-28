// src/routes/billing.js
const express = require('express');
const router = express.Router();
const { getCurrentBill, getAllBills, payBill, getPaymentHistory } = require('../controllers/billingController');

router.get('/:consumerId/current', getCurrentBill);
router.get('/:consumerId/all', getAllBills);
router.post('/:consumerId/pay', payBill);
router.get('/:consumerId/payments', getPaymentHistory);

module.exports = router;
