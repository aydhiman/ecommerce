import express from 'express';
import jwt from 'jsonwebtoken';
import Product from '../models/Product.js';
import Cart from '../models/Cart.js';
import Order from '../models/Order.js';
import User from '../models/User.js';
import Seller from '../models/Seller.js';
import uploadMiddleware from '../middleware/upload.js';

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
      title: 'Home - E-Commerce Platform'
    });
  } catch (err) {
    res.render('home', {
      products: [],
      user: req.user,
      userRole: req.userRole,
      error: 'Failed to load products',
      title: 'Home - E-Commerce Platform'
    });
  }
});

// Redirect /products to /products-list for backward compatibility
router.get('/products', (req, res) => {
  res.redirect('/products-list');
});

// Products list page
router.get('/products-list', checkAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 12;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';
    const category = req.query.category || '';
    const priceRange = req.query.price || '';

    // Build search query
    let searchQuery = { isActive: true };
    
    if (search) {
      searchQuery.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (category) {
      searchQuery.category = category;
    }
    
    if (priceRange) {
      if (priceRange === '0-500') {
        searchQuery.price = { $gte: 0, $lte: 500 };
      } else if (priceRange === '500-1000') {
        searchQuery.price = { $gt: 500, $lte: 1000 };
      } else if (priceRange === '1000-5000') {
        searchQuery.price = { $gt: 1000, $lte: 5000 };
      } else if (priceRange === '5000-10000') {
        searchQuery.price = { $gt: 5000, $lte: 10000 };
      } else if (priceRange === '10000+') {
        searchQuery.price = { $gt: 10000 };
      }
    }

    const products = await Product.find(searchQuery)
      .populate('seller', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Product.countDocuments(searchQuery);
    const totalPages = Math.ceil(total / limit);

    res.render('products-list', {
      products,
      user: req.user,
      userRole: req.userRole,
      search: {
        term: search,
        category: category,
        price: priceRange
      },
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
      title: search ? `Search: ${search} - E-Commerce Platform` : 'Products - E-Commerce Platform'
    });
  } catch (err) {
    res.render('products-list', {
      products: [],
      user: req.user,
      userRole: req.userRole,
      search: { term: '', category: '', price: '' },
      error: 'Failed to load products',
      title: 'Products - E-Commerce Platform'
    });
  }
});

// Product detail page
router.get('/product/:id', checkAuth, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('seller', 'name email');
    if (!product || !product.isActive) {
      return res.render('404', {
        user: req.user,
        userRole: req.userRole,
        title: '404 - Page Not Found'
      });
    }

    res.render('products-details', {
      product,
      user: req.user,
      userRole: req.userRole,
      title: `${product.name} - E-Commerce Platform`
    });
  } catch (err) {
    res.render('404', {
      user: req.user,
      userRole: req.userRole,
      title: '404 - Page Not Found'
    });
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
      title: 'Shopping Cart - E-Commerce Platform'
    });
  } catch (err) {
    res.render('cart', {
      cart: null,
      totalPrice: 0,
      user: req.user,
      userRole: req.userRole,
      error: 'Failed to load cart',
      title: 'Shopping Cart - E-Commerce Platform'
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

    // Format date function
    const formatDate = (date) => {
      return new Date(date).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    };

    res.render('orders', {
      orders,
      user: req.user,
      userRole: req.userRole,
      message: req.query.message,
      error: req.query.error,
      formatDate,
      title: 'My Orders - E-Commerce Platform'
    });
  } catch (err) {
    const formatDate = (date) => {
      return new Date(date).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    };

    res.render('orders', {
      orders: [],
      user: req.user,
      userRole: req.userRole,
      error: 'Failed to load orders',
      formatDate,
      title: 'My Orders - E-Commerce Platform'
    });
  }
});

