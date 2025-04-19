import express from 'express';
import Attempt from '../models/Attempt.js';
import Quiz from '../models/Quiz.js';

const router = express.Router();

// POST submit answers
router.post('/:quizId', async (req, res) => {
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
    score
  });
  res.status(201).json(at);
});

// GET my attempts
// Changed route from '/user/me' to '/my'
router.get('/my', async (req, res) => {
  try { // Add try-catch block
    const arr = await Attempt.find({ user: req.userId })
      .populate('quiz', 'title description'); // Populate more quiz details
    res.json(arr);
  } catch (error) {
    console.error("Error fetching user attempts:", error);
    res.status(500).json({ message: "Failed to fetch attempts" });
  }
});

// GET all attempts for a quiz (admin/owner)
router.get('/quiz/:quizId', async (req, res) => {
  const list = await Attempt.find({ quiz: req.params.quizId })
    .populate('user','displayName');
  res.json(list);
});

export default router;
