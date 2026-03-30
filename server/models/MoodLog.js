const mongoose = require('mongoose');

const moodLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  score:  { type: Number, required: true, min: 1, max: 10 },
  label:  { type: String },
  slot:   { type: String, enum: ['morning', 'afternoon', 'evening'], required: true },
  note:   { type: String, default: '' }, // optional short note
}, { timestamps: true });

// Prevent duplicate slot for same user on same calendar day
moodLogSchema.index(
  { userId: 1, slot: 1, createdAt: 1 },
  { unique: false } // we enforce uniqueness in the route logic
);

module.exports = mongoose.model('MoodLog', moodLogSchema);
