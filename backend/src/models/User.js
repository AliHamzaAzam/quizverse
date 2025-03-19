import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    email: { type: String, unique: true },
    password: String,
    googleId: String,
    displayName: String,
    avatar: String,
    refreshToken: String
}, { timestamps: true });

export default mongoose.model('User', userSchema);