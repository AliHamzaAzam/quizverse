import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from './src/models/User.js';
import dotenv from 'dotenv';

dotenv.config();

const createAdmin = async () => {
    await mongoose.connect(process.env.MONGO_URI);

    const admin = await User.create({
        email: 'admin@quizverse.com',
        password: await bcrypt.hash('TempPass123!', 12),
        role: 'admin'
    });

    console.log('✅ Admin created:', admin);
    process.exit(0);
};

createAdmin().catch(console.error);