import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Seller from '../models/Seller.js';
import { validateUser, validateSeller, validateLogin, validateSellerLogin, handleValidationErrors } from '../middleware/validation.js';

const router = express.Router();

// User Registration - REST API
router.post('/register', validateUser, handleValidationErrors, async (req, res) => {
  try {
    const { name, phone, password, address } = req.body;
    const existingUser = await User.findOne({ phone });
    if (existingUser) {
      return res.status(400).json({ error: 'Phone number already in use' });
    }
    const user = new User({ name, phone, password, address });
    await user.save();
    
    // Generate token
    const token = jwt.sign(
      { id: user._id, role: 'user' }, 
      process.env.JWT_SECRET || 'secretKey', 
      { expiresIn: '7d' }
    );
    
    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        address: user.address,
        role: 'user'
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// User Login - REST API
router.post('/login', validateLogin, handleValidationErrors, async (req, res) => {
  try {
    const { phone, password } = req.body;
    const user = await User.findOne({ phone });
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ error: 'Invalid phone or password' });
    }
    
    const token = jwt.sign(
      { id: user._id, role: 'user' }, 
      process.env.JWT_SECRET || 'secretKey', 
      { expiresIn: '7d' }
    );
    
    res.json({
      message: 'Logged in successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        address: user.address,
        role: 'user'
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Seller Registration - REST API
router.post('/seller/register', validateSeller, handleValidationErrors, async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const existingSeller = await Seller.findOne({ email });
    if (existingSeller) {
      return res.status(400).json({ error: 'Email already in use' });
    }
    
    const seller = new Seller({ name, email, password });
    await seller.save();
    
    const token = jwt.sign(
      { id: seller._id, role: 'seller' }, 
      process.env.JWT_SECRET || 'secretKey', 
      { expiresIn: '7d' }
    );
    
    res.status(201).json({
      message: 'Seller registered successfully',
      token,
      user: {
        id: seller._id,
        name: seller.name,
        email: seller.email,
        role: 'seller'
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Seller Login - REST API
router.post('/seller/login', validateSellerLogin, handleValidationErrors, async (req, res) => {
  try {
    const { email, password } = req.body;
    const seller = await Seller.findOne({ email });
    if (!seller || !(await seller.matchPassword(password))) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    const token = jwt.sign(
      { id: seller._id, role: 'seller' }, 
      process.env.JWT_SECRET || 'secretKey', 
      { expiresIn: '7d' }
    );
    
    res.json({
      message: 'Logged in successfully',
      token,
      user: {
        id: seller._id,
        name: seller.name,
        email: seller.email,
        role: 'seller'
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Logout - REST API
router.post('/logout', (req, res) => {
  res.json({ message: 'Logged out successfully' });
});

// Get Current User
router.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secretKey');
    
    let user;
    if (decoded.role === 'user') {
      user = await User.findById(decoded.id).select('-password');
    } else if (decoded.role === 'seller') {
      user = await Seller.findById(decoded.id).select('-password');
    }
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        address: user.address,
        role: decoded.role
      }
    });
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

export default router;
