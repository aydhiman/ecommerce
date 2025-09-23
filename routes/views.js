import express from 'express';
import jwt from 'jsonwebtoken';
import Product from '../models/Product.js';
import Cart from '../models/Cart.js';
import Order from '../models/Order.js';
import User from '../models/User.js';
import Seller from '../models/Seller.js';

const router = express.Router();

// Middleware to check authentication for views
const checkAuth = async (req, res, next) => {
  try {
    const token = req.cookies.token;
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secretKey');
      if (decoded.role === 'user') {
        req.user = await User.findById(decoded.id);
      } else if (decoded.role === 'seller') {
        req.user = await Seller.findById(decoded.id);
      }
      req.userRole = decoded.role;
    }
  } catch (error) {
    // Invalid token, continue without user
  }
  next();
};

// Home page
router.get('/', checkAuth, async (req, res) => {
  try {
    const products = await Product.find({ isActive: true }).limit(8).populate('seller', 'name');
    res.render('home', { 
      products, 
      user: req.user,
      userRole: req.userRole,
      layout: 'layout' 
    });
  } catch (err) {
    res.render('home', { 
      products: [], 
      user: req.user,
      userRole: req.userRole,
      error: 'Failed to load products',
      layout: 'layout' 
    });
  }
});

// Products list page
router.get('/products-list', checkAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 12;
    const skip = (page - 1) * limit;
    
    const products = await Product.find({ isActive: true })
      .populate('seller', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await Product.countDocuments({ isActive: true });
    const totalPages = Math.ceil(total / limit);

    res.render('products-list', {
      products,
      user: req.user,
      userRole: req.userRole,
      pagination: {
        current: page,
        total: totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
        next: page + 1,
        prev: page - 1
      },
      message: req.query.message,
      error: req.query.error,
      layout: 'layout'
    });
  } catch (err) {
    res.render('products-list', {
      products: [],
      user: req.user,
      userRole: req.userRole,
      error: 'Failed to load products',
      layout: 'layout'
    });
  }
});

// Product detail page
router.get('/product/:id', checkAuth, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('seller', 'name email');
    if (!product || !product.isActive) {
      return res.render('404', { layout: 'layout' });
    }
    
    res.render('product-detail', {
      product,
      user: req.user,
      userRole: req.userRole,
      layout: 'layout'
    });
  } catch (err) {
    res.render('404', { layout: 'layout' });
  }
});

// Cart view
router.get('/cart-view', checkAuth, async (req, res) => {
  if (!req.user || req.userRole !== 'user') {
    return res.redirect('/login?error=Please login as user to view cart');
  }

  try {
    const cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
    let totalPrice = 0;
    
    if (cart && cart.items) {
      totalPrice = cart.items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
    }

    res.render('cart', {
      cart,
      totalPrice,
      user: req.user,
      userRole: req.userRole,
      message: req.query.message,
      error: req.query.error,
      layout: 'layout'
    });
  } catch (err) {
    res.render('cart', {
      cart: null,
      totalPrice: 0,
      user: req.user,
      userRole: req.userRole,
      error: 'Failed to load cart',
      layout: 'layout'
    });
  }
});

// User orders view
router.get('/user/orders', checkAuth, async (req, res) => {
  if (!req.user || req.userRole !== 'user') {
    return res.redirect('/login?error=Please login as user to view orders');
  }

  try {
    const orders = await Order.find({ user: req.user._id })
      .populate('items.product')
      .sort({ createdAt: -1 });

    res.render('orders', {
      orders,
      user: req.user,
      userRole: req.userRole,
      message: req.query.message,
      error: req.query.error,
      layout: 'layout'
    });
  } catch (err) {
    res.render('orders', {
      orders: [],
      user: req.user,
      userRole: req.userRole,
      error: 'Failed to load orders',
      layout: 'layout'
    });
  }
});

