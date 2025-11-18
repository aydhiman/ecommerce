import express from 'express';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

// Apply auth middleware to all seller routes
router.use(authMiddleware);

// Get products created by the logged-in seller
router.get('/products', async (req, res) => {
  try {
    const products = await Product.find({ seller: req.user._id });
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Get orders for the seller's products
router.get('/orders', async (req, res) => {
  try {
    const products = await Product.find({ seller: req.user._id });
    const productIds = products.map(p => p._id);
    const orders = await Order.find({ 'items.product': { $in: productIds } })
      .populate('user', 'name phone')
      .populate('items.product')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Update order status (seller can update status of orders containing their products)
router.patch('/orders/:orderId/status', async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid order status' });
    }

    const order = await Order.findById(req.params.orderId).populate('items.product');
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Verify seller owns at least one product in this order
    const sellerProducts = await Product.find({ seller: req.user._id });
    const sellerProductIds = sellerProducts.map(p => p._id.toString());
    const hasSellerProduct = order.items.some(item => 
      sellerProductIds.includes(item.product._id.toString())
    );

    if (!hasSellerProduct) {
      return res.status(403).json({ error: 'Access denied. This order does not contain your products.' });
    }

    order.status = status;
    if (status === 'delivered') {
      order.deliveredAt = new Date();
    }
    
    await order.save();
    
    const updatedOrder = await Order.findById(order._id)
      .populate('user', 'name phone')
      .populate('items.product');
    res.json(updatedOrder);
  } catch (err) {
    console.error('Update order status error:', err);
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

export default router;