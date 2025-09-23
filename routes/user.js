import express from 'express';
import Order from '../models/Order.js';
import Cart from '../models/Cart.js';
import Product from '../models/Product.js';

const router = express.Router();

// Cart routes
router.get('/cart', async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
    res.json(cart || { items: [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/cart/add', async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;
    
    // Validate product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      cart = new Cart({ user: req.user._id, items: [] });
    }

    const itemIndex = cart.items.findIndex(item => item.product.toString() === productId);
    if (itemIndex > -1) {
      cart.items[itemIndex].quantity += parseInt(quantity);
    } else {
      cart.items.push({ product: productId, quantity: parseInt(quantity) });
    }

    await cart.save();
    res.json({ message: 'Item added to cart', cart });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/cart/remove/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    const cart = await Cart.findOne({ user: req.user._id });
    
    if (!cart) {
      return res.status(404).json({ error: 'Cart not found' });
    }

    cart.items = cart.items.filter(item => item.product.toString() !== productId);
    await cart.save();
    
    res.json({ message: 'Item removed from cart', cart });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/cart/update', async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    const cart = await Cart.findOne({ user: req.user._id });
    
    if (!cart) {
      return res.status(404).json({ error: 'Cart not found' });
    }

    const item = cart.items.find(item => item.product.toString() === productId);
    if (item) {
      item.quantity = parseInt(quantity);
      await cart.save();
    }
    
    res.json({ message: 'Cart updated', cart });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Order routes
router.post('/order', async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
    
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' });
    }

    // Calculate total price
    let totalPrice = 0;
    const orderItems = cart.items.map(item => {
      const itemTotal = item.product.price * item.quantity;
      totalPrice += itemTotal;
      return {
        product: item.product._id,
        quantity: item.quantity,
        price: item.product.price
      };
    });

    const order = new Order({
      user: req.user._id,
      items: orderItems,
      totalPrice,
      shippingAddress: req.user.address,
      status: 'pending'
    });

    await order.save();
    
    // Clear cart after order
    cart.items = [];
    await cart.save();

    res.json({ message: 'Order placed successfully', order });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/orders', async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .populate('items.product')
      .sort({ createdAt: -1 });
    
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/orders/:id', async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, user: req.user._id })
      .populate('items.product');
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;