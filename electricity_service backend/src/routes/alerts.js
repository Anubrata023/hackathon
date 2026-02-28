// src/routes/alerts.js
const express = require('express');
const router = express.Router();
const { getAlerts, markRead, markAllRead, createAlert } = require('../controllers/alertsController');

router.get('/:consumerId', getAlerts);
router.post('/:consumerId', createAlert);
router.patch('/:consumerId/read-all', markAllRead);
router.patch('/:consumerId/:alertId/read', markRead);

module.exports = router;
