import express from 'express';
import User from '../models/User.js';
import Quiz from '../models/Quiz.js';
import Attempt from '../models/Attempt.js';
import Report from '../models/Report.js';
import { validateAdminOrigin } from '../middleware/admin.js';
import { authenticate, isAdmin } from '../middleware/auth.js';

const router = express.Router();

// Apply authentication, admin check, and origin validation
router.use(authenticate, isAdmin, validateAdminOrigin);

// --- User Management ---

// Get all users
router.get('/users', async (req, res) => {
    try {
        const users = await User.find({}, 'email role banned createdAt');
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Manage user roles
router.patch('/users/:id/role', async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(
            req.params.id,
            { role: req.body.role },
            { new: true }
        );
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Ban a user
router.patch('/users/:id/ban', async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { banned: true },
      { new: true }
    );
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User banned', user });
  } catch (error) {
    res.status(500).json({ message: 'Server error banning user' });
  }
});

// Unban a user
router.patch('/users/:id/unban', async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { banned: false },
      { new: true }
    );
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User unbanned', user });
  } catch (error) {
    res.status(500).json({ message: 'Server error unbanning user' });
  }
});

// Delete user
router.delete('/users/:id', async (req, res) => {
    try {
        const userId = req.params.id;
        const user = await User.findById(userId);

        if (!user) return res.status(404).json({ message: 'User not found' });
        await user.deleteOne();
        res.status(204).send();
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ message: 'Server error deleting user' });
    }
});

// --- Quiz Management ---

// Hide a quiz
router.patch('/quizzes/:id/hide', async (req, res) => {
  try {
    const quiz = await Quiz.findByIdAndUpdate(
      req.params.id,
      { status: 'hidden' },
      { new: true }
    );
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });
    res.json({ message: 'Quiz hidden', quiz });
  } catch (error) {
    res.status(500).json({ message: 'Server error hiding quiz' });
  }
});

// Unhide a quiz
router.patch('/quizzes/:id/unhide', async (req, res) => {
  try {
    const quiz = await Quiz.findByIdAndUpdate(
      req.params.id,
      { status: 'active' },
      { new: true }
    );
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });
    res.json({ message: 'Quiz unhidden', quiz });
  } catch (error) {
    res.status(500).json({ message: 'Server error unhiding quiz' });
  }
});

// --- Stats ---
router.get('/stats', async (req, res) => {
    try {
        const userCount = await User.countDocuments();
        const adminCount = await User.countDocuments({ role: 'admin' });
        const quizCount = await Quiz.countDocuments();
        const attemptCount = await Attempt.countDocuments();

        res.json({ userCount, adminCount, quizCount, attemptCount });
    } catch (error) {
        console.error('Error fetching admin stats:', error);
        res.status(500).json({ message: 'Server error fetching stats' });
    }
});

// --- Report Management ---

// GET /api/admin/reports - Fetch all reports
router.get('/reports', async (req, res) => {
    try {
        const reports = await Report.find()
            .populate('reportedBy', 'email displayName')
            .populate('quiz', 'title createdBy')
            .sort({ createdAt: -1 });
        res.json(reports);
    } catch (error) {
        console.error('Error fetching reports:', error);
        res.status(500).json({ message: 'Server error fetching reports' });
    }
});

// PATCH /api/admin/reports/:reportId - Update report status
router.patch('/reports/:reportId', async (req, res) => {
    const { status } = req.body;
    const { reportId } = req.params;
    const allowedStatuses = ['pending', 'resolved', 'dismissed'];
    if (!allowedStatuses.includes(status)) return res.status(400).json({ message: 'Invalid status value.' });

    try {
        const report = await Report.findByIdAndUpdate(
            reportId,
            { status: status, updatedAt: Date.now() },
            { new: true }
        )
        .populate('reportedBy', 'email displayName')
        .populate('quiz', 'title createdBy');

        if (!report) return res.status(404).json({ message: 'Report not found' });
        res.json(report);
    } catch (error) {
        console.error('Error updating report status:', error);
        res.status(500).json({ message: 'Server error updating report status' });
    }
});

// DELETE /api/admin/reports/:reportId - Delete a report
router.delete('/reports/:reportId', async (req, res) => {
    const { reportId } = req.params;
    try {
        const report = await Report.findByIdAndDelete(reportId);
        if (!report) return res.status(404).json({ message: 'Report not found' });
        res.status(204).send();
    } catch (error) {
        console.error('Error deleting report:', error);
        res.status(500).json({ message: 'Server error deleting report' });
    }
});

export default router;