// Seller dashboard
router.get('/seller/dashboard', checkAuth, async (req, res) => {
  if (!req.user || req.userRole !== 'seller') {
    return res.redirect('/login?error=Please login as seller to access dashboard');
  }

  try {
    const products = await Product.find({ seller: req.user._id }).sort({ createdAt: -1 });
    const orders = await Order.find({ 'items.product': { $in: products.map(p => p._id) } })
      .populate('user', 'name phone')
      .populate('items.product')
      .sort({ createdAt: -1 });

    const stats = {
      totalProducts: products.length,
      totalOrders: orders.length,
      totalRevenue: orders.reduce((sum, order) => sum + order.totalPrice, 0),
      pendingOrders: orders.filter(o => o.status === 'pending').length
    };

    res.render('seller-dashboard', {
      products,
      orders,
      stats,
      user: req.user,
      userRole: req.userRole,
      message: req.query.message,
      error: req.query.error,
      layout: 'layout'
    });
  } catch (err) {
    res.render('seller-dashboard', {
      products: [],
      orders: [],
      stats: { totalProducts: 0, totalOrders: 0, totalRevenue: 0, pendingOrders: 0 },
      user: req.user,
      userRole: req.userRole,
      error: 'Failed to load dashboard',
      layout: 'layout'
    });
  }
});

// Auth pages
router.get('/login', (req, res) => {
  res.render('login', {
    message: req.query.message,
    error: req.query.error,
    layout: 'layout'
  });
});

router.get('/register', (req, res) => {
  res.render('register', {
    message: req.query.message,
    error: req.query.error,
    layout: 'layout'
  });
});

// Handle cart actions (form submissions)
router.post('/cart/add', checkAuth, async (req, res) => {
  if (!req.user || req.userRole !== 'user') {
    return res.redirect('/login?error=Please login to add items to cart');
  }

  try {
    const { productId, quantity = 1 } = req.body;
    
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
    res.redirect('/cart-view?message=Item added to cart');
  } catch (err) {
    res.redirect('/cart-view?error=' + encodeURIComponent(err.message));
  }
});

router.post('/cart/remove', checkAuth, async (req, res) => {
  if (!req.user || req.userRole !== 'user') {
    return res.redirect('/login?error=Please login to modify cart');
  }

  try {
    const { productId } = req.body;
    const cart = await Cart.findOne({ user: req.user._id });
    
    if (cart) {
      cart.items = cart.items.filter(item => item.product.toString() !== productId);
      await cart.save();
    }

    res.redirect('/cart-view?message=Item removed from cart');
  } catch (err) {
    res.redirect('/cart-view?error=' + encodeURIComponent(err.message));
  }
});

router.post('/cart/update', checkAuth, async (req, res) => {
  if (!req.user || req.userRole !== 'user') {
    return res.redirect('/login?error=Please login to modify cart');
  }

  try {
    const { productId, quantity } = req.body;
    const cart = await Cart.findOne({ user: req.user._id });
    
    if (cart) {
      const item = cart.items.find(item => item.product.toString() === productId);
      if (item) {
        item.quantity = parseInt(quantity);
        await cart.save();
      }
    }

    res.redirect('/cart-view?message=Cart updated');
  } catch (err) {
    res.redirect('/cart-view?error=' + encodeURIComponent(err.message));
  }
});

// Place order
router.post('/user/order', checkAuth, async (req, res) => {
  if (!req.user || req.userRole !== 'user') {
    return res.redirect('/login?error=Please login to place order');
  }

  try {
    const cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
    
    if (!cart || cart.items.length === 0) {
      return res.redirect('/cart-view?error=Cart is empty');
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
    
    // Clear cart
    cart.items = [];
    await cart.save();

    res.redirect('/user/orders?message=Order placed successfully');
  } catch (err) {
    res.redirect('/cart-view?error=' + encodeURIComponent(err.message));
  }
});

// Seller product management
router.post('/seller/products', checkAuth, async (req, res) => {
  if (!req.user || req.userRole !== 'seller') {
    return res.redirect('/login?error=Please login as seller');
  }

  try {
    const { name, price, description, category, stock } = req.body;
    
    const product = new Product({
      name,
      price: parseFloat(price),
      description,
      category,
      stock: parseInt(stock) || 0,
      image: 'default-product.jpg', // Handle file upload separately
      seller: req.user._id
    });

    await product.save();
    
    await Seller.findByIdAndUpdate(req.user._id, { 
      $push: { products: product._id } 
    });

    res.redirect('/seller/dashboard?message=Product added successfully');
  } catch (err) {
    res.redirect('/seller/dashboard?error=' + encodeURIComponent(err.message));
  }
});

// Logout
router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.redirect('/login?message=Logged out successfully');
});

export default router;