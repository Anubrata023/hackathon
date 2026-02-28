// src/index.js
// GMC Scholarship Portal — Server Entry Point

require('dotenv').config();
const app = require('./app');
const logger = require('./config/logger');
const { connectRedis } = require('./config/redis');
const { connectDB } = require('./config/database');

const PORT = process.env.PORT || 4000;

async function bootstrap() {
  try {
    // Connect to database
    await connectDB();
    logger.info('✅ Database connected');

    // Connect to Redis
    await connectRedis();
    logger.info('✅ Redis connected');

    // Start server
    const server = app.listen(PORT, () => {
      logger.info(`🚀 GMC Scholarship API running on port ${PORT} [${process.env.NODE_ENV}]`);
      logger.info(`📖 Docs: http://localhost:${PORT}/api/v1/docs`);
    });

    // Graceful shutdown
    const shutdown = async (signal) => {
      logger.info(`${signal} received — shutting down gracefully`);
      server.close(() => {
        logger.info('HTTP server closed');
        process.exit(0);
      });
      setTimeout(() => process.exit(1), 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT',  () => shutdown('SIGINT'));

  } catch (err) {
    logger.error('Failed to start server:', err);
    process.exit(1);
  }
}

bootstrap();
