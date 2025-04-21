import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  email:      { type: String, unique: true },
  password:   String,
  googleId:   String,
  displayName:String,
  avatar:     String,
  refreshToken: String,
  role:       { type: String, enum: ['user','admin'], default: 'user' },
  firstName:  String,
  lastName:   String,
  age:        Number,
  accentColor:String,
  bookmarkedQuizzes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Quiz' }]
}, { timestamps: true });

export default mongoose.model('User', userSchema);
