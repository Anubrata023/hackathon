// src/routes/platform.js
const express = require('express');
const router = express.Router();
const { getPlatformStats, getHealth } = require('../controllers/platformController');

router.get('/stats', getPlatformStats);
router.get('/health', getHealth);

module.exports = router;
