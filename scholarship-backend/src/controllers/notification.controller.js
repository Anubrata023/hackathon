// src/controllers/notification.controller.js
const prisma  = require('../config/database').prisma;

exports.listNotifications = async (req, res, next) => {
  try {
    const { limit = 30, page = 1 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where:   { userId: req.user.id },
        skip, take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.notification.count({ where: { userId: req.user.id } }),
    ]);

    res.json({ success: true, data: notifications, meta: { total } });
  } catch (err) { next(err); }
};

exports.getUnreadCount = async (req, res, next) => {
  try {
    const count = await prisma.notification.count({
      where: { userId: req.user.id, isRead: false },
    });
    res.json({ success: true, data: { unreadCount: count } });
  } catch (err) { next(err); }
};

exports.markRead = async (req, res, next) => {
  try {
    await prisma.notification.updateMany({
      where: { id: req.params.id, userId: req.user.id },
      data:  { isRead: true },
    });
    res.json({ success: true });
  } catch (err) { next(err); }
};

exports.markAllRead = async (req, res, next) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user.id, isRead: false },
      data:  { isRead: true },
    });
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (err) { next(err); }
};

exports.deleteNotification = async (req, res, next) => {
  try {
    await prisma.notification.deleteMany({
      where: { id: req.params.id, userId: req.user.id },
    });
    res.json({ success: true });
  } catch (err) { next(err); }
};
