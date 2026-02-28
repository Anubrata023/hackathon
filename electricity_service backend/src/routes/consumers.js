// src/routes/consumers.js
const express = require('express');
const router = express.Router();
const { getConsumer, listConsumers } = require('../controllers/consumerController');

router.get('/', listConsumers);
router.get('/:consumerId', getConsumer);

module.exports = router;
