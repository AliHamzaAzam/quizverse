import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../models/User.js';
import dotenv from 'dotenv';
dotenv.config();

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: '/api/auth/google/callback'
}, async (accessToken, refreshToken, profile, done) => {
    try {
        let user = await User.findOne({ googleId: profile.id });

        if (!user) {
            const isAdminEmail = process.env.ADMIN_EMAILS?.split(',').includes(profile.emails[0].value);

            user = await User.create({
                googleId: profile.id,
                email: profile.emails[0].value,
                displayName: profile.displayName,
                avatar: profile.photos[0].value,
                role: isAdminEmail ? 'admin' : 'user'
            });
        }

        // Add admin URL to session for redirection
        if (user.role === 'admin') {
            profile._json.admin_redirect = process.env.ADMIN_URL;
        }

        done(null, user);
    } catch (error) {
        done(error);
    }
}));

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    // console.log('[DeserializeUser] Attempting to deserialize user with ID:', id);
    try {
        const user = await User.findById(id);
        if (!user) {
            // console.log('[DeserializeUser] User not found for ID:', id);
            return done(null, false); // User not found
        }
        // console.log('[DeserializeUser] User found:', user.email);
        done(null, user); // User found, attach to req.user
    } catch (err) {
        // console.error('[DeserializeUser] Error finding user:', err);
        done(err);
    }
});
