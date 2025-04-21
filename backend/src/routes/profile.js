import express from 'express';
import multer from 'multer';
import User from '../models/User.js';
import { storage } from '../utils/cloudinary.js';

const router = express.Router();
const upload = multer({ storage });

// GET own profile
router.get('/', async (req, res) => {
  const u = await User.findById(req.userId).select('-password -refreshToken');
  res.json(u);
});

// PATCH update profile
router.patch('/', upload.single('avatar'), async (req, res) => {
  try { // Add try-catch for better error handling
    const updates = {};
    ['firstName', 'lastName', 'displayName', 'age', 'accentColor'].forEach(f => {
      // Allow clearing fields by sending empty strings, but ignore null/undefined
      if (req.body[f] !== undefined && req.body[f] !== null) {
          updates[f] = req.body[f];
      }
    });
    if (req.file) updates.avatar = req.file.path;

    const updatedUser = await User.findByIdAndUpdate(req.userId, updates, { new: true })
                              .select('-password -refreshToken');

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found after update.' });
    }

    // Explicitly save the session before sending the response
    req.session.save(err => {
      if (err) {
        console.error("Session save error after profile update:", err);
        // Still try to send the updated user, but log the session error
        return res.status(500).json({ message: 'Profile updated but session save failed.', user: updatedUser });
      }
      console.log('Session saved explicitly after profile update.');
      // Send response consistent with auth store expectation
      res.json({ user: updatedUser });
    });

  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ message: 'Failed to update profile due to server error.' });
  }
});

export default router;
