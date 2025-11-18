import express from 'express';
import Cart from '../models/Cart.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

// Apply authentication middleware to all cart routes
router.use(authMiddleware);

// Middleware to check if user is a regular user (not seller)
const checkUserRole = (req, res, next) => {
  if (req.userRole !== 'user') {
    return res.status(403).json({ error: 'Only users can access cart' });
  }
  next();
};

// Get user's cart
router.get('/', checkUserRole, async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
    if (!cart) {
      return res.json({ items: [], total: 0 }); // Return empty cart instead of 404
    }
    res.json(cart);
  } catch (err) {
    console.error('Get cart error:', err);
    res.status(500).json({ error: 'Failed to fetch cart' });
  }
});

// Add or update item in cart
router.post('/add', checkUserRole, async (req, res) => {
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
    
    // Check if request accepts JSON (API call) or HTML (form submission)
    if (req.accepts('json') && !req.accepts('html')) {
      res.json(cart);
    } else {
      // Form submission - redirect to cart page
      res.redirect('/cart-view');
    }
  } catch (err) {
    console.error('Add to cart error:', err);
    if (req.accepts('json') && !req.accepts('html')) {
      res.status(500).json({ error: 'Failed to add to cart' });
    } else {
      res.redirect('/cart-view?error=add');
    }
  }
});

// Add or update item in cart (API route)
router.post('/', checkUserRole, async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;
    
    if (!productId) {
      return res.status(400).json({ error: 'Product ID is required' });
    }
    
    let cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      cart = new Cart({ user: req.user._id, items: [] });
    }

    const itemIndex = cart.items.findIndex(item => item.product.toString() === productId);

    if (itemIndex > -1) {
      // Add to existing quantity instead of replacing
      cart.items[itemIndex].quantity += parseInt(quantity);
    } else {
      cart.items.push({ product: productId, quantity: parseInt(quantity) });
    }

    await cart.save();
    const populatedCart = await Cart.findById(cart._id).populate('items.product');
    res.json(populatedCart);
  } catch (err) {
    console.error('Cart update error:', err);
    res.status(500).json({ error: 'Failed to update cart' });
  }
});

// Update item quantity in cart (form submission)
router.post('/update', checkUserRole, async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    const cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      return res.redirect('/cart-view?error=notfound');
    }

    const itemIndex = cart.items.findIndex(item => item.product.toString() === productId);
    
    if (itemIndex > -1) {
      cart.items[itemIndex].quantity = parseInt(quantity);
      await cart.save();
    }
    
    res.redirect('/cart-view');
  } catch (err) {
    console.error('Update cart error:', err);
    res.redirect('/cart-view?error=update');
  }
});

// Remove item from cart (form submission)
router.post('/remove', checkUserRole, async (req, res) => {
  try {
    const { productId } = req.body;
    const cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      return res.redirect('/cart-view?error=notfound');
    }

    cart.items = cart.items.filter(item => item.product.toString() !== productId);
    await cart.save();
    
    res.redirect('/cart-view');
  } catch (err) {
    console.error('Remove from cart error:', err);
    res.redirect('/cart-view?error=remove');
  }
});

// Remove item from cart (API)
router.delete('/:productId', checkUserRole, async (req, res) => {
  try {
    const { productId } = req.params;
    const cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      return res.status(404).json({ error: 'Cart not found' });
    }

    cart.items = cart.items.filter(item => item.product.toString() !== productId);
    await cart.save();
    
    const populatedCart = await Cart.findById(cart._id).populate('items.product');
    res.json(populatedCart);
  } catch (err) {
    res.status(500).json({ error: 'Failed to remove item from cart' });
  }
});

// Clear cart
router.delete('/', checkUserRole, async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    
    if (!cart) {
      return res.status(404).json({ error: 'Cart not found' });
    }

    cart.items = [];
    await cart.save();
    res.json(cart);
  } catch (err) {
    res.status(500).json({ error: 'Failed to clear cart' });
  }
});

export default router;