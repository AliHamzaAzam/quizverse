// Create file: /Users/azaleas/Developer/WebstormProjects/quizverse/backend/src/models/Report.js
import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema({
  quiz: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quiz',
    required: true,
    index: true
  },
  reportedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reason: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  status: {
    type: String,
    enum: ['pending', 'reviewed', 'action_taken'],
    default: 'pending',
    index: true
  }
}, { timestamps: true });

export default mongoose.model('Report', reportSchema);
