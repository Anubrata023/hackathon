const router           = require('express').Router();
const ctrl             = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

router.post('/register',        ctrl.register);
router.post('/login',           ctrl.login);
router.get('/profile',          authenticate, ctrl.getProfile);
router.put('/profile',          authenticate, ctrl.updateProfile);
router.put('/change-password',  authenticate, ctrl.changePassword);

module.exports = router;
