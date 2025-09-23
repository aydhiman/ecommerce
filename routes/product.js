import express from 'express';
import Product from '../models/Product.js';

const router = express.Router();

// Get all products with pagination
router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const products = await Product.find({ isActive: true })
      .populate('seller', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Product.countDocuments({ isActive: true });

    res.json({
      products,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (err) {
    console.error("Cannot find products:", err.message);
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

// Search products
router.get("/search", async (req, res) => {
  try {
    const { name, description, price, category, minPrice, maxPrice } = req.query;
    const query = { isActive: true };
    
    if (name) {
      query.name = { $regex: name, $options: "i" };
    }
    if (description) {
      query.description = { $regex: description, $options: "i" };
    }
    if (category) {
      query.category = { $regex: category, $options: "i" };
    }
    if (price) {
      query.price = parseFloat(price);
    }
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }

    const products = await Product.find(query).populate('seller', 'name email');
    res.json(products);
  } catch (err) {
    console.error("Cannot search products:", err.message);
    res.status(500).json({ error: "Product search failed" });
  }
});

// Get product by ID
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id).populate('seller', 'name email');
    
    if (!product || !product.isActive) {
      return res.status(404).json({ error: "Product not found" });
    }
    
    res.json(product);
  } catch (err) {
    console.error("Cannot find product by ID:", err.message);
    res.status(404).json({ error: "Product not found" });
  }
});

// Get products by category
router.get("/category/:category", async (req, res) => {
  try {
    const { category } = req.params;
    const products = await Product.find({ 
      category: { $regex: category, $options: "i" }, 
      isActive: true 
    }).populate('seller', 'name email');
    
    res.json(products);
  } catch (err) {
    console.error("Cannot find products by category:", err.message);
    res.status(500).json({ error: "Failed to fetch products by category" });
  }
});

export default router;