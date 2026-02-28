// src/config/redis.js
const { createClient } = require('redis');
const logger = require('./logger');

const client = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  socket: { reconnectStrategy: (retries) => Math.min(retries * 100, 3000) },
});

client.on('error', (err) => logger.error('Redis error:', err.message));
client.on('reconnecting', () => logger.warn('Redis reconnecting...'));

async function connectRedis() {
  await client.connect();
}

module.exports = { client, connectRedis };
