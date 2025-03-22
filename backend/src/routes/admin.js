import express from 'express';
import User from '../models/User.js';
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

router.get('/stats', async (req, res) => {
    try {
        const userCount = await User.countDocuments();
        const adminCount = await User.countDocuments({ role: 'admin' });

        res.json({ userCount, adminCount });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;