import passport from 'passport';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const authenticate = (req, res, next) => {
  // console.log('[Auth Middleware] Running for path:', req.path);
  // console.log('[Auth Middleware] Session:', req.session);
  // console.log('[Auth Middleware] IsAuthenticated (Passport)?', req.isAuthenticated());

  // 1) Passport session authentication
  if (req.isAuthenticated()) {
    // console.log('[Auth Middleware] Authenticated via session/passport.');
    req.userId = req.user.id;
    // Attach the full user object to the request
    User.findById(req.userId)
      .then(user => {
        if (user.banned) return res.status(403).json({ message: 'Account banned' });
        req.user = user; // Add user info to request
        return next();
      })
      .catch(err => {
        return res.status(500).json({ message: 'Server error' });
      });
    return;
  }

  // 2) Fallback: Check for JWT in cookie if not authenticated via session
  const token = req.cookies.accessToken;
  // console.log('[Auth Middleware] AccessToken cookie:', token ? 'Present' : 'Missing');

  if (!token) {
    // console.log('[Auth Middleware] No session, no token. Unauthorized.');
    return res.status(401).json({ message: 'Unauthorized: No session or token' });
  }

  // JWT verification
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // console.log('[Auth Middleware] Token verified. User ID:', decoded.id);
    req.userId = decoded.userId;
    User.findById(req.userId)
      .then(user => {
        if (!user) return res.status(401).json({ message: 'Unauthorized: User not found' });
        if (user.banned) return res.status(403).json({ message: 'Account banned' });
        req.user = user; // Attach user info to the request
        next();
      })
      .catch(err => {
        return res.status(500).json({ message: 'Server error' });
      });
  } catch (err) {
    // console.log('[Auth Middleware] Invalid token.', err.message);
    return res.status(401).json({ message: 'Unauthorized: Invalid token' });
  }
};

export const isAdmin = (req, res, next) => {
  // Ensure the user is an admin
  User.findById(req.userId)
    .then(user => {
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin only' });
      }
      next();
    })
    .catch(err => {
      return res.status(500).json({ message: 'Server error' });
    });
};
