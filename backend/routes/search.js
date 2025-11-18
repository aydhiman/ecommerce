// routes/search.js
import express from 'express';
import Product from '../models/Product.js';
import { cacheUtil } from '../config/redis.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Optional auth middleware for tracking searches
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const jwt = (await import('jsonwebtoken')).default;
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secretKey');
      
      if (decoded.role === 'user') {
        const User = (await import('../models/User.js')).default;
        req.user = await User.findById(decoded.id);
      } else if (decoded.role === 'seller') {
        const Seller = (await import('../models/Seller.js')).default;
        req.user = await Seller.findById(decoded.id);
      }
    }
  } catch (err) {
    // Ignore auth errors, continue as guest
  }
  next();
};

/**
 * Search products with Redis caching and tracking
 * GET /api/search?q=searchterm
 */
router.get('/', optionalAuth, async (req, res) => {
    try {
        const { q } = req.query;
        
        if (!q || q.trim() === '') {
            return res.status(400).json({ error: 'Search query is required' });
        }

        const searchQuery = q.trim().toLowerCase();
        const cacheKey = `search:${searchQuery}`;
        
        // Check cache first
        const cachedResults = await cacheUtil.get(cacheKey);
        if (cachedResults) {
            console.log(`✅ Cache HIT for search: "${searchQuery}"`);
            
            // Save to recent searches (if user is authenticated)
            if (req.user && req.user._id) {
                await cacheUtil.addRecentSearch(req.user._id.toString(), searchQuery);
            }
            
            return res.json(cachedResults);
        }

        console.log(`❌ Cache MISS for search: "${searchQuery}" - Fetching from MongoDB`);
        
        // Save to recent searches (if user is authenticated)
        if (req.user && req.user._id) {
            await cacheUtil.addRecentSearch(req.user._id.toString(), searchQuery);
        }

        // Search products from MongoDB
        const products = await Product.find({
            isActive: true,
            $or: [
                { name: { $regex: searchQuery, $options: 'i' } },
                { description: { $regex: searchQuery, $options: 'i' } },
                { category: { $regex: searchQuery, $options: 'i' } }
            ]
        }).populate('seller', 'name').limit(50);

        const result = {
            query: searchQuery,
            count: products.length,
            products,
            cached: false,
            timestamp: Date.now()
        };

        // Cache the search results for 5 minutes (300 seconds)
        await cacheUtil.set(cacheKey, result, 300);
        console.log(`💾 Cached search results for: "${searchQuery}"`);

        res.json(result);
    } catch (err) {
        console.error('Search error:', err);
        res.status(500).json({ error: 'Failed to search products' });
    }
});

/**
 * Get user's recent searches
 * GET /api/search/recent
 */
router.get('/recent', authMiddleware, async (req, res) => {
    try {
        if (!req.user || !req.user._id) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        const recentSearches = await cacheUtil.getRecentSearches(req.user._id.toString());
        
        res.json({
            count: recentSearches.length,
            searches: recentSearches
        });
    } catch (err) {
        console.error('Get recent searches error:', err);
        res.status(500).json({ error: 'Failed to fetch recent searches' });
    }
});

/**
 * Clear user's recent searches
 * DELETE /api/search/recent
 */
router.delete('/recent', authMiddleware, async (req, res) => {
    try {
        if (!req.user || !req.user._id) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        await cacheUtil.clearRecentSearches(req.user._id.toString());
        
        res.json({ message: 'Recent searches cleared successfully' });
    } catch (err) {
        console.error('Clear recent searches error:', err);
        res.status(500).json({ error: 'Failed to clear recent searches' });
    }
});

/**
 * Get recently viewed products
 * GET /api/search/recently-viewed
 */
router.get('/recently-viewed', authMiddleware, async (req, res) => {
    try {
        if (!req.user || !req.user._id) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        const limit = parseInt(req.query.limit) || 10;
        const recentlyViewed = await cacheUtil.getRecentlyViewed(req.user._id.toString(), limit);
        
        res.json({
            count: recentlyViewed.length,
            products: recentlyViewed
        });
    } catch (err) {
        console.error('Get recently viewed error:', err);
        res.status(500).json({ error: 'Failed to fetch recently viewed products' });
    }
});

export default router;
