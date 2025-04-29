// routes/auth.js
import express from 'express';
import bcrypt from 'bcryptjs';
import passport from 'passport';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { authenticate, isAdmin } from '../middleware/auth.js';
import { z } from 'zod';
import multer from 'multer';
import { storage } from '../utils/cloudinary.js';

const upload = multer({ storage });
const router = express.Router();

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  displayName: z.string().min(1),
  age: z.string()
    .refine(val => !isNaN(parseInt(val)) && parseInt(val) > 0, { message: "Age must be a positive number" }),
  accentColor: z.string().optional()
});


// Helper to generate JWTs
function generateToken(user, expiresIn, isRefresh = false) {
  return jwt.sign(
    { userId: user._id },
    isRefresh ? process.env.JWT_REFRESH_SECRET : process.env.JWT_SECRET,
    { expiresIn }
  );
}

  const isProd = process.env.NODE_ENV === 'production' ||
      process.env.RAILWAY_STATIC_URL !== undefined ||
      (process.env.CLIENT_URL && process.env.CLIENT_URL.includes('vercel.app'));

  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    sameSite: isProd ? 'None' : 'Lax',
    secure: isProd,
    maxAge: 15 * 60 * 1000 // 15 minutes
  });

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    sameSite: isProd ? 'None' : 'Lax',
    secure: isProd,
    path: '/api/auth/refresh',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });
}

// Remove sensitive fields before sending user to client
function safeUser(user) {
  const { password, ...safeData } = user.toObject();
  return safeData;
}

// Signup
router.post('/signup', upload.single('avatar'), async (req, res) => {
  try {
    const parsed = signupSchema.parse(req.body);
    const hashed = await bcrypt.hash(parsed.password, 12);

    const user = await User.create({
      email: parsed.email,
      password: hashed,
      firstName: parsed.firstName,
      lastName: parsed.lastName,
      displayName: parsed.displayName,
      age: parseInt(parsed.age),
      accentColor: parsed.accentColor,
      avatar: req.file?.path ?? null
    });

    const accessToken = generateToken(user, '15m');
    const refreshToken = generateToken(user, '7d', true);

    setAuthCookies(res, accessToken, refreshToken);
    res.json({ user: safeUser(user) });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ message: 'Validation failed', errors: err.errors });
    }
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const accessToken = generateToken(user, '15m');
    const refreshToken = generateToken(user, '7d', true);

    setAuthCookies(res, accessToken, refreshToken);
    res.json({ user: safeUser(user) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Google OAuth
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get(
  '/google/callback',
  (req, res, next) => {
    passport.authenticate('google', { session: true }, (err, user) => {
      if (err || !user) {
        return res.redirect(`${process.env.CLIENT_URL}/login?error=AuthenticationFailed`);
      }
      req.logIn(user, loginErr => {
        if (loginErr) {
          return res.redirect(`${process.env.CLIENT_URL}/login?error=SessionSetupFailed`);
        }
        const redirectUrl = user.role === 'admin' ? process.env.ADMIN_URL : process.env.CLIENT_URL;
        res.redirect(redirectUrl || '/');
      });
    })(req, res, next);
  }
);

// Admin login
router.post('/admin/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email, role: 'admin' });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'Admin credentials invalid' });
    }

    const accessToken = generateToken(user, '15m');
    const refreshToken = generateToken(user, '7d', true);

    setAuthCookies(res, accessToken, refreshToken);
    res.json({ user: safeUser(user), redirect: process.env.ADMIN_URL });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Who am I?
router.get('/me', (req, res) => {
  if (req.user) {
    return res.json({ user: req.user });
  }
  res.status(401).json({ message: 'Not authenticated' });
});

// Protected admin signup
router.post('/admin/signup', authenticate, isAdmin, async (req, res) => {
  try {
    const { email, password } = signupSchema.parse(req.body);
    const hashed = await bcrypt.hash(password, 12);
    const adminUser = await User.create({ email, password: hashed, role: 'admin' });
    res.status(201).json({ user: safeUser(adminUser) });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ message: 'Validation failed', errors: err.errors });
    }
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Admin check
router.get('/admin/check', authenticate, isAdmin, (req, res) => {
  res.json({ isAdmin: true });
});

export default router;
