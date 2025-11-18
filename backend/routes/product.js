import express from 'express';
import Product from '../models/Product.js';
import { validateProduct, handleValidationErrors } from '../middleware/validation.js';
import { cacheMiddleware } from '../middleware/cache.js';
import { cacheUtil } from '../config/redis.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Get all products (with caching - 5 minutes TTL)
router.get('/', cacheMiddleware(300), async (req, res) => {
  try {
    const { category } = req.query;
    
    // Build query
    const query = { isActive: true };
    if (category) {
      query.category = new RegExp(category, 'i'); // Case-insensitive category filter
    }
    
    const products = await Product.find(query).populate('seller', 'name');
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Optional auth middleware for tracking
const optionalAuth = async (req, res, next) => {
  try {
    const token = req.cookies.token;
    if (token) {
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

// Get product by ID (with caching - 10 minutes TTL) + Track recently viewed
router.get('/:id', optionalAuth, cacheMiddleware(600), async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('seller', 'name email');
    if (!product || !product.isActive) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    // Track recently viewed products (if user is authenticated)
    if (req.user && req.user._id) {
      const productData = {
        _id: product._id,
        name: product.name,
        price: product.price,
        image: product.image,
        category: product.category
      };
      await cacheUtil.addRecentlyViewed(req.user._id.toString(), productData);
    }
    
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// Create a new product (API endpoint for sellers) - protected
router.post('/', authMiddleware, validateProduct, handleValidationErrors, async (req, res) => {
  console.log('=== POST /products endpoint hit ===');
  console.log('User role:', req.userRole);
  console.log('User ID:', req.user?._id);
  console.log('Request body:', req.body);
  
  try {
    if (req.userRole !== 'seller') {
      console.error('Access denied - user role is:', req.userRole);
      return res.status(403).json({ error: 'Access denied. Only sellers can add products.' });
    }
    
    const { name, price, description, category, stock, image } = req.body;
    
    // Validate required fields
    if (!name || !price || !description || !category || stock === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const product = new Product({
      name,
      price: parseFloat(price),
      description,
      category,
      stock: parseInt(stock),
      image: image || '',
      seller: req.user._id,
    });
    
    console.log('Attempting to save product...');
    await product.save();
    console.log('✅ Product saved successfully:', product._id);
    
    // Invalidate cache asynchronously (don't block response)
    setTimeout(() => {
      cacheUtil.delPattern('cache:/api/products*').catch(() => {});
      cacheUtil.delPattern('search:*').catch(() => {});
    }, 0);
    
    res.status(201).json({ message: 'Product added successfully', product });
  } catch (err) {
    console.error('❌ Add product error:', err.message);
    console.error('Error stack:', err.stack);
    res.status(500).json({ error: 'Failed to add product', details: err.message });
  }
});

// Update existing product (seller only)
router.put('/:id', authMiddleware, validateProduct, handleValidationErrors, async (req, res) => {
  try {
    if (req.userRole !== 'seller') {
      return res.status(403).json({ error: 'Access denied. Only sellers can update products.' });
    }

    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    if (String(product.seller) !== String(req.user._id)) {
      return res.status(403).json({ error: 'Access denied. You can only edit your own products.' });
    }

    const { name, price, description, category, stock, image } = req.body;
    product.name = name || product.name;
    product.price = typeof price !== 'undefined' ? parseFloat(price) : product.price;
    product.description = description || product.description;
    product.category = category || product.category;
    product.stock = typeof stock !== 'undefined' ? parseInt(stock) : product.stock;
    product.image = image || product.image;

    await product.save();
    
    // Invalidate cache asynchronously (don't block response)
    cacheUtil.delPattern('cache:/api/products*').catch(err => console.error('Cache invalidation error:', err));
    cacheUtil.delPattern('search:*').catch(err => console.error('Cache invalidation error:', err));
    
    res.json({ message: 'Product updated successfully', product });
  } catch (err) {
    console.error('Update product error:', err.message);
    res.status(500).json({ error: 'Failed to update product', details: err.message });
  }
});

export default router;