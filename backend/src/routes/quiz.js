import express from 'express';
import Quiz from '../models/Quiz.js';
import Feedback from '../models/Feedback.js'; // Import Feedback model

const router = express.Router();

// Helper function to generate a random alphanumeric code
function generateCode(length = 4) {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

// Create a quiz (any authenticated user)
router.post('/', async (req, res) => {
  try {
    // Include timeLimit from request body
    const { title, description, questions, timeLimit } = req.body;

    let uniqueCode = '';
    let codeExists = true;
    let attempts = 0; // Prevent infinite loop in rare cases
    // Ensure the generated code is unique
    while (codeExists && attempts < 10) { // Limit attempts
      uniqueCode = generateCode(4);
      const existingQuiz = await Quiz.findOne({ code: uniqueCode });
      if (!existingQuiz) {
        codeExists = false;
      }
      attempts++;
    }

    if (codeExists) {
        // If we still couldn't find a unique code after several attempts
        return res.status(500).json({ message: 'Failed to generate a unique quiz code. Please try again.' });
    }


    const q = await Quiz.create({
      title,
      description,
      code: uniqueCode, // Add the generated unique code
      questions,
      timeLimit: timeLimit ? parseInt(timeLimit, 10) : null, // Ensure it's a number or null
      createdBy: req.userId
    });
    res.status(201).json(q);
  } catch (e) {
    // Add more specific error handling for duplicate key if needed, though the loop should prevent it
    if (e.code === 11000) { // Handle potential rare race condition for duplicate code
        return res.status(400).json({ message: 'Failed to generate unique code, please try again.', error: e.message });
    }
    res.status(400).json({ message: 'Invalid data', error: e.message });
  }
});

// Read all quizzes (hide answers)
router.get('/', async (req, res) => {
  const list = await Quiz.find()
    .select('-questions.correctOption')
    .populate('createdBy','displayName');
  res.json(list);
});

// Read quizzes created by the current user
router.get('/my-quizzes', async (req, res) => {
  if (!req.userId) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  try {
    const userQuizzes = await Quiz.find({ createdBy: req.userId })
                                  .select('-questions.correctOption') // Optionally hide answers even for owner in this list view
                                  .sort({ createdAt: -1 }); // Sort by newest first
    res.json(userQuizzes);
  } catch (error) {
    console.error('Error fetching user quizzes:', error);
    res.status(500).json({ message: 'Failed to fetch your quizzes' });
  }
});

// GET feedback for a specific quiz (only owner/admin)
router.get('/:quizId/feedback', async (req, res) => {
  try {
    const quizId = req.params.quizId;
    const userId = req.userId;
    const userRole = req.user?.role; // Assuming role is populated in auth middleware

    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    // Check if the user is the owner or an admin
    const isOwner = quiz.createdBy.equals(userId);
    const isAdmin = userRole === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'You are not authorized to view feedback for this quiz.' });
    }

    // Fetch feedback, populate user display name
    const feedbackList = await Feedback.find({ quiz: quizId })
                                     .populate('user', 'displayName') // Populate user's display name
                                     .sort({ createdAt: -1 }); // Sort by newest first

    res.json(feedbackList);

  } catch (error) {
    console.error('Error fetching feedback for quiz:', error);
    res.status(500).json({ message: 'Failed to fetch feedback.' });
  }
});

// Read one quiz by CODE (hide answers for non-owner/admin)
router.get('/code/:code', async (req, res) => {
  // Find quiz by code, case-sensitive search
  const q = await Quiz.findOne({ code: req.params.code }).populate('createdBy', 'displayName');
  if (!q) return res.status(404).json({ message: 'Quiz not found with this code' });

  // Check if the requester is the owner or an admin
  const isOwner = q.createdBy && req.userId && q.createdBy._id.equals(req.userId);
  const isAdmin = req.user && req.user.role === 'admin';

  if (isOwner || isAdmin) {
    // Owner or admin gets the full quiz details
    return res.json(q);
  }

  // For other users, hide correctOption
  const safe = q.toObject();
  if (safe.questions && Array.isArray(safe.questions)) {
      safe.questions.forEach(x => delete x.correctOption);
  }
  res.json(safe);
});

// Read one quiz (with answers for admin/owner, else hide)
router.get('/:id', async (req, res) => {
  // Populate createdBy field with displayName
  const q = await Quiz.findById(req.params.id).populate('createdBy', 'displayName');
  if (!q) return res.status(404).json({ message: 'Not found' });

  // Access populated field directly
  const isOwner = q.createdBy && q.createdBy._id.equals(req.userId);
  const isAdmin = req.user && req.user.role === 'admin';

  if (isOwner || isAdmin) {
    // Owner or admin gets the full quiz details (including correct answers)
    return res.json(q);
  }

  // For other users, hide correctOption
  const safe = q.toObject(); // Use toObject() to work with a plain JS object
  if (safe.questions && Array.isArray(safe.questions)) {
      safe.questions.forEach(x => delete x.correctOption);
  }
  res.json(safe);
});

// Update quiz (only owner or admin)
router.patch('/:id', async (req, res) => {
  const q = await Quiz.findById(req.params.id);
  if (!q) return res.status(404).json({ message: 'Not found' });
  if (!q.createdBy.equals(req.userId) && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Not allowed' });
  }
  // Explicitly update allowed fields, including timeLimit
  const { title, description, questions, timeLimit } = req.body;
  if (title) q.title = title;
  if (description !== undefined) q.description = description;
  if (questions) q.questions = questions;
  // Allow setting timeLimit to 0 or null/undefined to remove it
  if (timeLimit !== undefined) {
      q.timeLimit = timeLimit ? parseInt(timeLimit, 10) : null;
  }
  
  await q.save();
  // Populate createdBy before sending response
  await q.populate('createdBy', 'displayName');
  res.json(q);
});

// Delete quiz (only owner or admin)
router.delete('/:id', async (req, res) => {
  const q = await Quiz.findById(req.params.id);
  if (!q) return res.status(404).json({ message: 'Not found' });
  if (!q.createdBy.equals(req.userId) && req.user.role!=='admin') {
    return res.status(403).json({ message: 'Not allowed' });
  }
  await q.deleteOne();
  res.status(204).end();
});

export default router;
