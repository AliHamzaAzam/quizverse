import passport from 'passport';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const authenticate = (req, res, next) => {
  // console.log('[Auth Middleware] Running for path:', req.path);
  // console.log('[Auth Middleware] Session:', req.session);
  // console.log('[Auth Middleware] IsAuthenticated (Passport)?', req.isAuthenticated());

  if (req.isAuthenticated()) {
    // console.log('[Auth Middleware] Authenticated via session/passport.');
    req.userId = req.user.id; // Attach user ID from session
    return next();
  }

  // Fallback: Check for JWT in cookie if not authenticated via session
  const token = req.cookies.accessToken;
  // console.log('[Auth Middleware] AccessToken cookie:', token ? 'Present' : 'Missing');

  if (!token) {
    // console.log('[Auth Middleware] No session, no token. Unauthorized.');
    return res.status(401).json({ message: 'Unauthorized: No session or token' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // console.log('[Auth Middleware] Token verified. User ID:', decoded.id);
    req.userId = decoded.userId;
    // Optional: You might want to load the full user object here if needed
    // req.user = await User.findById(decoded.userId);
    next();
  } catch (err) {
    // console.log('[Auth Middleware] Invalid token.', err.message);
    return res.status(401).json({ message: 'Unauthorized: Invalid token' });
  }
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
