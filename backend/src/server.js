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
import reportRoutes from './routes/report.js'; // Import report routes
import feedbackRoutes from './routes/feedback.js'; // Import feedback routes

import './config/passport.js';
import { authenticate, isAdmin } from './middleware/auth.js';

dotenv.config();

const app = express();

// If running behind a proxy (like Nginx, or even Vite's dev proxy sometimes),
// trust the first hop.
app.set('trust proxy', 1);

// Add this root-level logger *before* CORS
app.use((req, res, next) => {
  console.log(`[Root Logger] Received request: ${req.method} ${req.originalUrl} from Origin: ${req.headers.origin}`);
  console.log(`[Root Logger] Cookies:`, req.cookies); // Log cookies received by the server
  next();
});

app.use(cors({
  origin: (origin, callback) => {
    const allowedOrigins = [
      process.env.CLIENT_URL, // Keep existing env var
      process.env.ADMIN_URL,  // Keep existing env var
      // 'http://localhost:5173', // Explicitly allow default Vite dev origin
      // 'http://127.0.0.1:5173' // Allow loopback IP as well
      'https://quizverse-p6boulyed-ali-hamzas-projects-4c11c478.vercel.app',
      'https://quizverse-seven.vercel.app', 
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
  // Use MongoStore for persistent sessions
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URI,
    collectionName: 'sessions' // Optional: specify collection name
  }),
  cookie: {
    // Set attributes based on environment
    sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
    secure: process.env.NODE_ENV === 'production', // true only for production (HTTPS)
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 // Example: 1 day session expiry
    // Domain: Omit for localhost. For production, set via env var if needed (e.g., parent domain like '.yourdomain.com')
    // domain: process.env.NODE_ENV === 'production' ? process.env.COOKIE_DOMAIN : undefined // Removed explicit domain setting for now
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
