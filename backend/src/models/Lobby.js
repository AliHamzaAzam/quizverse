// FILE: src/models/Lobby.js
import mongoose from 'mongoose';

const lobbySchema = new mongoose.Schema({
  quiz: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true, index: true },
  host: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  participantLimit: { type: Number, required: true, min: 1 },
  status: { type: String, enum: ['waiting','started','ended'], default: 'waiting', index: true },
  startTime: Date
}, { timestamps: true });

export default mongoose.model('Lobby', lobbySchema);