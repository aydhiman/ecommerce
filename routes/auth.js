import express from "express";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Seller from "../models/Seller.js";
import { validateUser, validateSeller, handleValidationErrors } from "../middleware/validation.js";
import { upload } from '../middleware/upload.js';

const router = express.Router();

// User registration
router.post("/register", validateUser, handleValidationErrors, async (req, res) => {
  try {
    const { name, phone, address, password } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ phone });
    if (existingUser) {
      return res.redirect("/register?error=Phone number already registered");
    }

    const user = new User({ name, phone, address, password });
    await user.save();
    
    // Auto-login after registration
    const token = jwt.sign({ id: user._id, role: "user" }, process.env.JWT_SECRET || "secretKey", { expiresIn: '7d' });
    res.cookie("token", token, { httpOnly: true, secure: process.env.NODE_ENV === 'production' });
    res.redirect("/products-list?message=Registration successful. Welcome!");
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update product
router.put('/products/:id', upload.single('image'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price, description, category, stock } = req.body;
    
    const product = await Product.findOne({ _id: id, seller: req.user._id });
    if (!product) {
      return res.status(404).json({ error: 'Product not found or unauthorized' });
    }

    const updateData = {
      name: name || product.name,
      price: price ? parseFloat(price) : product.price,
      description: description || product.description,
      category: category || product.category,
      stock: stock ? parseInt(stock) : product.stock
    };

    if (req.file) {
      updateData.image = req.file.filename;
    }

    const updatedProduct = await Product.findByIdAndUpdate(id, updateData, { new: true });
    res.json({ message: 'Product updated successfully', product: updatedProduct });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete product
router.delete('/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findOneAndDelete({ _id: id, seller: req.user._id });
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found or unauthorized' });
    }

    // Remove product from seller's products array
    await Seller.findByIdAndUpdate(req.user._id, { 
      $pull: { products: id } 
    });

    res.json({ message: 'Product deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get orders for seller's products
router.get('/orders', async (req, res) => {
  try {
    const products = await Product.find({ seller: req.user._id });
    const productIds = products.map(p => p._id);
    
    const orders = await Order.find({ 'items.product': { $in: productIds } })
      .populate('user', 'name phone address')
      .populate('items.product')
      .sort({ createdAt: -1 });
    
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update order status
router.put('/orders/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const validStatuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const order = await Order.findByIdAndUpdate(id, { status }, { new: true })
      .populate('user', 'name phone')
      .populate('items.product');
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json({ message: 'Order status updated', order });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;