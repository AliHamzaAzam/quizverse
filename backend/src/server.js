import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import session from 'express-session';    // <-- Add this
import authRoutes from './routes/auth.js';
import './config/passport.js';
import passport from 'passport';

dotenv.config();

const app = express();

app.use(cors({
    origin: process.env.CLIENT_URL,
    credentials: true
}));
app.use(express.json());

app.use(session({
    secret: process.env.JWT_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        sameSite: 'lax',  // Important for local cross-origin
        secure: false     // Only true in production (HTTPS)
    }
}));
app.use(passport.initialize());
app.use(passport.session());

// MongoDB connection
await mongoose.connect(process.env.MONGO_URI);

// Routes
app.use('/api/auth', authRoutes);

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
});