import express from 'express';
import Quiz from '../models/Quiz.js';

const router = express.Router();

// Create a quiz (any authenticated user)
router.post('/', async (req, res) => {
  try {
    const q = await Quiz.create({ ...req.body, createdBy: req.userId });
    res.status(201).json(q);
  } catch (e) {
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
  const q = await Quiz.findById(req.params.id);
  if (!q) return res.status(404).json({ message: 'Not found' });
  if (q.createdBy.equals(req.userId) || req.user.role==='admin') {
    return res.json(q);
  }
  // hide correctOption
  const safe = q.toObject();
  safe.questions.forEach(x=>delete x.correctOption);
  res.json(safe);
});

// Update quiz (only owner or admin)
router.patch('/:id', async (req, res) => {
  const q = await Quiz.findById(req.params.id);
  if (!q) return res.status(404).json({ message: 'Not found' });
  if (!q.createdBy.equals(req.userId) && req.user.role!=='admin') {
    return res.status(403).json({ message: 'Not allowed' });
  }
  Object.assign(q, req.body);
  await q.save();
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
