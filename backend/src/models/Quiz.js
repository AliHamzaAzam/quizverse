import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
  text:          { type: String, required: true },
  options:       { type: [String], required: true },
  correctOption: { type: Number, required: true },
  hints:         { type: [String], default: [] }  // Added hints array per question
});

const quizSchema = new mongoose.Schema({
  title:       { type: String, required: true },
  description: String,
  category: { // Added category field
    type: String,
    trim: true,
    index: true, // Add index for potential backend filtering/sorting
  },
  code:        { 
    type: String, 
    required: true, 
    unique: true, 
    minlength: 4, 
    maxlength: 4,
    match: /^[a-zA-Z0-9]+$/, // Ensure alphanumeric
    index: true
  },
  questions:   [questionSchema],
  createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  timeLimit:   { type: Number, min: 0, default: null }, // Add timeLimit in minutes (0 or null means no limit)
  attemptCount: { // Added attempt count for popularity sorting
    type: Number,
    default: 0,
    index: true, // Add index for potential backend sorting
  },
  status: { // Added status field for admin control
    type: String,
    enum: ['active', 'hidden'],
    default: 'active',
    index: true
  }
}, { timestamps: true });

export default mongoose.model('Quiz', quizSchema);
