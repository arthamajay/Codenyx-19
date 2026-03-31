const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  sessionId:   { type: String, required: true, unique: true },
  userId:      { type: String, required: true },
  mentorId:    { type: String, required: true },
  mentorName:  { type: String, required: true },
  rating:      { type: Number, required: true, min: 1, max: 5 },
  comment:     { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Review', reviewSchema);
