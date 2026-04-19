const mongoose = require('mongoose');

const brandSchema = new mongoose.Schema({
  name: { type: String, required: true, index: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false, index: true }
}, { timestamps: true });

// Compound index so each user can have their own unique brands
brandSchema.index({ name: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('Brand', brandSchema);
