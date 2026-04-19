const mongoose = require('mongoose');

const seriesSchema = new mongoose.Schema({
  name: { type: String, required: true, index: true },
  brand: { type: mongoose.Schema.Types.ObjectId, ref: 'Brand', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false, index: true }
}, { timestamps: true });

// Compound index to allow duplicate names across different brands
seriesSchema.index({ name: 1, brand: 1 }, { unique: true });

module.exports = mongoose.model('Series', seriesSchema);
