const mongoose = require('mongoose');

const subseriesSchema = new mongoose.Schema({
  name: { type: String, required: true, index: true },
  series: { type: mongoose.Schema.Types.ObjectId, ref: 'Series', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false, index: true }
}, { timestamps: true });

module.exports = mongoose.model('Subseries', subseriesSchema);
