import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Seller from '../models/Seller.js';

const authMiddleware = async (req, res, next) => {
  try {
    // Get token from Authorization header (Bearer token)
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('Auth error: No token provided');
      return res.status(401).json({ error: 'Authentication failed. No token provided.' });
    }
    
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secretKey');
    
    if (decoded.role === 'user') {
      const user = await User.findById(decoded.id);
      if (!user) {
        console.error('Auth error: User not found for id:', decoded.id);
        return res.status(404).json({ error: 'User not found.' });
      }
      req.user = user;
      req.userRole = 'user';
    } else if (decoded.role === 'seller') {
      const seller = await Seller.findById(decoded.id);
      if (!seller) {
        console.error('Auth error: Seller not found for id:', decoded.id);
        return res.status(404).json({ error: 'Seller not found.' });
      }
      req.user = seller;
      req.userRole = 'seller';
    } else {
      console.error('Auth error: Invalid role:', decoded.role);
      return res.status(403).json({ error: 'Invalid user role.' });
    }
    
    next();
  } catch (error) {
    console.error('Auth middleware error:', error.message);
    res.status(401).json({ error: 'Authentication failed. Invalid token.' });
  }
};

export { authMiddleware };
export default authMiddleware;