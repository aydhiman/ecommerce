// middleware/cache.js
import { cacheUtil } from '../config/redis.js';

/**
 * Middleware to cache GET requests
 * @param {number} ttl - Time to live in seconds (default: 3600)
 * @returns {Function} - Express middleware
 */
export const cacheMiddleware = (ttl = 3600) => {
    return async (req, res, next) => {
        // Only cache GET requests
        if (req.method !== 'GET') {
            return next();
        }

        // Create cache key from URL and query params
        const cacheKey = `cache:${req.originalUrl || req.url}`;

        try {
            // Try to get data from cache
            const cachedData = await cacheUtil.get(cacheKey);

            if (cachedData) {
                console.log(`✅ Cache HIT: ${cacheKey}`);
                return res.json(cachedData);
            }

            console.log(`❌ Cache MISS: ${cacheKey}`);

            // Store original res.json to intercept response
            const originalJson = res.json.bind(res);

            // Override res.json to cache the response
            res.json = (data) => {
                // Cache the response data (non-blocking)
                cacheUtil.set(cacheKey, data, ttl).catch(err => {
                    // Silently fail if Redis is unavailable
                });
                return originalJson(data);
            };

            next();
        } catch (err) {
            // If cache fails, continue without caching
            console.warn('Cache unavailable, continuing without cache');
            next();
        }
    };
};

/**
 * Middleware to invalidate cache for specific patterns
 * Used after POST, PUT, DELETE operations
 * @param {string[]} patterns - Cache key patterns to invalidate
 * @returns {Function} - Express middleware
 */
export const invalidateCache = (patterns = []) => {
    return async (req, res, next) => {
        // Store original send methods to intercept successful responses
        const originalJson = res.json.bind(res);
        const originalSend = res.send.bind(res);

        const invalidate = async () => {
            for (const pattern of patterns) {
                try {
                    await cacheUtil.delPattern(pattern);
                    console.log(`🗑️  Cache invalidated: ${pattern}`);
                } catch (err) {
                    console.error(`Failed to invalidate cache pattern ${pattern}:`, err);
                }
            }
        };

        // Override response methods
        res.json = function(data) {
            if (res.statusCode >= 200 && res.statusCode < 300) {
                invalidate().catch(console.error);
            }
            return originalJson(data);
        };

        res.send = function(data) {
            if (res.statusCode >= 200 && res.statusCode < 300) {
                invalidate().catch(console.error);
            }
            return originalSend(data);
        };

        next();
    };
};
