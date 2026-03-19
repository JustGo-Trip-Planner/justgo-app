import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  first_name: String,
  last_name: String,
  email: { type: String, required: true, unique: true },
  password_hash: { type: String, required: true },
  birth_date: Date,
  gender: String,
  phone: String,
  avatar: String,

  interests: { type: [String], default: [] },
  activities: { type: [String], default: [] },

  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

export default mongoose.model("User", userSchema);
