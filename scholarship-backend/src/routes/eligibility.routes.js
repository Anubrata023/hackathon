// src/routes/eligibility.routes.js
const express    = require('express');
const router     = express.Router();
const controller = require('../controllers/eligibility.controller');
const validate   = require('../middleware/validate');
const schema     = require('../validators/eligibility.validator');

// Public — no auth required for eligibility check
router.post('/check', validate(schema.check), controller.checkEligibility);

// Get previous check result by session ID
router.get('/result/:sessionId', controller.getResult);

module.exports = router;
