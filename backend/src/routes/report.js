import express from 'express';
import Report from '../models/Report.js';
import Quiz from '../models/Quiz.js';
import { authenticate } from '../middleware/auth.js'; 

const router = express.Router();

// POST /api/reports - Submit a new report (Authenticated users)
router.post('/', authenticate, async (req, res) => { // Use the imported middleware
  const { quizId, reason } = req.body;
  const userId = req.userId; // authenticate middleware attaches userId

  if (!quizId || !reason) {
    return res.status(400).json({ message: 'Quiz ID and reason are required.' });
  }

  try {
    // Check if the quiz exists
    const quizExists = await Quiz.findById(quizId);
    if (!quizExists) {
      return res.status(404).json({ message: 'Quiz not found.' });
    }

    // Check if this user has already reported this quiz
    const existingReport = await Report.findOne({ quiz: quizId, reportedBy: userId });
    if (existingReport) {
      return res.status(400).json({ message: 'You have already reported this quiz.' });
    }

    // Create and save the new report
    const newReport = new Report({
      quiz: quizId,
      reportedBy: userId,
      reason: reason,
      status: 'pending' // Default status
    });

    await newReport.save();
    res.status(201).json({ message: 'Quiz reported successfully.', report: newReport });

  } catch (error) {
    console.error('Error submitting report:', error);
    // Handle potential validation errors or other issues
    if (error.name === 'ValidationError') {
        return res.status(400).json({ message: 'Invalid report data.', errors: error.errors });
    }
    res.status(500).json({ message: 'Failed to submit report.' });
  }
});

export default router;