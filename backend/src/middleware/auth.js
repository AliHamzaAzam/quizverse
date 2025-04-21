import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const authenticate = (req, res, next) => {
  // Check 1: Passport session (most common for web logins)
  if (req.isAuthenticated()) { // Passport adds this method if session is valid
    req.userId = req.user.id; // Attach user ID from session
    return next();
  }

  // Check 2: JWT Token (useful for API clients or alternative auth)
  const token = req.cookies?.accessToken;
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.userId = decoded.userId;
      // Optional: You might want to load the full user object here if needed
      // req.user = await User.findById(decoded.userId);
      return next();
    } catch (err) {
      // Invalid token
      return res.status(401).json({ message: 'Invalid token' });
    }
  }

  // If neither method authenticated the user
  return res.status(401).json({ message: 'Authentication required' });
};

export const isAdmin = async (req, res, next) => {
  try {
    const u = await User.findById(req.userId);
    if (!u || u.role !== 'admin') return res.status(403).json({ message: 'Admin only' });
    next();
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
};
