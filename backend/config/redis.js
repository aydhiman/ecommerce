// config/redis.js
import { createClient } from 'redis';
import dotenv from 'dotenv';

dotenv.config();

// Create Redis client with Redis Cloud configuration
const redisClient = createClient({
    username: process.env.REDIS_USERNAME || 'default',
    password: process.env.REDIS_PASSWORD || '9eJwZYBIwu5YED9iW85oJckJdqp4PEZl',
    socket: {
        host: process.env.REDIS_HOST || 'redis-14455.c57.us-east-1-4.ec2.cloud.redislabs.com',
        port: parseInt(process.env.REDIS_PORT) || 14455
    }
});

// Event handlers
redisClient.on('connect', () => {
    console.log('✅ Successfully connected to Redis Cloud');
});

redisClient.on('error', (err) => {
    console.error('❌ Redis Client Error:', err.message);
    console.warn('⚠️  Server will continue without Redis caching');
});

redisClient.on('ready', () => {
    console.log('✅ Redis client is ready');
});

// Connect to Redis (don't block server startup if Redis fails)
redisClient.connect().catch((err) => {
    console.error('❌ Failed to connect to Redis:', err.message);
    console.warn('⚠️  Server will continue without Redis caching');
});

// Cache utility functions
export const cacheUtil = {
    /**
     * Get data from cache
     * @param {string} key - Cache key
     * @returns {Promise<any>} - Parsed cached data or null
     */
    async get(key) {
        try {
            const data = await redisClient.get(key);
            return data ? JSON.parse(data) : null;
        } catch (err) {
            console.error('Redis GET error:', err);
            return null;
        }
    },

    /**
     * Set data in cache
     * @param {string} key - Cache key
     * @param {any} value - Data to cache
     * @param {number} ttl - Time to live in seconds (default: 3600)
     * @returns {Promise<boolean>} - Success status
     */
    async set(key, value, ttl = 3600) {
        try {
            await redisClient.setEx(key, ttl, JSON.stringify(value));
            return true;
        } catch (err) {
            console.error('Redis SET error:', err);
            return false;
        }
    },

    /**
     * Delete data from cache
     * @param {string} key - Cache key
     * @returns {Promise<boolean>} - Success status
     */
    async del(key) {
        try {
            await redisClient.del(key);
            return true;
        } catch (err) {
            console.error('Redis DEL error:', err);
            return false;
        }
    },

    /**
     * Delete all keys matching a pattern
     * @param {string} pattern - Key pattern (e.g., 'products:*')
     * @returns {Promise<boolean>} - Success status
     */
    async delPattern(pattern) {
        try {
            const keys = await redisClient.keys(pattern);
            if (keys.length > 0) {
                await redisClient.del(...keys);
            }
            return true;
        } catch (err) {
            console.error('Redis DEL pattern error:', err);
            return false;
        }
    },

    /**
     * Check if key exists
     * @param {string} key - Cache key
     * @returns {Promise<boolean>} - Whether key exists
     */
    async exists(key) {
        try {
            const result = await redisClient.exists(key);
            return result === 1;
        } catch (err) {
            console.error('Redis EXISTS error:', err);
            return false;
        }
    },

    /**
     * Flush all cache data (use carefully!)
     * @returns {Promise<boolean>} - Success status
     */
    async flushAll() {
        try {
            await redisClient.flushAll();
            return true;
        } catch (err) {
            console.error('Redis FLUSHALL error:', err);
            return false;
        }
    },

    /**
     * Add a search query to user's recent searches
     * @param {string} userId - User ID
     * @param {string} searchQuery - Search term
     * @param {number} maxResults - Maximum number of recent searches to keep (default: 10)
     * @returns {Promise<boolean>} - Success status
     */
    async addRecentSearch(userId, searchQuery, maxResults = 10) {
        try {
            const key = `recent_searches:${userId}`;
            const timestamp = Date.now();
            const searchData = JSON.stringify({ query: searchQuery, timestamp });
            
            // Add to list (left push)
            await redisClient.lPush(key, searchData);
            
            // Trim to keep only maxResults items
            await redisClient.lTrim(key, 0, maxResults - 1);
            
            // Set expiration (30 days)
            await redisClient.expire(key, 30 * 24 * 60 * 60);
            
            return true;
        } catch (err) {
            console.error('Redis addRecentSearch error:', err);
            return false;
        }
    },

    /**
     * Get user's recent searches
     * @param {string} userId - User ID
     * @param {number} limit - Number of results to return (default: 10)
     * @returns {Promise<Array>} - Array of recent search objects
     */
    async getRecentSearches(userId, limit = 10) {
        try {
            const key = `recent_searches:${userId}`;
            const searches = await redisClient.lRange(key, 0, limit - 1);
            
            return searches.map(search => JSON.parse(search));
        } catch (err) {
            console.error('Redis getRecentSearches error:', err);
            return [];
        }
    },

    /**
     * Clear user's recent searches
     * @param {string} userId - User ID
     * @returns {Promise<boolean>} - Success status
     */
    async clearRecentSearches(userId) {
        try {
            const key = `recent_searches:${userId}`;
            await redisClient.del(key);
            return true;
        } catch (err) {
            console.error('Redis clearRecentSearches error:', err);
            return false;
        }
    },

    /**
     * Track recently viewed products
     * @param {string} userId - User ID
     * @param {Object} product - Product object
     * @param {number} maxProducts - Maximum products to keep (default: 20)
     * @returns {Promise<boolean>} - Success status
     */
    async addRecentlyViewed(userId, product, maxProducts = 20) {
        try {
            const key = `recently_viewed:${userId}`;
            const timestamp = Date.now();
            const productData = JSON.stringify({ ...product, viewedAt: timestamp });
            
            // Remove if already exists (to move it to front)
            await redisClient.lRem(key, 0, productData);
            
            // Add to front of list
            await redisClient.lPush(key, productData);
            
            // Trim to keep only maxProducts
            await redisClient.lTrim(key, 0, maxProducts - 1);
            
            // Set expiration (30 days)
            await redisClient.expire(key, 30 * 24 * 60 * 60);
            
            return true;
        } catch (err) {
            console.error('Redis addRecentlyViewed error:', err);
            return false;
        }
    },

    /**
     * Get recently viewed products
     * @param {string} userId - User ID
     * @param {number} limit - Number of products to return (default: 10)
     * @returns {Promise<Array>} - Array of product objects
     */
    async getRecentlyViewed(userId, limit = 10) {
        try {
            const key = `recently_viewed:${userId}`;
            const products = await redisClient.lRange(key, 0, limit - 1);
            
            return products.map(product => JSON.parse(product));
        } catch (err) {
            console.error('Redis getRecentlyViewed error:', err);
            return [];
        }
    }
};

// Graceful shutdown
process.on('SIGTERM', async () => {
    await redisClient.quit();
});

export default redisClient;
