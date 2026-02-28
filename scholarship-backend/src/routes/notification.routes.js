// src/routes/notification.routes.js
const express    = require('express');
const router     = express.Router();
const controller = require('../controllers/notification.controller');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/',                    controller.listNotifications);
router.get('/unread-count',        controller.getUnreadCount);
router.patch('/:id/read',          controller.markRead);
router.post('/mark-all-read',      controller.markAllRead);
router.delete('/:id',              controller.deleteNotification);

module.exports = router;
