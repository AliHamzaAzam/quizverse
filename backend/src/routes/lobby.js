import express from 'express';
import Lobby from '../models/Lobby.js';
import Attempt from '../models/Attempt.js';
import Quiz from '../models/Quiz.js';
import Invite from '../models/Invite.js';
import { authenticate } from '../middleware/auth.js';
import crypto from 'crypto';

const router = express.Router();
router.use(authenticate);

// Create a new lobby
router.post('/', async (req, res) => {
  const { quizId, participantLimit, autoStartTime } = req.body;
  try {
    const quiz = await Quiz.findById(quizId);
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });

    const lobby = await Lobby.create({ quiz: quizId, host: req.userId, participants: [req.userId], participantLimit, startTime: autoStartTime || null });
    res.status(201).json(lobby);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error creating lobby' });
  }
});

// Join a lobby normally
router.post('/:id/join', async (req, res) => {
  try {
    const lobby = await Lobby.findById(req.params.id);
    if (!lobby) return res.status(404).json({ message: 'Lobby not found' });
    if (lobby.status !== 'waiting') return res.status(400).json({ message: 'Cannot join, lobby not waiting' });
    if (lobby.participants.includes(req.userId)) return res.status(400).json({ message: 'Already joined' });
    if (lobby.participants.length >= lobby.participantLimit) return res.status(409).json({ message: 'Lobby is full' });

    lobby.participants.push(req.userId);
    await lobby.save();
    res.json(lobby);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error joining lobby' });
  }
});

// Generate an invite code for a lobby (host only)
router.post('/:id/invite', async (req, res) => {
  try {
    const lobby = await Lobby.findById(req.params.id);
    if (!lobby) return res.status(404).json({ message: 'Lobby not found' });
    if (lobby.host.toString() !== req.userId) return res.status(403).json({ message: 'Only host can invite' });

    // generate secure random code
    const code = crypto.randomBytes(4).toString('hex');
    const invite = await Invite.create({ code, lobby: lobby._id, inviter: req.userId });
    res.status(201).json({ code, expiresAt: invite.expiresAt });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error generating invite' });
  }
});

// Get lobby info via invite code
router.get('/invite/:code', async (req, res) => {
  try {
    const invite = await Invite.findOne({ code: req.params.code, expiresAt: { $gt: new Date() } }).populate({ path: 'lobby', populate: { path: 'quiz host participants', select: 'title displayName avatar' }});
    if (!invite) return res.status(404).json({ message: 'Invite not found or expired' });
    res.json({ lobby: invite.lobby });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching invite' });
  }
});

// Join via invite code
router.post('/invite/:code/join', async (req, res) => {
  try {
    const invite = await Invite.findOne({ code: req.params.code, expiresAt: { $gt: new Date() } });
    if (!invite) return res.status(404).json({ message: 'Invite not found or expired' });

    const lobby = await Lobby.findById(invite.lobby);
    if (!lobby) return res.status(404).json({ message: 'Lobby not found' });
    if (lobby.status !== 'waiting') return res.status(400).json({ message: 'Cannot join, lobby not waiting' });
    if (lobby.participants.includes(req.userId)) return res.status(400).json({ message: 'Already joined' });
    if (lobby.participants.length >= lobby.participantLimit) return res.status(409).json({ message: 'Lobby is full' });

    lobby.participants.push(req.userId);
    await lobby.save();
    res.json(lobby);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error joining via invite' });
  }
});

// Start a lobby
router.post('/:id/start', async (req, res) => {
  try {
    const lobby = await Lobby.findById(req.params.id);
    if (!lobby) return res.status(404).json({ message: 'Lobby not found' });
    if (lobby.host.toString() !== req.userId) return res.status(403).json({ message: 'Only host can start' });
    if (lobby.status !== 'waiting') return res.status(400).json({ message: 'Lobby already started or ended' });

    lobby.status = 'started';
    lobby.startTime = new Date();
    await lobby.save();
    res.json(lobby);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error starting lobby' });
  }
});

// Get lobby stats
router.get('/:id/stats', async (req, res) => {
  try {
    const lobby = await Lobby.findById(req.params.id).populate('participants','displayName avatar');
    if (!lobby) return res.status(404).json({ message: 'Lobby not found' });

    const attempts = await Attempt.find({ quiz: lobby.quiz, user: { $in: lobby.participants } })
      .select('user score createdAt')
      .populate('user','displayName avatar')
      .sort({ score: -1, createdAt: 1 });

    res.json({ lobby, attempts });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching stats' });
  }
});

export default router;
