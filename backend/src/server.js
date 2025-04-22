// server.js
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import session from 'express-session';
import passport from 'passport';
import cookieParser from 'cookie-parser';

import authRoutes from './routes/auth.js';
import adminRoutes from './routes/admin.js';
import profileRoutes from './routes/profile.js';
import quizRoutes from './routes/quiz.js';
import attemptRoutes from './routes/attempt.js';
import leaderboardRoutes from './routes/leaderboard.js';
import reportRoutes from './routes/report.js'; // Import report routes
import feedbackRoutes from './routes/feedback.js'; // Import feedback routes

import './config/passport.js';
import { authenticate, isAdmin } from './middleware/auth.js';

dotenv.config();

const app = express();

app.use(cors({
  origin: (origin, callback) => {
    const allowedOrigins = [
      process.env.CLIENT_URL, // Keep existing env var
      process.env.ADMIN_URL,  // Keep existing env var
      'http://localhost:5173', // Explicitly allow default Vite dev origin
      'http://127.0.0.1:5173' // Allow loopback IP as well
    ];
    // allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    // Use startsWith to handle potential variations if needed, or keep includes for exact match
    if (allowedOrigins.some(allowedOrigin => allowedOrigin && origin.startsWith(allowedOrigin))) {
      callback(null, true);
    } else {
      console.error(`CORS Error: Origin ${origin} not allowed.`); // Log denied origin for debugging
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    }
  },
  credentials: true
}));

// parse cookies for JWT auth
app.use(cookieParser());

// parse JSON bodies
app.use(express.json());

// session (for passport)
app.use(session({
  secret: process.env.JWT_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    // IMPORTANT: For cross-site requests (like frontend on 5173 talking to backend on 5001),
    // SameSite=None is required. Secure=true is also typically required with SameSite=None,
    // but browsers *may* allow Secure=false for localhost.
    // This setup is for DEVELOPMENT ONLY. In production with HTTPS, use SameSite=None and Secure=true.
    sameSite: 'Lax', // Use Lax for better HTTP compatibility in dev
    httpOnly: true // Keep httpOnly for security
  }
}));

app.use(passport.initialize());
app.use(passport.session());

// connect to MongoDB
await mongoose.connect(process.env.MONGO_URI);

// public/auth routes
app.use('/api/auth', authRoutes);

// admin‐only routes
app.use('/api/admin', authenticate, isAdmin, adminRoutes);

// authenticated user routes
app.use('/api/profile', authenticate, profileRoutes);
app.use('/api/quizzes', authenticate, quizRoutes);
app.use('/api/attempts', authenticate, attemptRoutes);
app.use('/api/leaderboard', authenticate, leaderboardRoutes);
app.use('/api/reports', authenticate, reportRoutes); // Protect report routes
app.use('/api/feedback', authenticate, feedbackRoutes); // Protect feedback routes

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
