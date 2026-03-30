const mongoose = require('mongoose');

const clinicSchema = new mongoose.Schema({
  name:     { type: String, required: true },
  status:   { type: String, enum: ['open', 'wait', 'full'], default: 'open' },
  slots:    { type: Number, default: 0 },
  distance: { type: String },
  wait:     { type: String },
  address:  { type: String },
  x:        { type: Number }, // map position %
  y:        { type: Number },
}, { timestamps: true });

module.exports = mongoose.model('Clinic', clinicSchema);
