import express from 'express';
import Quiz from '../models/Quiz.js';

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
    // Ensure the generated code is unique
    while (codeExists) {
      uniqueCode = generateCode(4);
      const existingQuiz = await Quiz.findOne({ code: uniqueCode });
      if (!existingQuiz) {
        codeExists = false;
      }
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
