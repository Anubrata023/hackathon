// src/routes/profile.routes.js
const express    = require('express');
const router     = express.Router();
const controller = require('../controllers/profile.controller');
const { authenticate } = require('../middleware/auth');
const validate   = require('../middleware/validate');
const schema     = require('../validators/profile.validator');

router.use(authenticate);

router.get('/',  controller.getProfile);
router.post('/', validate(schema.create), controller.createProfile);
router.put('/',  validate(schema.update), controller.updateProfile);

// Bank account details (separate endpoint for sensitivity)
router.put('/bank', validate(schema.updateBank), controller.updateBankDetails);

module.exports = router;
