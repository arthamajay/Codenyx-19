const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  from:    { type: String, enum: ['user', 'volunteer'], required: true },
  text:    { type: String, required: true },
  time:    { type: Date, default: Date.now },
});

const chatSessionSchema = new mongoose.Schema({
  userId:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  volunteerName: { type: String, required: true },
  messages:      [messageSchema],
  escalated:     { type: Boolean, default: false },
  duration:      { type: Number, default: 0 }, // minutes
}, { timestamps: true });

module.exports = mongoose.model('ChatSession', chatSessionSchema);
