// server.js
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import session from 'express-session';
import passport from 'passport';
import cookieParser from 'cookie-parser';
import MongoStore from 'connect-mongo';

import authRoutes from './routes/auth.js';
import adminRoutes from './routes/admin.js';
import profileRoutes from './routes/profile.js'; 
import quizRoutes from './routes/quiz.js';
import attemptRoutes from './routes/attempt.js';
import leaderboardRoutes from './routes/leaderboard.js';
import reportRoutes from './routes/report.js';
import feedbackRoutes from './routes/feedback.js';

import './config/passport.js';
import { authenticate, isAdmin } from './middleware/auth.js';

dotenv.config();

const app = express();
app.set('trust proxy', 1);

// 1) CORS must come before cookies/sessions
app.use(cors({
  origin: [
    process.env.CLIENT_URL,
    process.env.ADMIN_URL,
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'https://quizverse-p6boulyed-ali-hamzas-projects-4c11c478.vercel.app',
    'https://quizverse-seven.vercel.app',
  ],
  credentials: true,
  exposedHeaders: ['Set-Cookie']
}));

// 2) parse cookies
app.use(cookieParser());

// 3) JSON body parser
app.use(express.json());

// 4) session (after cookieParser & CORS)
// Modify the isProd check in server.js
const isProd = process.env.NODE_ENV === 'production' ||
    process.env.RAILWAY_STATIC_URL !== undefined ||
    (process.env.CLIENT_URL && process.env.CLIENT_URL.includes('vercel.app'));

app.use(session({
  secret: process.env.JWT_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URI,
    collectionName: 'sessions'
  }),
  cookie: {
    httpOnly: true,
    sameSite: isProd ? 'None' : 'Lax',    // ← Lax in dev, None in prod
    secure: isProd,                       // ← false in dev, true in prod
    maxAge: 1000 * 60 * 60 * 24           // 1 day
  }
}));

app.use(passport.initialize());
app.use(passport.session());

// 5) logger (after cookieParser & session so req.cookies is populated)
app.use((req, res, next) => {
  console.log(`[Root Logger] Received request: ${req.method} ${req.originalUrl} from Origin: ${req.headers.origin}`);
  console.log(`[Root Logger] Cookies:`, req.cookies);
  next();
});

// connect to MongoDB
await mongoose.connect(process.env.MONGO_URI);

// routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', authenticate, isAdmin, adminRoutes);
app.use('/api/profile', authenticate, profileRoutes);
app.use('/api/quizzes', authenticate, quizRoutes);
app.use('/api/attempts', authenticate, attemptRoutes);
app.use('/api/leaderboard', authenticate, leaderboardRoutes);
app.use('/api/reports', authenticate, reportRoutes);
app.use('/api/feedback', authenticate, feedbackRoutes);

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
