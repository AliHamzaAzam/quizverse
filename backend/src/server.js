import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import session from 'express-session';
import passport from 'passport';
import authRoutes from './routes/auth.js';
import adminRoutes from './routes/admin.js';
import './config/passport.js';
import { authenticate, isAdmin } from './middleware/auth.js';

dotenv.config();

const app = express();

app.use(cors({
    origin: (origin, callback) => {
        const allowedOrigins = [
            process.env.CLIENT_URL,
            process.env.ADMIN_URL
        ];

        // Allow requests with no origin (like mobile apps, curl, or server-to-server)
        if (!origin) {
            return callback(null, true);
        }

        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));

app.use(express.json());

app.use(session({
    secret: process.env.JWT_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        sameSite: 'lax',
        secure: false
    }
}));
app.use(passport.initialize());
app.use(passport.session());

// MongoDB connection
await mongoose.connect(process.env.MONGO_URI);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', authenticate, isAdmin, adminRoutes);

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
});