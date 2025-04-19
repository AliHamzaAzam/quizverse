import express from 'express';
import Attempt from '../models/Attempt.js';

const router = express.Router();

// GET top 10 for a quiz
router.get('/:quizId', async (req, res) => {
  const top = await Attempt.find({ quiz: req.params.quizId })
    .sort({ score: -1, createdAt: 1 })
    .limit(10)
    .populate('user','displayName avatar');
  res.json(top);
});

export default router;
