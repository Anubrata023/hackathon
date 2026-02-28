// src/routes/meter.js
const express = require('express');
const router = express.Router();
const { getMeterReadings, pushMeterReading } = require('../controllers/meterController');

router.get('/:consumerId/readings', getMeterReadings);
router.post('/:consumerId/readings', pushMeterReading);

module.exports = router;
