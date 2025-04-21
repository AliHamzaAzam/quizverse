// Create file: /Users/azaleas/Developer/WebstormProjects/quizverse/backend/src/routes/feedback.js
import express from 'express';
import Feedback from '../models/Feedback.js';
import Attempt from '../models/Attempt.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// POST /api/feedback - Submit feedback for a quiz attempt
router.post('/', authenticate, async (req, res) => {
  const { attemptId, rating, comment } = req.body;
  const userId = req.userId;

  if (!attemptId) {
    return res.status(400).json({ message: 'Attempt ID is required.' });
  }

  // Basic validation for rating and comment
  if (rating !== undefined && (typeof rating !== 'number' || rating < 1 || rating > 5)) {
      return res.status(400).json({ message: 'Rating must be a number between 1 and 5.' });
  }
  if (comment !== undefined && typeof comment !== 'string') {
      return res.status(400).json({ message: 'Comment must be a string.' });
  }
  if (rating === undefined && (!comment || comment.trim() === '')) {
      return res.status(400).json({ message: 'Either a rating or a comment must be provided.' });
  }


  try {
    // Find the attempt and verify ownership
    const attempt = await Attempt.findById(attemptId);
    if (!attempt) {
      return res.status(404).json({ message: 'Attempt not found.' });
    }
    if (!attempt.user.equals(userId)) {
      return res.status(403).json({ message: 'You can only provide feedback for your own attempts.' });
    }

    // Check if feedback already exists for this attempt (using the unique index)
    const existingFeedback = await Feedback.findOne({ attempt: attemptId });
    if (existingFeedback) {
      return res.status(400).json({ message: 'Feedback has already been submitted for this attempt.' });
    }

    // Create and save the new feedback
    const newFeedback = new Feedback({
      quiz: attempt.quiz, // Get quiz ID from the attempt
      user: userId,
      attempt: attemptId,
      rating: rating, // Will be undefined if not provided
      comment: comment ? comment.trim() : undefined // Trim comment, store undefined if empty/not provided
    });

    await newFeedback.save();
    res.status(201).json({ message: 'Feedback submitted successfully.', feedback: newFeedback });

  } catch (error) {
    console.error('Error submitting feedback:', error);
    // Handle potential duplicate key error just in case (though findOne should catch it)
    if (error.code === 11000) {
        return res.status(400).json({ message: 'Feedback has already been submitted for this attempt.' });
    }
    if (error.name === 'ValidationError') {
        return res.status(400).json({ message: 'Invalid feedback data.', errors: error.errors });
    }
    res.status(500).json({ message: 'Failed to submit feedback.' });
  }
});

export default router;
