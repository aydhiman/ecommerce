import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import Admin from '../models/Admin.js';
import User from '../models/User.js';
import Seller from '../models/Seller.js';

const router = express.Router();

// Middleware to verify admin authentication
const verifyAdmin = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication failed. No token provided.' });
    }
    
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secretKey');
    
    if (decoded.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
    }
    
    const admin = await Admin.findById(decoded.id);
    if (!admin || !admin.isActive) {
      return res.status(403).json({ error: 'Admin account not found or inactive.' });
    }
    
    req.admin = admin;
    next();
  } catch (error) {
    console.error('Admin auth error:', error.message);
    res.status(401).json({ error: 'Authentication failed. Invalid token.' });
  }
};

// Admin Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    const admin = await Admin.findOne({ email });
    if (!admin || !admin.isActive) {
      return res.status(401).json({ error: 'Invalid credentials or inactive account' });
    }
    
    const isMatch = await admin.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const token = jwt.sign(
      { id: admin._id, role: 'admin' }, 
      process.env.JWT_SECRET || 'secretKey', 
      { expiresIn: '7d' }
    );
    
    res.json({
      message: 'Admin logged in successfully',
      token,
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        permissions: admin.permissions
      }
    });
  } catch (err) {
    console.error('Admin login error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Admin Registration (protected - requires existing admin)
router.post('/register', verifyAdmin, async (req, res) => {
  try {
    // Only superadmin can create new admins
    if (req.admin.role !== 'superadmin') {
      return res.status(403).json({ error: 'Only superadmin can create new admin accounts' });
    }
    
    const { name, email, password, role, permissions } = req.body;
    
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }
    
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({ error: 'Email already in use' });
    }
    
    const admin = new Admin({ 
      name, 
      email, 
      password,
      role: role || 'admin',
      permissions: permissions || {}
    });
    await admin.save();
    
    res.status(201).json({
      message: 'Admin registered successfully',
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        permissions: admin.permissions
      }
    });
  } catch (err) {
    console.error('Admin registration error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get all users (with pagination)
router.get('/users', verifyAdmin, async (req, res) => {
  try {
    if (!req.admin.permissions.canManageUsers) {
      return res.status(403).json({ error: 'Permission denied' });
    }
    
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    const users = await User.find()
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await User.countDocuments();
    
    res.json({
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    console.error('Get users error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get all sellers (with pagination)
router.get('/sellers', verifyAdmin, async (req, res) => {
  try {
    if (!req.admin.permissions.canManageSellers) {
      return res.status(403).json({ error: 'Permission denied' });
    }
    
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    const sellers = await Seller.find()
      .select('-password')
      .populate('products', 'name price')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await Seller.countDocuments();
    
    res.json({
      sellers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    console.error('Get sellers error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Reset User Password
router.post('/users/:userId/reset-password', verifyAdmin, async (req, res) => {
  try {
    if (!req.admin.permissions.canResetPasswords) {
      return res.status(403).json({ error: 'Permission denied' });
    }
    
    const { userId } = req.params;
    const { newPassword } = req.body;
    
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    user.password = newPassword;
    await user.save();
    
    res.json({ 
      message: 'User password reset successfully',
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone
      }
    });
  } catch (err) {
    console.error('Reset user password error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Reset Seller Password
router.post('/sellers/:sellerId/reset-password', verifyAdmin, async (req, res) => {
  try {
    if (!req.admin.permissions.canResetPasswords) {
      return res.status(403).json({ error: 'Permission denied' });
    }
    
    const { sellerId } = req.params;
    const { newPassword } = req.body;
    
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }
    
    const seller = await Seller.findById(sellerId);
    if (!seller) {
      return res.status(404).json({ error: 'Seller not found' });
    }
    
    seller.password = newPassword;
    await seller.save();
    
    res.json({ 
      message: 'Seller password reset successfully',
      seller: {
        id: seller._id,
        name: seller.name,
        email: seller.email
      }
    });
  } catch (err) {
    console.error('Reset seller password error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Toggle user active status
router.patch('/users/:userId/toggle-status', verifyAdmin, async (req, res) => {
  try {
    if (!req.admin.permissions.canManageUsers) {
      return res.status(403).json({ error: 'Permission denied' });
    }
    
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Add isActive field if it doesn't exist
    if (user.isActive === undefined) {
      user.isActive = true;
    }
    user.isActive = !user.isActive;
    await user.save();
    
    res.json({ 
      message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
      user: {
        id: user._id,
        name: user.name,
        isActive: user.isActive
      }
    });
  } catch (err) {
    console.error('Toggle user status error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Toggle seller active status
router.patch('/sellers/:sellerId/toggle-status', verifyAdmin, async (req, res) => {
  try {
    if (!req.admin.permissions.canManageSellers) {
      return res.status(403).json({ error: 'Permission denied' });
    }
    
    const seller = await Seller.findById(req.params.sellerId);
    if (!seller) {
      return res.status(404).json({ error: 'Seller not found' });
    }
    
    seller.isActive = !seller.isActive;
    await seller.save();
    
    res.json({ 
      message: `Seller ${seller.isActive ? 'activated' : 'deactivated'} successfully`,
      seller: {
        id: seller._id,
        name: seller.name,
        isActive: seller.isActive
      }
    });
  } catch (err) {
    console.error('Toggle seller status error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get admin profile
router.get('/profile', verifyAdmin, async (req, res) => {
  try {
    res.json({
      admin: {
        id: req.admin._id,
        name: req.admin.name,
        email: req.admin.email,
        role: req.admin.role,
        permissions: req.admin.permissions
      }
    });
  } catch (err) {
    console.error('Get admin profile error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get dashboard statistics
router.get('/stats', verifyAdmin, async (req, res) => {
  try {
    const [usersCount, sellersCount, activeUsers, activeSellers] = await Promise.all([
      User.countDocuments(),
      Seller.countDocuments(),
      User.countDocuments({ isActive: { $ne: false } }),
      Seller.countDocuments({ isActive: true })
    ]);
    
    res.json({
      stats: {
        totalUsers: usersCount,
        totalSellers: sellersCount,
        activeUsers,
        activeSellers,
        inactiveUsers: usersCount - activeUsers,
        inactiveSellers: sellersCount - activeSellers
      }
    });
  } catch (err) {
    console.error('Get stats error:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
