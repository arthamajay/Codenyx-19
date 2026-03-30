const mongoose = require('mongoose');

const ventSchema = new mongoose.Schema({
  anon:      { type: String, required: true },
  color:     { type: String, required: true },
  mood:      { type: String, required: true },
  text:      { type: String, required: true },
  distress:  { type: Number, default: 0 },
  // reactions stored as a plain object with emoji keys
  reactions: {
    type: Map,
    of: Number,
    default: { '🤍': 0, '💜': 0, '🌱': 0 },
  },
  // track who reacted to what so toggling works
  reactedBy: [{ userId: String, emoji: String }],
}, { timestamps: true });

module.exports = mongoose.model('Vent', ventSchema);
