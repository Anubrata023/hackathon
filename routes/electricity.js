const express = require('express');
const router = express.Router();
const electricityController = require('../controllers/electricityController');
const { authenticate } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

router.post('/apply', electricityController.applyConnection);
router.get('/connections', electricityController.getConnections);
router.get('/bills', electricityController.getBills);
router.get('/bills/:billNumber', electricityController.getBillByNumber);
router.get('/readings/:connectionId', electricityController.getMeterReadings);
router.get('/dashboard', electricityController.getDashboard);

module.exports = router;
