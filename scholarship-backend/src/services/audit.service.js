// src/services/audit.service.js
const prisma = require('../config/database').prisma;
const logger = require('../config/logger');

exports.log = async ({ action, userId, entityType, entityId, req, meta }) => {
  try {
    await prisma.auditLog.create({
      data: {
        userId:     userId || null,
        action,
        entityType: entityType || null,
        entityId:   entityId || null,
        metadata:   meta || {},
        ipAddress:  req?.ip || null,
      },
    });
  } catch (err) {
    logger.error('Audit log failed:', err.message);
  }
};
