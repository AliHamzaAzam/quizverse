// Create file: /Users/azaleas/Developer/WebstormProjects/quizverse/backend/src/models/Feedback.js
import mongoose from 'mongoose';

const feedbackSchema = new mongoose.Schema({
  quiz: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quiz',
    required: true,
    index: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  attempt: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Attempt',
    required: true,
    unique: true, // Ensure only one feedback per attempt
    index: true
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    // required: true // Optional: make rating mandatory
  },
  comment: {
    type: String,
    trim: true,
    maxlength: 1000
  }
}, { timestamps: true });

// Compound index to prevent duplicate feedback for the same quiz/user if attempt uniqueness isn't enough
// feedbackSchema.index({ quiz: 1, user: 1 }, { unique: true });

export default mongoose.model('Feedback', feedbackSchema);
