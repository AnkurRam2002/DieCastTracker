const mongoose = require('mongoose');

const brandSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, index: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false, index: true }
}, { timestamps: true });

module.exports = mongoose.model('Brand', brandSchema);
