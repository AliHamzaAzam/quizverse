import express from 'express';
import Attempt from '../models/Attempt.js';
import Quiz from '../models/Quiz.js';
import { authenticate } from '../middleware/auth.js'; // New middleware for authentication

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// POST submit answers
router.post('/:quizId', async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.quizId);
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });

    const { answers } = req.body;
    let score = 0;
    answers.forEach(a => {
      const q = quiz.questions.id(a.questionId);
      if (q && q.correctOption === a.selectedOption) score++;
    });

    const at = await Attempt.create({
      user: req.userId,
      quiz: quiz._id,
      answers,
      hintsUsed: [],           // New field: initialize hints usage
      score
    });

    // Increment attempt count on the Quiz model
    await Quiz.findByIdAndUpdate(req.params.quizId, { $inc: { attemptCount: 1 } });

    res.status(201).json({ score: at.score, attemptId: at._id, hintsUsed: at.hintsUsed }); // Return score and hintsUsed
  } catch (error) {
    console.error('Error submitting attempt:', error);
    res.status(500).json({ message: 'Failed to submit answers' });
  }
});

// GET my attempts
router.get('/my', async (req, res) => {
  try {
    const arr = await Attempt.find({ user: req.userId })
      .populate('quiz', 'title description timeLimit')  // Include timeLimit field
      .lean();

    // Return hintsUsed along with score and answers
    res.json(arr.map(a => ({
      attemptId: a._id,
      quiz: a.quiz,
      score: a.score,
      hintsUsed: a.hintsUsed,
      createdAt: a.createdAt
    })));
  } catch (error) {
    console.error('Error fetching user attempts:', error);
    res.status(500).json({ message: 'Failed to fetch attempts' });
  }
});

// GET all attempts for a quiz (admin/owner)
router.get('/quiz/:quizId', async (req, res) => {
  try {
    const list = await Attempt.find({ quiz: req.params.quizId })
      .populate('user', 'displayName')
      .lean();

    res.json(list.map(a => ({
      user: a.user,
      score: a.score,
      hintsUsed: a.hintsUsed,  // Include hintsUsed
      createdAt: a.createdAt
    })));
  } catch (error) {
    console.error('Error fetching attempts for quiz:', error);
    res.status(500).json({ message: 'Failed to fetch quiz attempts' });
  }
});

export default router;
