// src/config/database.js
const { PrismaClient } = require('@prisma/client');
const logger = require('./logger');

const prisma = new PrismaClient({
  log: [
    { level: 'query', emit: 'event' },
    { level: 'error', emit: 'stdout' },
    { level: 'warn',  emit: 'stdout' },
  ],
});

// Log slow queries in development
if (process.env.NODE_ENV === 'development') {
  prisma.$on('query', (e) => {
    if (e.duration > 100) {
      logger.warn(`Slow query (${e.duration}ms): ${e.query.substring(0, 120)}`);
    }
  });
}

async function connectDB() {
  await prisma.$connect();
}

module.exports = { prisma, connectDB };
