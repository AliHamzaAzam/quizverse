import express from 'express';
import Quiz from '../models/Quiz.js';
import Attempt from '../models/Attempt.js';
import Feedback from '../models/Feedback.js';
import User from '../models/User.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Protect all quiz routes
router.use(authenticate);

// Helper: generate a 4-character alphanumeric code
function generateCode(length = 4) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// ─── Create a new quiz ────────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const { title, description, questions, timeLimit, category } = req.body;
    // questions may include hints: [] now

    // Generate a unique 4-char code
    let code, exists;
    for (let i = 0; i < 10; i++) {
      code = generateCode();
      exists = await Quiz.exists({ code });
      if (!exists) break;
    }
    if (exists) return res.status(500).json({ message: 'Could not generate unique code' });

    const quiz = await Quiz.create({
      title,
      description,
      code,
      questions,
      category,
      timeLimit: timeLimit != null ? parseInt(timeLimit, 10) : null,
      createdBy: req.userId
    });

    res.status(201).json(quiz);
  } catch (e) {
    if (e.code === 11000) return res.status(400).json({ message: 'Duplicate code, retry' });
    res.status(400).json({ message: 'Invalid data', error: e.message });
  }
});

// ─── Get a hint for a question ───────────────────────────────────────────────
router.post('/:quizId/questions/:questionId/hint', async (req, res) => {
  try {
    const { quizId, questionId } = req.params;
    const quiz = await Quiz.findById(quizId);
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });

    const question = quiz.questions.id(questionId);
    if (!question) return res.status(404).json({ message: 'Question not found' });

    // Find or create this user's attempt on the quiz
    let attempt = await Attempt.findOne({ user: req.userId, quiz: quizId });
    if (!attempt) {
      attempt = await Attempt.create({ user: req.userId, quiz: quizId, answers: [], hintsUsed: [], score: 0 });
    }

    // Determine how many hints already used for this question
    const usage = attempt.hintsUsed.find(h => h.questionId.equals(questionId));
    const usedCount = usage ? usage.countUsed : 0;

    if (usedCount >= question.hints.length) {
      return res.status(400).json({ message: 'No hints left for this question' });
    }

    // Return next hint
    const hint = question.hints[usedCount];
    if (usage) {
      usage.countUsed++;
    } else {
      attempt.hintsUsed.push({ questionId, countUsed: 1 });
    }
    await attempt.save();

    res.json({ hint });
  } catch (e) {
    console.error('Hint error:', e);
    res.status(500).json({ message: 'Error fetching hint' });
  }
});

// ─── List all active quizzes ─────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { sortBy, sortOrder, category, createdBy, bookmarkedBy } = req.query;

    let q = Quiz.find({ status: 'active' });
    if (category)    q = q.where('category').equals(category);
    if (createdBy)   q = q.where('createdBy').equals(createdBy);
    if (bookmarkedBy) {
      const user = await User.findById(bookmarkedBy).select('bookmarkedQuizzes');
      q = user ? q.where('_id').in(user.bookmarkedQuizzes) : q.where('_id').in([]);
    }

    // Sorting
    const valid = ['title','createdAt','attemptCount','category'];
    const sortField = valid.includes(sortBy) ? sortBy : 'createdAt';
    const order = sortOrder === 'asc' ? 1 : -1;
    q = q.sort({ [sortField]: order });

    const list = await q.populate('createdBy','displayName').exec();
    res.json(list);
  } catch (e) {
    console.error('Fetch quizzes error:', e);
    res.status(500).json({ message: 'Failed to retrieve quizzes' });
  }
});

// ─── List quizzes created by me ──────────────────────────────────────────────
router.get('/my-quizzes', async (req, res) => {
  try {
    const list = await Quiz.find({ createdBy: req.userId })
      .select('-questions.correctOption')
      .sort({ createdAt: -1 });
    res.json(list);
  } catch (e) {
    console.error('My quizzes error:', e);
    res.status(500).json({ message: 'Failed to fetch your quizzes' });
  }
});

// ─── Get quiz by code ─────────────────────────────────────────────────────────
router.get('/code/:code', async (req, res) => {
  try {
    const quiz = await Quiz.findOne({ code: req.params.code }).populate('createdBy','displayName');
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });

    const isOwner = quiz.createdBy._id.equals(req.userId);
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin) {
      const safe = quiz.toObject();
      safe.questions.forEach(q => delete q.correctOption);
      return res.json(safe);
    }

    res.json(quiz);
  } catch (e) {
    console.error('Get by code error:', e);
    res.status(500).json({ message: 'Error retrieving quiz' });
  }
});

// ─── Get single quiz by ID ───────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id).populate('createdBy','displayName');
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });

    const isOwner = quiz.createdBy._id.equals(req.userId);
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin) {
      const safe = quiz.toObject();
      safe.questions.forEach(q => delete q.correctOption);
      return res.json(safe);
    }

    res.json(quiz);
  } catch (e) {
    console.error('Get quiz error:', e);
    res.status(500).json({ message: 'Error retrieving quiz' });
  }
});

// ─── Update a quiz ───────────────────────────────────────────────────────────
router.patch('/:id', async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });
    if (!quiz.createdBy.equals(req.userId) && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden' });
    }

    // Only update allowed fields
    ['title','description','questions','category','timeLimit','status'].forEach(f => {
      if (req.body[f] !== undefined) quiz[f] = req.body[f];
    });
    await quiz.save();
    res.json(quiz);
  } catch (e) {
    console.error('Update quiz error:', e);
    res.status(500).json({ message: 'Error updating quiz' });
  }
});

// ─── Delete a quiz ───────────────────────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });
    if (!quiz.createdBy.equals(req.userId) && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden' });
    }
    await quiz.deleteOne();
    res.status(204).end();
  } catch (e) {
    console.error('Delete quiz error:', e);
    res.status(500).json({ message: 'Error deleting quiz' });
  }
});

// ─── Get feedback for a quiz ─────────────────────────────────────────────────
router.get('/:quizId/feedback', async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.quizId);
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });

    const isOwner = quiz.createdBy.equals(req.userId);
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin) return res.status(403).json({ message: 'Not authorized' });

    const feedbackList = await Feedback.find({ quiz: quiz._id })
      .populate('user','displayName')
      .sort({ createdAt: -1 });

    res.json(feedbackList);
  } catch (e) {
    console.error('Feedback error:', e);
    res.status(500).json({ message: 'Error fetching feedback' });
  }
});

export default router;
