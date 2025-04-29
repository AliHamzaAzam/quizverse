import mongoose from 'mongoose';

const answerSchema = new mongoose.Schema({
  questionId:     { type: mongoose.Schema.Types.ObjectId, required: true },
  selectedOption: { type: Number, required: true }
});

const hintUsageSchema = new mongoose.Schema({
  questionId: { type: mongoose.Schema.Types.ObjectId, required: true },
  countUsed:  { type: Number, default: 0 }
});

const attemptSchema = new mongoose.Schema({
  user:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  quiz:   { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true },
  answers:[answerSchema],
  hintsUsed: [hintUsageSchema],
  score:  { type: Number, required: true }
}, { timestamps: true });

export default mongoose.model('Attempt', attemptSchema);
