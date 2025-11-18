import express from 'express';
import Order from '../models/Order.js';
import Cart from '../models/Cart.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

// Apply authentication middleware to all order routes
router.use(authMiddleware);

// Get user's orders
router.get('/', async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .populate('items.product')
      .sort({ createdAt: -1 }); // Most recent first
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Get specific order by ID
router.get('/:orderId', async (req, res) => {
  try {
    const order = await Order.findOne({ 
      _id: req.params.orderId, 
      user: req.user._id 
    }).populate('items.product');
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

// Create new order from cart (form submission)
router.post('/order', async (req, res) => {
  try {
    // Get user's cart
    const cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
    
    if (!cart || cart.items.length === 0) {
      return res.redirect('/cart-view?error=empty');
    }
    
    // Check stock availability
    for (const item of cart.items) {
      if (!item.product) {
        return res.redirect('/cart-view?error=product_not_found');
      }
      if (item.product.stock < item.quantity) {
        return res.redirect(`/cart-view?error=insufficient_stock&product=${item.product.name}`);
      }
    }
    
    // Calculate total
    let total = 0;
    const orderItems = cart.items.map(item => {
      const itemTotal = item.product.price * item.quantity;
      total += itemTotal;
      return {
        product: item.product._id,
        quantity: item.quantity,
        price: item.product.price
      };
    });
    
    // Create order
    const order = new Order({
      user: req.user._id,
      items: orderItems,
      totalPrice: total,
      shippingAddress: req.user.address || 'No address provided',
      status: 'pending'
    });
    
    await order.save();
    
    // Decrement stock for each product
    const Product = (await import('../models/Product.js')).default;
    for (const item of cart.items) {
      await Product.findByIdAndUpdate(
        item.product._id,
        { $inc: { stock: -item.quantity } }
      );
    }
    
    // Clear cart after successful order
    cart.items = [];
    await cart.save();
    
    res.redirect('/orders-view?success=order');
  } catch (err) {
    console.error('Place order error:', err.message);
    res.redirect('/cart-view?error=order');
  }
});

// Create new order from cart (API)
router.post('/', async (req, res) => {
  try {
    const { shippingAddress, paymentMethod } = req.body;
    
    // Get user's cart
    const cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
    
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' });
    }
    
    // Check stock availability for all items
    for (const item of cart.items) {
      if (!item.product) {
        return res.status(400).json({ error: 'Product not found in cart' });
      }
      if (item.product.stock < item.quantity) {
        return res.status(400).json({ 
          error: `Insufficient stock for ${item.product.name}. Only ${item.product.stock} available.` 
        });
      }
    }
    
    // Calculate total and prepare order items
    let total = 0;
    const orderItems = cart.items.map(item => {
      const itemTotal = item.product.price * item.quantity;
      total += itemTotal;
      return {
        product: item.product._id,
        quantity: item.quantity,
        price: item.product.price
      };
    });
    
    // Create order
    const order = new Order({
      user: req.user._id,
      items: orderItems,
      totalPrice: total,
      shippingAddress: shippingAddress || req.user.address,
      status: 'pending'
    });
    
    await order.save();
    
    // Decrement stock for each product
    const Product = (await import('../models/Product.js')).default;
    for (const item of cart.items) {
      await Product.findByIdAndUpdate(
        item.product._id,
        { $inc: { stock: -item.quantity } }
      );
    }
    
    // Clear cart after successful order
    cart.items = [];
    await cart.save();
    
    // Return populated order
    const populatedOrder = await Order.findById(order._id).populate('items.product');
    res.status(201).json(populatedOrder);
  } catch (err) {
    console.error('Create order error:', err);
    res.status(500).json({ error: 'Failed to create order', details: err.message });
  }
});

// Update order status (for sellers or admin)
router.patch('/:orderId/status', async (req, res) => {
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
    
    // Check if user owns this order or is a seller of the products
    if (req.userRole === 'user' && order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    order.status = status;
    if (status === 'delivered') {
      order.deliveredAt = new Date();
    }
    
    await order.save();
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

// Cancel order
router.patch('/:orderId/cancel', async (req, res) => {
  try {
    const order = await Order.findOne({ 
      _id: req.params.orderId, 
      user: req.user._id 
    }).populate('items.product');
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    if (order.status === 'delivered') {
      return res.status(400).json({ error: 'Cannot cancel delivered order' });
    }
    
    if (order.status === 'cancelled') {
      return res.status(400).json({ error: 'Order is already cancelled' });
    }
    
    // Restore stock for cancelled orders
    const Product = (await import('../models/Product.js')).default;
    for (const item of order.items) {
      await Product.findByIdAndUpdate(
        item.product._id,
        { $inc: { stock: item.quantity } }
      );
    }
    
    order.status = 'cancelled';
    await order.save();
    
    const populatedOrder = await Order.findById(order._id).populate('items.product');
    res.json(populatedOrder);
  } catch (err) {
    console.error('Cancel order error:', err);
    res.status(500).json({ error: 'Failed to cancel order' });
  }
});

export default router;