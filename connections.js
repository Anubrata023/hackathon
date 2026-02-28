const router           = require('express').Router();
const ctrl             = require('../controllers/notificationController');
const { authenticate } = require('../middleware/auth');

router.get('/',              authenticate, ctrl.getMyNotifications);
router.patch('/read-all',    authenticate, ctrl.markAllAsRead);
router.patch('/:id/read',    authenticate, ctrl.markAsRead);
router.delete('/:id',        authenticate, ctrl.deleteNotification);

module.exports = router;
