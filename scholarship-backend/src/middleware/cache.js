// src/middleware/cache.js
// Redis-based response caching middleware

const { client: redis } = require('../config/redis');
const logger = require('../config/logger');

/**
 * cacheMiddleware(ttlSeconds)
 * Caches GET responses in Redis. Cache key = URL + query string.
 */
exports.cacheMiddleware = (ttlSeconds = 60) => async (req, res, next) => {
  if (req.method !== 'GET') return next();

  const cacheKey = `cache:${req.originalUrl}`;

  try {
    const cached = await redis.get(cacheKey);
    if (cached) {
      res.setHeader('X-Cache', 'HIT');
      return res.json(JSON.parse(cached));
    }
  } catch (err) {
    // Redis unavailable — fall through to real handler
    logger.warn('Cache read failed:', err.message);
  }

  // Intercept the response to cache it
  const originalJson = res.json.bind(res);
  res.json = async (body) => {
    try {
      if (res.statusCode === 200) {
        await redis.setEx(cacheKey, ttlSeconds, JSON.stringify(body));
      }
    } catch (err) {
      logger.warn('Cache write failed:', err.message);
    }
    res.setHeader('X-Cache', 'MISS');
    return originalJson(body);
  };

  next();
};
