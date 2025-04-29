import mongoose from 'mongoose';

const inviteSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, index: true },
  lobby: { type: mongoose.Schema.Types.ObjectId, ref: 'Lobby', required: true, index: true },
  inviter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  expiresAt: { type: Date, default: () => new Date(Date.now() + 1000 * 60 * 60 * 24) } // 24h
}, { timestamps: true });

export default mongoose.model('Invite', inviteSchema);