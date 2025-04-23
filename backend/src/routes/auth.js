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

// Validation schemas
const signupSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    displayName: z.string().min(1),
    age: z.string().refine(val => !isNaN(parseInt(val)) && parseInt(val) > 0, { message: "Age must be a positive number" }),
    accentColor: z.string().optional()
});

// Signup
router.post('/signup', upload.single('avatar'), async (req, res) => {
    try {
        console.log('Uploaded file:', req.file); // Debug log to check avatar

        const parsedData = signupSchema.parse(req.body);
        const hashedPassword = await bcrypt.hash(parsedData.password, 12);

        const user = await User.create({
            email: parsedData.email,
            password: hashedPassword,
            firstName: parsedData.firstName,
            lastName: parsedData.lastName,
            displayName: parsedData.displayName,
            age: parseInt(parsedData.age),
            accentColor: parsedData.accentColor,
            avatar: req.file ? req.file.path : null // Store Cloudinary URL
        });

        console.log('Created user:', user); // Debug log to verify saved fields

        const accessToken = generateToken(user, '15m');
        const refreshToken = generateToken(user, '7d', true);

        setAuthCookies(res, accessToken, refreshToken);
        res.json({ user: safeUser(user) });

    } catch (error) {
        handleAuthError(error, res);
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

    } catch (error) {
        handleAuthError(error, res);
    }
});

// Login with Google
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/google/callback',
  (req, res, next) => {
    // console.log('[Google Callback] Entering callback handler');
    passport.authenticate('google', { session: true }, (err, user, info) => {
      if (err) {
        // console.error('[Google Callback] Passport authentication error:', err);
        return res.redirect(`${process.env.CLIENT_URL}/login?error=AuthenticationFailed`);
      }
      if (!user) {
        // console.log('[Google Callback] Passport authentication failed, no user returned.');
        return res.redirect(`${process.env.CLIENT_URL}/login?error=AuthenticationFailed`);
      }
      // console.log('[Google Callback] Passport authentication successful for user:', user.email);
      req.logIn(user, (loginErr) => {
        if (loginErr) {
          // console.error('[Google Callback] req.logIn error:', loginErr);
          return res.redirect(`${process.env.CLIENT_URL}/login?error=SessionSetupFailed`);
        }
        // console.log('[Google Callback] req.logIn successful. Session before redirect:', req.session);
        // Redirect based on role
        const redirectUrl = user.role === 'admin' ? process.env.ADMIN_URL : process.env.CLIENT_URL;
        // console.log(`[Google Callback] Redirecting to: ${redirectUrl || '/'}`)
        res.redirect(redirectUrl || '/'); // Redirect to frontend (user or admin)
      });
    })(req, res, next); // Immediately invoke the middleware function
  }
);

// admin-specific login endpoint
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
        res.json({
            user: safeUser(user),
            redirect: process.env.ADMIN_URL
        });

    } catch (error) {
        handleAuthError(error, res);
    }
});

router.get('/me', (req, res) => {
    if (req.user) {
        res.json({ user: req.user });
    } else {
        res.status(401).json({ message: 'Not authenticated' });
    }
});

// Helper functions
function generateToken(user, expiresIn, isRefresh = false) {
    return jwt.sign(
        { userId: user._id },
        isRefresh ? process.env.JWT_REFRESH_SECRET : process.env.JWT_SECRET,
        { expiresIn }
    );
}

function setAuthCookies(res, accessToken, refreshToken) {
    const isProduction = process.env.NODE_ENV === 'production';

    res.cookie('accessToken', accessToken, {
        httpOnly: true,
        // Secure MUST be true if SameSite=None
        secure: isProduction,
        // SameSite=None is REQUIRED for cross-origin cookie sending
        sameSite: isProduction ? 'None' : 'Lax',
        maxAge: 15 * 60 * 1000 // 15 minutes
        // Domain: Consider removing or ensuring it's correct if set
    });

    res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: isProduction,
        path: '/api/auth/refresh', // Keep specific path
        // SameSite=None needed if refresh is called cross-origin
        // SameSite=Strict might be okay IF refresh is only ever called same-origin
        sameSite: isProduction ? 'None' : 'Strict', // Adjust if refresh is cross-origin
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        // Domain: Consider removing or ensuring it's correct if set
    });
}

function safeUser(user) {
    const { password, ...safeData } = user.toObject();
    return safeData;
}

// Add admin registration route (protected)
router.post('/admin/signup', authenticate, isAdmin, async (req, res) => {
    try {
        const { email, password } = signupSchema.parse(req.body);
        const hashedPassword = await bcrypt.hash(password, 12);

        const adminUser = await User.create({
            email,
            password: hashedPassword,
            role: 'admin'
        });

        res.status(201).json({ user: safeUser(adminUser) });
    } catch (error) {
        handleAuthError(error, res);
    }
});

// Add admin check endpoint
router.get('/admin/check', authenticate, isAdmin, (req, res) => {
    res.json({ isAdmin: true });
});

function handleAuthError(error, res) {
    if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation failed', errors: error.errors });
    }
    console.error('Auth error:', error);
    res.status(500).json({ message: 'Internal server error' });
}

export default router;