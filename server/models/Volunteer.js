const mongoose = require('mongoose');

const volunteerSchema = new mongoose.Schema({
  name:         { type: String, required: true },
  initials:     { type: String, required: true },
  color:        { type: String, required: true },
  status:       { type: String, enum: ['available', 'away', 'busy'], default: 'available' },
  specialties:  [String],
  sessions:     { type: Number, default: 0 },
  rating:       { type: Number, default: 5.0 },
  responseTime: { type: String, default: '< 2 min' },
  bio:          { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Volunteer', volunteerSchema);
