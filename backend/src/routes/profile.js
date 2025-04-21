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

// --- Bookmark Routes ---

// GET bookmarked quizzes
router.get('/bookmarks', async (req, res) => {
  try {
    const user = await User.findById(req.userId).populate({
        path: 'bookmarkedQuizzes',
        select: 'title description createdBy', // Select fields you want from Quiz
        populate: { path: 'createdBy', select: 'displayName' } // Populate creator info
    });
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }
    res.json(user.bookmarkedQuizzes);
  } catch (error) {
    console.error("Error fetching bookmarked quizzes:", error);
    res.status(500).json({ message: 'Failed to fetch bookmarks.' });
  }
});

// POST add a bookmark
router.post('/bookmarks/:quizId', async (req, res) => {
  try {
    const { quizId } = req.params;
    // Add quizId to the bookmarkedQuizzes array if it's not already there
    const updatedUser = await User.findByIdAndUpdate(
      req.userId,
      { $addToSet: { bookmarkedQuizzes: quizId } }, // $addToSet prevents duplicates
      { new: true }
    ).select('bookmarkedQuizzes');

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found.' });
    }
    res.status(200).json({ message: 'Quiz bookmarked successfully.', bookmarkedQuizzes: updatedUser.bookmarkedQuizzes });
  } catch (error) {
    console.error("Error adding bookmark:", error);
    // Handle potential CastError if quizId is invalid format
    if (error.name === 'CastError') {
        return res.status(400).json({ message: 'Invalid Quiz ID format.' });
    }
    res.status(500).json({ message: 'Failed to add bookmark.' });
  }
});

// DELETE remove a bookmark
router.delete('/bookmarks/:quizId', async (req, res) => {
  try {
    const { quizId } = req.params;
    // Remove quizId from the bookmarkedQuizzes array
    const updatedUser = await User.findByIdAndUpdate(
      req.userId,
      { $pull: { bookmarkedQuizzes: quizId } },
      { new: true }
    ).select('bookmarkedQuizzes');

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found.' });
    }
    res.status(200).json({ message: 'Bookmark removed successfully.', bookmarkedQuizzes: updatedUser.bookmarkedQuizzes });
  } catch (error) {
    console.error("Error removing bookmark:", error);
    if (error.name === 'CastError') {
        return res.status(400).json({ message: 'Invalid Quiz ID format.' });
    }
    res.status(500).json({ message: 'Failed to remove bookmark.' });
  }
});

export default router;
