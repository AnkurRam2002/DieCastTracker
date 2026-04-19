const mongoose = require('mongoose');

const subseriesSchema = new mongoose.Schema({
  name: { type: String, required: true, index: true },
  series: { type: mongoose.Schema.Types.ObjectId, ref: 'Series', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false, index: true }
}, { timestamps: true });

// Compound index so each user can have unique subseries per series
subseriesSchema.index({ name: 1, series: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('Subseries', subseriesSchema);
