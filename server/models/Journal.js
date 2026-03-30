const mongoose = require('mongoose');

const journalSchema = new mongoose.Schema({
  userId:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title:   { type: String, default: '' },
  content: { type: String, required: true },
  mood:    { type: String, default: '' },
  emoji:   { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Journal', journalSchema);
