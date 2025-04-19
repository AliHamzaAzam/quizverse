import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
  text:          { type: String, required: true },
  options:       { type: [String], required: true },
  correctOption: { type: Number, required: true }
});

const quizSchema = new mongoose.Schema({
  title:       { type: String, required: true },
  description: String,
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
  timeLimit:   { type: Number, min: 0, default: null } // Add timeLimit in minutes (0 or null means no limit)
}, { timestamps: true });

export default mongoose.model('Quiz', quizSchema);
