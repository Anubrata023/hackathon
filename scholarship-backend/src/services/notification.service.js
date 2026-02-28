// src/services/notification.service.js
const prisma = require('../config/database').prisma;
const logger = require('../config/logger');

exports.notify = async (userId, { title, body, type, meta = {} }) => {
  try {
    await prisma.notification.create({
      data: { userId, title, body, type, metadata: meta },
    });
  } catch (err) {
    logger.error('Failed to create notification:', err.message);
  }
};

exports.notifyMany = async (userIds, payload) => {
  try {
    await prisma.notification.createMany({
      data: userIds.map(userId => ({
        userId,
        title:    payload.title,
        body:     payload.body,
        type:     payload.type,
        metadata: payload.meta || {},
      })),
    });
  } catch (err) {
    logger.error('Failed to create bulk notifications:', err.message);
  }
};