// One-time fix route to clean up products without proper seller associations
router.get('/admin/fix-products', async (req, res) => {
  try {
    // Find products without seller or with null seller
    const orphanedProducts = await Product.find({
      $or: [
        { seller: null },
        { seller: { $exists: false } }
      ]
    });

    if (orphanedProducts.length > 0) {
      // Delete orphaned products
      await Product.deleteMany({
        $or: [
          { seller: null },
          { seller: { $exists: false } }
        ]
      });
      
      res.json({ 
        success: true, 
        message: `Cleaned up ${orphanedProducts.length} orphaned products`,
        deletedProducts: orphanedProducts.map(p => ({ id: p._id, name: p.name }))
      });
    } else {
      res.json({ 
        success: true, 
        message: 'No orphaned products found. Database is clean.' 
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Seller dashboard
router.get('/seller/dashboard', checkAuth, async (req, res) => {
  if (!req.user || req.userRole !== 'seller') {
    return res.redirect('/login?error=Please login as seller to access dashboard');
  }

  try {
    // Ensure we only get products that belong to this specific seller and have a valid seller field
    const products = await Product.find({ 
      seller: req.user._id,
      $and: [
        { seller: { $exists: true } },
        { seller: { $ne: null } }
      ]
    }).sort({ createdAt: -1 });
    
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
      title: 'Seller Dashboard - E-Commerce Platform'
    });
  } catch (err) {
    res.render('seller-dashboard', {
      products: [],
      orders: [],
      stats: { totalProducts: 0, totalOrders: 0, totalRevenue: 0, pendingOrders: 0 },
      user: req.user,
      userRole: req.userRole,
      error: 'Failed to load dashboard',
      title: 'Seller Dashboard - E-Commerce Platform'
    });
  }
});

// Add Product (GET) - Display form
router.get('/add-product', checkAuth, (req, res) => {
  if (!req.user || req.userRole !== 'seller') {
    return res.redirect('/login?error=Access denied. Seller login required.');
  }

  res.render('add-product', {
    title: 'Add Product - E-Commerce Platform',
    user: req.user,
    userRole: req.userRole,
    message: req.query.message,
    error: req.query.error
  });
});

// Add Product (POST) - Handle form submission
router.post('/add-product', checkAuth, uploadMiddleware.single('image'), async (req, res) => {
  if (!req.user || req.userRole !== 'seller') {
    return res.redirect('/login?error=Access denied. Seller login required.');
  }

  try {
    const { name, description, price, category, stock, brand, isActive } = req.body;

    // Validation
    if (!name || !description || !price || !category || stock === undefined) {
      return res.redirect('/add-product?error=Please fill all required fields');
    }

    if (parseFloat(price) <= 0) {
      return res.redirect('/add-product?error=Price must be greater than 0');
    }

    if (parseInt(stock) < 0) {
      return res.redirect('/add-product?error=Stock cannot be negative');
    }

    // Create new product
    const productData = {
      name: name.trim(),
      description: description.trim(),
      price: parseFloat(price),
      category: category.trim(),
      stock: parseInt(stock),
      seller: req.user._id,
      isActive: isActive === 'on' || isActive === true
    };

    // Add brand if provided
    if (brand && brand.trim()) {
      productData.brand = brand.trim();
    }

    // Add image if uploaded
    if (req.file) {
      productData.image = `/uploads/${req.file.filename}`;
    } else {
      productData.image = '/uploads/default-product.jpg';
    }

    const product = new Product(productData);
    await product.save();

    res.redirect('/seller/dashboard?message=Product added successfully!');

  } catch (error) {
    console.error('Error adding product:', error);
    if (error.name === 'ValidationError') {
      const errorMessages = Object.values(error.errors).map(err => err.message);
      return res.redirect(`/add-product?error=${encodeURIComponent(errorMessages.join(', '))}`);
    }
    res.redirect('/add-product?error=Failed to add product. Please try again.');
  }
});

// Edit Product (GET) - Display edit form
router.get('/edit-product/:id', checkAuth, async (req, res) => {
  if (!req.user || req.userRole !== 'seller') {
    return res.redirect('/login?error=Access denied. Seller login required.');
  }

  try {
    const product = await Product.findOne({ 
      _id: req.params.id, 
      seller: req.user._id,
      $and: [
        { seller: { $exists: true } },
        { seller: { $ne: null } }
      ]
    });
    
    if (!product) {
      return res.redirect('/seller/dashboard?error=Product not found or access denied');
    }

    res.render('edit-product', {
      title: 'Edit Product - E-Commerce Platform',
      user: req.user,
      userRole: req.userRole,
      product,
      message: req.query.message,
      error: req.query.error
    });
  } catch (error) {
    console.error('Error loading product for edit:', error);
    res.redirect('/seller/dashboard?error=Failed to load product');
  }
});

// Edit Product (POST) - Handle form submission
router.post('/edit-product/:id', checkAuth, uploadMiddleware.single('image'), async (req, res) => {
  if (!req.user || req.userRole !== 'seller') {
    return res.redirect('/login?error=Access denied. Seller login required.');
  }

  try {
    const { name, description, price, category, stock, brand, isActive } = req.body;

    // Find the product and ensure it belongs to the seller
    const product = await Product.findOne({ 
      _id: req.params.id, 
      seller: req.user._id,
      $and: [
        { seller: { $exists: true } },
        { seller: { $ne: null } }
      ]
    });
    if (!product) {
      return res.redirect('/seller/dashboard?error=Product not found or access denied');
    }

    // Validation
    if (!name || !description || !price || !category || stock === undefined) {
      return res.redirect(`/edit-product/${req.params.id}?error=Please fill all required fields`);
    }

    if (parseFloat(price) <= 0) {
      return res.redirect(`/edit-product/${req.params.id}?error=Price must be greater than 0`);
    }

    if (parseInt(stock) < 0) {
      return res.redirect(`/edit-product/${req.params.id}?error=Stock cannot be negative`);
    }

    // Update product data
    product.name = name.trim();
    product.description = description.trim();
    product.price = parseFloat(price);
    product.category = category.trim();
    product.stock = parseInt(stock);
    product.isActive = isActive === 'on' || isActive === true;

    // Update brand if provided
    if (brand && brand.trim()) {
      product.brand = brand.trim();
    } else {
      product.brand = undefined;
    }

    // Update image if a new one was uploaded
    if (req.file) {
      product.image = `/uploads/${req.file.filename}`;
    }

    await product.save();
    res.redirect('/seller/dashboard?message=Product updated successfully!');

  } catch (error) {
    console.error('Error updating product:', error);
    if (error.name === 'ValidationError') {
      const errorMessages = Object.values(error.errors).map(err => err.message);
      return res.redirect(`/edit-product/${req.params.id}?error=${encodeURIComponent(errorMessages.join(', '))}`);
    }
    res.redirect(`/edit-product/${req.params.id}?error=Failed to update product. Please try again.`);
  }
});

// Toggle Product Status (POST)
router.post('/toggle-product-status/:id', checkAuth, async (req, res) => {
  if (!req.user || req.userRole !== 'seller') {
    return res.status(403).json({ success: false, message: 'Access denied' });
  }

  try {
    // Ensure the product exists and belongs to the authenticated seller
    const product = await Product.findOne({ 
      _id: req.params.id, 
      seller: req.user._id,
      $and: [
        { seller: { $exists: true } },
        { seller: { $ne: null } }
      ]
    });
    
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found or access denied' });
    }

    product.isActive = !product.isActive;
    await product.save();

    res.json({ 
      success: true, 
      message: `Product ${product.isActive ? 'activated' : 'deactivated'} successfully`,
      isActive: product.isActive 
    });
  } catch (error) {
    console.error('Error toggling product status:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Quick Update Stock (POST)
router.post('/quick-update-stock/:id', checkAuth, async (req, res) => {
  if (!req.user || req.userRole !== 'seller') {
    return res.status(403).json({ success: false, message: 'Access denied' });
  }

  try {
    const { stock } = req.body;
    
    if (stock < 0) {
      return res.status(400).json({ success: false, message: 'Stock cannot be negative' });
    }

    const product = await Product.findOne({ _id: req.params.id, seller: req.user._id });
    
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    product.stock = parseInt(stock);
    await product.save();

    res.json({ 
      success: true, 
      message: 'Stock updated successfully',
      stock: product.stock 
    });
  } catch (error) {
    console.error('Error updating stock:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Bulk Update Products (POST)
router.post('/bulk-update-products', checkAuth, async (req, res) => {
  if (!req.user || req.userRole !== 'seller') {
    return res.status(403).json({ success: false, message: 'Access denied' });
  }

  try {
    const { productIds, action, stock, isActive, category } = req.body;

    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({ success: false, message: 'No products selected' });
    }

    // Verify all products belong to the seller and have valid seller fields
    const products = await Product.find({ 
      _id: { $in: productIds }, 
      seller: req.user._id,
      $and: [
        { seller: { $exists: true } },
        { seller: { $ne: null } }
      ]
    });

    if (products.length !== productIds.length) {
      return res.status(403).json({ success: false, message: 'Some products not found or access denied' });
    }

    let updateData = {};
    
    switch(action) {
      case 'updateStock':
        if (stock < 0) {
          return res.status(400).json({ success: false, message: 'Stock cannot be negative' });
        }
        updateData.stock = parseInt(stock);
        break;
      case 'updateStatus':
        updateData.isActive = isActive;
        break;
      case 'updateCategory':
        if (!category) {
          return res.status(400).json({ success: false, message: 'Category is required' });
        }
        updateData.category = category;
        break;
      default:
        return res.status(400).json({ success: false, message: 'Invalid action' });
    }

    await Product.updateMany(
      { 
        _id: { $in: productIds }, 
        seller: req.user._id,
        $and: [
          { seller: { $exists: true } },
          { seller: { $ne: null } }
        ]
      },
      updateData
    );

    res.json({ 
      success: true, 
      message: `Successfully updated ${productIds.length} products`,
      updatedCount: productIds.length
    });
  } catch (error) {
    console.error('Error bulk updating products:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Auth pages
router.get('/login', (req, res) => {
  res.render('login', {
    message: req.query.message,
    error: req.query.error,
    title: 'Login - E-Commerce Platform'
  });
});

router.get('/register', (req, res) => {
  res.render('register', {
    message: req.query.message,
    error: req.query.error,
    title: 'Register - E-Commerce Platform'
  });
});

// Handle cart actions (form submissions)
router.post('/cart/add', checkAuth, async (req, res) => {
  if (!req.user) {
    return res.redirect('/login?error=Please login to add items to cart');
  }
  
  if (req.userRole !== 'user') {
    if (req.userRole === 'seller') {
      return res.redirect('/seller/dashboard?error=Sellers cannot purchase products. Use your seller dashboard to manage your business.');
    }
    return res.redirect('/login?error=Only customers can add items to cart');
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

    console.log('Order data:', {
      user: req.user._id,
      items: orderItems,
      totalPrice,
      shippingAddress: req.user.address || 'No address provided'
    });

    const order = new Order({
      user: req.user._id,
      items: orderItems,
      totalPrice: totalPrice,
      shippingAddress: req.user.address || 'No address provided',
      status: 'pending'
    });

    await order.save();

    // Clear cart
    cart.items = [];
    await cart.save();

    res.redirect('/user/orders?message=Order placed successfully');
  } catch (err) {
    console.error('Place order error:', err);
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

// Update order status (for sellers)
router.post('/seller/order/update-status', checkAuth, async (req, res) => {
  if (!req.user || req.userRole !== 'seller') {
    return res.redirect('/login?error=Please login as seller to update orders');
  }

  try {
    const { orderId, status } = req.body;
    
    // Verify seller owns products in this order
    const order = await Order.findById(orderId).populate('items.product');
    if (!order) {
      return res.redirect('/seller/dashboard?error=Order not found');
    }

    // Check if seller owns at least one product in the order
    const sellerProducts = await Product.find({ seller: req.user._id });
    const sellerProductIds = sellerProducts.map(p => p._id.toString());
    const orderHasSellerProduct = order.items.some(item => 
      sellerProductIds.includes(item.product._id.toString())
    );

    if (!orderHasSellerProduct) {
      return res.redirect('/seller/dashboard?error=You can only update orders for your products');
    }

    // Update order status
    await Order.findByIdAndUpdate(orderId, { status });

    res.redirect('/seller/dashboard?message=Order status updated successfully');
  } catch (err) {
    console.error('Update order status error:', err);
    res.redirect('/seller/dashboard?error=' + encodeURIComponent(err.message));
  }
});

// Logout
router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.redirect('/login?message=Logged out successfully');
});

export default router;