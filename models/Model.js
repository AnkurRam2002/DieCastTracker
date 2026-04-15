const mongoose = require('mongoose');

const modelSchema = new mongoose.Schema({
  serial_number: { type: Number, required: true, unique: true, index: true },
  model_name: { type: String, required: true, index: true },
  metadata: {
    brand: { type: mongoose.Schema.Types.ObjectId, ref: 'Brand', required: true },
    series: { type: mongoose.Schema.Types.ObjectId, ref: 'Series', required: false },
    subseries: { type: mongoose.Schema.Types.ObjectId, ref: 'Subseries', required: false },
    model_no: { type: String, required: false }
  },
  date_added: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Model', modelSchema);
