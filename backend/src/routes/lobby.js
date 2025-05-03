import express from 'express';
import Lobby from '../models/Lobby.js';
import Attempt from '../models/Attempt.js';
import Quiz from '../models/Quiz.js';
import Invite from '../models/Invite.js';
import { authenticate } from '../middleware/auth.js';
import crypto from 'crypto';
import User from '../models/User.js'; // Import User model

const router = express.Router();
router.use(authenticate);

// Helper function to fetch and populate lobby data
const getPopulatedLobby = async (lobbyId) => {
  return await Lobby.findById(lobbyId)
    .populate('quiz', 'title timeLimit')
    .populate('host', 'displayName avatar')
    .populate('participants', 'displayName avatar');
};

// GET Lobbies hosted by the current user
router.get('/my-lobbies', async (req, res) => {
  try {
    const lobbies = await Lobby.find({ host: req.userId })
      .populate('quiz', 'title') // Populate quiz title for display
      .sort({ createdAt: -1 }); // Sort by creation date
    res.json(lobbies);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching hosted lobbies' });
  }
});

// GET Lobbies joined by the current user (but not hosted)
router.get('/joined', async (req, res) => {
  try {
    const lobbies = await Lobby.find({
      participants: req.userId, // User is in participants array
      host: { $ne: req.userId } // User is NOT the host
    })
      .populate('quiz', 'title')
      .populate('host', 'displayName') // Populate host display name
      .sort({ createdAt: -1 });
    res.json(lobbies);
  } catch (err) {
    console.error('Error fetching joined lobbies:', err);
    res.status(500).json({ message: 'Server error fetching joined lobbies' });
  }
});

// Create a new lobby
router.post('/', async (req, res) => {
  const { quizId, participantLimit, autoStartTime } = req.body;
  try {
    const quiz = await Quiz.findById(quizId);
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });

    const lobby = await Lobby.create({ quiz: quizId, host: req.userId, participants: [req.userId], participantLimit, startTime: autoStartTime || null });
    const populatedLobby = await getPopulatedLobby(lobby._id); // Fetch populated data
    // Optionally emit an event for lobby creation if needed for a public list
    // req.io.emit('lobby_created', populatedLobby);
    res.status(201).json(populatedLobby);
  } catch (err) {
    console.error(err);
    // Handle potential validation errors
    if (err.name === 'ValidationError') {
        return res.status(400).json({ message: 'Validation failed', errors: err.errors });
    }
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
    const populatedLobby = await getPopulatedLobby(lobby._id);
    req.io.to(lobby._id.toString()).emit('lobby_updated', populatedLobby); // Emit update
    res.json(populatedLobby);
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
    const populatedLobby = await getPopulatedLobby(lobby._id);
    req.io.to(lobby._id.toString()).emit('lobby_updated', populatedLobby); // Emit update
    res.json(populatedLobby);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error joining via invite' });
  }
});

// Leave a lobby
router.post('/:id/leave', async (req, res) => {
  try {
    const lobby = await Lobby.findById(req.params.id);
    if (!lobby) return res.status(404).json({ message: 'Lobby not found' });

    const initialParticipantCount = lobby.participants.length;
    lobby.participants = lobby.participants.filter(p => p.toString() !== req.userId);

    // If the host leaves, assign a new host or end the lobby?
    // Simple approach: End lobby if host leaves and others are present
    // More complex: Assign new host (e.g., first participant)
    let hostLeft = lobby.host.toString() === req.userId;
    let shouldEndLobby = false;

    if (hostLeft && lobby.participants.length > 0) {
        // Option 1: Assign new host
        // lobby.host = lobby.participants[0];
        // Option 2: End the lobby (simpler for now)
        lobby.status = 'ended';
        shouldEndLobby = true;
        console.log(`Host left lobby ${lobby._id}, ending it.`);
    } else if (lobby.participants.length === 0) {
        // If last participant leaves, end the lobby
        lobby.status = 'ended';
        shouldEndLobby = true;
        console.log(`Last participant left lobby ${lobby._id}, ending it.`);
    }

    // Only save and emit if participants actually changed or lobby ended
    if (lobby.participants.length !== initialParticipantCount || shouldEndLobby) {
        await lobby.save();
        const populatedLobby = await getPopulatedLobby(lobby._id);
        req.io.to(lobby._id.toString()).emit('lobby_updated', populatedLobby); // Emit update
        if (shouldEndLobby) {
             req.io.to(lobby._id.toString()).emit('lobby_ended', { lobbyId: lobby._id, reason: hostLeft ? 'Host left' : 'Empty' });
        }
        res.json(populatedLobby);
    } else {
        // User wasn't in the lobby
        res.status(400).json({ message: 'User not in lobby' });
    }

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error leaving lobby' });
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
    const populatedLobby = await getPopulatedLobby(lobby._id);
    req.io.to(lobby._id.toString()).emit('lobby_started', populatedLobby); // Emit specific start event
    req.io.to(lobby._id.toString()).emit('lobby_updated', populatedLobby); // Also emit general update
    res.json(populatedLobby);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error starting lobby' });
  }
});

// Get lobby stats (includes populated lobby data)
router.get('/:id/stats', async (req, res) => {
  try {
    const lobby = await getPopulatedLobby(req.params.id); // Use helper
    if (!lobby) return res.status(404).json({ message: 'Lobby not found' });

    // Fetch attempts only if the lobby has started or ended
    let attempts = [];
    if (lobby.status === 'started' || lobby.status === 'ended') {
        attempts = await Attempt.find({ quiz: lobby.quiz._id, user: { $in: lobby.participants.map(p => p._id) } })
          .select('user score createdAt')
          .populate('user','displayName avatar')
          .sort({ score: -1, createdAt: 1 });
    }

    res.json({ lobby, attempts });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching stats' });
  }
});

// Delete a lobby (host only)
router.delete('/:id', async (req, res) => {
  try {
    const lobby = await Lobby.findById(req.params.id);
    if (!lobby) return res.status(404).json({ message: 'Lobby not found' });
    if (lobby.host.toString() !== req.userId) return res.status(403).json({ message: 'Only the host can delete this lobby' });
    await lobby.deleteOne();
    res.status(204).end();
  } catch (err) {
    console.error('Error deleting lobby:', err);
    res.status(500).json({ message: 'Server error deleting lobby' });
  }
});

export default router;
