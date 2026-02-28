// src/routes/tariff.js
const express = require('express');
const router = express.Router();
const { getTariffSlabs, calculateBill } = require('../controllers/tariffController');

router.get('/', getTariffSlabs);
router.get('/calculate', calculateBill);

module.exports = router;
