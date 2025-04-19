import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
  text:          { type: String, required: true },
  options:       { type: [String], required: true },
  correctOption: { type: Number, required: true }
});

const quizSchema = new mongoose.Schema({
  title:       { type: String, required: true },
  description: String,
  questions:   [questionSchema],
  createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

export default mongoose.model('Quiz', quizSchema);
