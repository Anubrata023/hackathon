const express = require('express');
const router  = express.Router();
const { authenticate }      = require('../middleware/auth');
const { asyncHandler }      = require('../middleware/errorHandler');
const { getProfile, updateProfile, deleteProfile } = require('../controllers/userController');

// All routes are protected
router.use(authenticate);

router.get('/',    asyncHandler(getProfile));
router.put('/',    asyncHandler(updateProfile));
router.delete('/', asyncHandler(deleteProfile));

module.exports = router;
