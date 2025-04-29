import passport from 'passport';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Authenticate via session or JWT, and enforce non-banned status
export const authenticate = async (req, res, next) => {
  // 1) Passport session
  if (req.isAuthenticated()) {
    req.userId = req.user.id;
    // attach full user for downstream
    req.user = await User.findById(req.userId);
    if (req.user.banned) return res.status(403).json({ message: 'Account banned' });
    return next();
  }

  // 2) JWT fallback
  const token = req.cookies.accessToken;
  if (!token) return res.status(401).json({ message: 'Unauthorized: No session or token' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    req.user = await User.findById(req.userId);
    if (!req.user) return res.status(401).json({ message: 'Unauthorized: User not found' });
    if (req.user.banned) return res.status(403).json({ message: 'Account banned' });
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Unauthorized: Invalid token' });
  }
};

// Authorize admin only
export const isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Admin only' });
  next();
};
