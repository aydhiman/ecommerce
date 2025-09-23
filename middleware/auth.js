import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Seller from '../models/Seller.js';

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.cookies.token;
    
    if (!token) {
      if (req.accepts('html')) {
        return res.redirect('/login?error=Please login to continue');
      }
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secretKey');
    
    if (decoded.role === 'user') {
      req.user = await User.findById(decoded.id);
    } else if (decoded.role === 'seller') {
      req.user = await Seller.findById(decoded.id);
    }
    
    if (!req.user) {
      if (req.accepts('html')) {
        return res.redirect('/login?error=Invalid token');
      }
      return res.status(401).json({ error: 'Invalid token' });
    }

    req.userRole = decoded.role;
    next();
  } catch (error) {
    if (req.accepts('html')) {
      return res.redirect('/login?error=Authentication failed');
    }
    res.status(401).json({ error: 'Authentication failed' });
  }
};

export default authMiddleware;