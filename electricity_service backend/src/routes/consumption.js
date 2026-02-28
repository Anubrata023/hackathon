// src/routes/consumption.js
const express = require('express');
const router = express.Router();
const {
  getDailyConsumption,
  getWeeklyConsumption,
  getMonthlyConsumption,
  getConsumptionSummary,
  getConsumptionHistory,
} = require('../controllers/consumptionController');

router.get('/:consumerId/summary', getConsumptionSummary);
router.get('/:consumerId/daily', getDailyConsumption);
router.get('/:consumerId/weekly', getWeeklyConsumption);
router.get('/:consumerId/monthly', getMonthlyConsumption);
router.get('/:consumerId/history', getConsumptionHistory);

module.exports = router;
