import express from 'express';
import Attempt from '../models/Attempt.js';
import Quiz from '../models/Quiz.js';
import Lobby from '../models/Lobby.js'; // Import Lobby model
// import { authenticate } from '../middleware/auth.js'; // No longer needed here

const router = express.Router();

// POST submit answers
router.post('/:quizId', async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.quizId);
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });

    const { answers, lobbyId } = req.body; // Destructure lobbyId from body
    let score = 0;
    answers.forEach(a => {
      const q = quiz.questions.id(a.questionId);
      if (q && q.correctOption === a.selectedOption) score++;
    });

    const attemptData = {
      user: req.userId,
      quiz: quiz._id,
      answers,
      hintsUsed: [], // Initialize hints usage
      score,
      completedAt: new Date() // Explicitly set completion time
    };

    // Add lobbyId if provided
    if (lobbyId) {
      attemptData.lobby = lobbyId;
    }

    const attempt = await Attempt.create(attemptData);

    // Increment attempt count on the Quiz model
    await Quiz.findByIdAndUpdate(req.params.quizId, { $inc: { attemptCount: 1 } });

    // --- Lobby Winner Logic ---
    let winnerDeclared = false;
    if (lobbyId) {
      try {
        const updatedLobby = await Lobby.findOneAndUpdate(
          {
            _id: lobbyId,
            status: 'started', // Only update if lobby is currently started
            'winner.user': { $exists: false } // Only update if no winner exists yet
          },
          {
            $set: {
              winner: {
                user: req.userId,
                attempt: attempt._id,
                finishedAt: attempt.completedAt
              }
            }
          },
          { new: true } // Return the updated document if modified
        ).populate('winner.user', 'displayName'); // Populate winner user details

        if (updatedLobby && updatedLobby.winner?.attempt?.equals(attempt._id)) {
          // This attempt successfully set the winner
          winnerDeclared = true;
          console.log(`Winner declared for lobby ${lobbyId}: User ${req.userId}`);

          // Emit event to the lobby room
          req.io.to(lobbyId.toString()).emit('lobby_winner_declared', {
            lobbyId: lobbyId,
            winner: {
              userId: updatedLobby.winner.user._id,
              displayName: updatedLobby.winner.user.displayName,
              attemptId: updatedLobby.winner.attempt,
              finishedAt: updatedLobby.winner.finishedAt
            }
          });

          // Optionally emit a full lobby update as well
          // const fullyPopulatedLobby = await getPopulatedLobby(lobbyId); // Need getPopulatedLobby helper
          // req.io.to(lobbyId.toString()).emit('lobby_updated', fullyPopulatedLobby);
        }
      } catch (lobbyError) {
        console.error(`Error updating lobby ${lobbyId} with winner:`, lobbyError);
        // Don't fail the attempt submission if lobby update fails
      }
    }
    // --- End Lobby Winner Logic ---

    res.status(201).json({ score: attempt.score, attemptId: attempt._id, hintsUsed: attempt.hintsUsed, winnerDeclared });
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
      .sort({ completedAt: -1 }) // Sort by completion time
      .lean();

    // Return hintsUsed along with score and answers
    res.json(arr.map(a => ({
      attemptId: a._id,
      quiz: a.quiz,
      score: a.score,
      hintsUsed: a.hintsUsed,
      completedAt: a.completedAt // Use completedAt
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
      .sort({ completedAt: -1 }) // Sort by completion time
      .lean();

    res.json(list.map(a => ({
      user: a.user,
      score: a.score,
      hintsUsed: a.hintsUsed,  // Include hintsUsed
      completedAt: a.completedAt // Use completedAt
    })));
  } catch (error) {
    console.error('Error fetching attempts for quiz:', error);
    res.status(500).json({ message: 'Failed to fetch quiz attempts' });
  }
});

export default router;
