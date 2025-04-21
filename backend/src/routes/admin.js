import express from 'express';
import User from '../models/User.js';
import Quiz from '../models/Quiz.js'; // Import Quiz model
import Attempt from '../models/Attempt.js'; // Import Attempt model
import Report from '../models/Report.js'; // Import Report model
import { validateAdminOrigin } from '../middleware/admin.js';

const router = express.Router();

router.use(validateAdminOrigin);

// Get all users
router.get('/users', async (req, res) => {
    try {
        const users = await User.find({}, 'email role createdAt');
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
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete user
router.delete('/users/:id', async (req, res) => {
    try {
        const userId = req.params.id;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Optional: Add checks here if you want to prevent deletion of certain users (e.g., the last admin)

        await user.deleteOne();
        res.status(204).send(); // No content on successful deletion
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ message: 'Server error deleting user' });
    }
});

router.get('/stats', async (req, res) => {
    try {
        const userCount = await User.countDocuments();
        const adminCount = await User.countDocuments({ role: 'admin' });
        const quizCount = await Quiz.countDocuments(); // Add quiz count
        const attemptCount = await Attempt.countDocuments(); // Add attempt count

        res.json({ userCount, adminCount, quizCount, attemptCount }); // Include new counts
    } catch (error) {
        console.error('Error fetching admin stats:', error); // Add better logging
        res.status(500).json({ message: 'Server error fetching stats' });
    }
});

// --- Report Management ---

// GET /api/admin/reports - Fetch all reports
router.get('/reports', async (req, res) => {
    try {
        const reports = await Report.find()
            .populate('reportedBy', 'email displayName') // Populate reporter info - Changed 'reporter' to 'reportedBy'
            .populate('quiz', 'title createdBy') // Populate quiz info
            .sort({ createdAt: -1 }); // Sort by newest first
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

    // Optional: Validate status value
    const allowedStatuses = ['pending', 'resolved', 'dismissed'];
    if (!allowedStatuses.includes(status)) {
        return res.status(400).json({ message: 'Invalid status value.' });
    }

    try {
        const report = await Report.findByIdAndUpdate(
            reportId,
            { status: status, updatedAt: Date.now() }, // Update status and timestamp
            { new: true } // Return the updated document
        ).populate('reportedBy', 'email displayName').populate('quiz', 'title createdBy'); // Changed 'reporter' to 'reportedBy'

        if (!report) {
            return res.status(404).json({ message: 'Report not found' });
        }

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

        if (!report) {
            return res.status(404).json({ message: 'Report not found' });
        }

        res.status(204).send(); // No content on successful deletion
    } catch (error) {
        console.error('Error deleting report:', error);
        res.status(500).json({ message: 'Server error deleting report' });
    }
});

export default router;