import express from 'express';
import Product from '../models/Product.js';
import Seller from '../models/Seller.js';
import Order from '../models/Order.js';
import { upload } from '../middleware/upload.js';
import { validateProduct, handleValidationErrors } from '../middleware/validation.js';

const router = express.Router();

// Middleware to ensure user is a seller
const requireSeller = (req, res, next) => {
  if (req.userRole !== 'seller') {
    return res.status(403).json({ error: 'Seller access required' });
  }
  next();
};

router.use(requireSeller);

// Get seller dashboard data
router.get('/dashboard', async (req, res) => {
  try {
    const products = await Product.find({ seller: req.user._id });
    const orders = await Order.find({ 'items.product': { $in: products.map(p => p._id) } })
      .populate('user', 'name phone')
      .populate('items.product');
    
    res.json({
      seller: req.user,
      products,
      orders,
      stats: {
        totalProducts: products.length,
        totalOrders: orders.length,
        totalRevenue: orders.reduce((sum, order) => sum + order.totalPrice, 0)
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add product
router.post('/products', upload.single('image'), validateProduct, handleValidationErrors, async (req, res) => {
  try {
    const { name, price, description, category, stock } = req.body;
    
    const product = new Product({
      name,
      price: parseFloat(price),
      description,
      category,
      stock: parseInt(stock) || 0,
      image: req.file ? req.file.filename : 'default-product.jpg',
      seller: req.user._id
    });

    await product.save();
    
    // Add product to seller's products array
    await Seller.findByIdAndUpdate(req.user._id, { 
      $push: { products: product._id } 
    });

    res.json({ message: 'Product added successfully', product });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get seller's products
router.get('/products', async (req, res) => {
  try {
    const products = await Product.find({ seller: req.user._id }).sort({ createdAt: -1 });
    res.json(products);
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