import express from 'express';
import bcrypt from 'bcryptjs';
import passport from 'passport';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { authenticate, isAdmin } from '../middleware/auth.js';
import { z } from 'zod';

const router = express.Router();

// Validation schemas
const signupSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8)
});

// Signup
router.post('/signup', async (req, res) => {
    try {
        const { email, password } = signupSchema.parse(req.body);
        const hashedPassword = await bcrypt.hash(password, 12);

        const user = await User.create({
            email,
            password: hashedPassword
        });

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
    passport.authenticate('google', {
        failureRedirect: `${process.env.CLIENT_URL}/login`,
        session: true
    }),
    (req, res) => {
        const redirectUrl = req.user.role === 'admin'
            ? process.env.ADMIN_URL
            : process.env.CLIENT_URL;

        res.send(`
      <script>
        window.opener.postMessage({
          type: 'auth-success',
          redirect: '${redirectUrl}'
        }, '*');
        window.close();
      </script>
    `);
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
    res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'Strict',
        maxAge: 15 * 60 * 1000 // 15 minutes
    });

    res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        path: '/api/auth/refresh',
        sameSite: 'Strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
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

export default router;