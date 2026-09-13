const mongoose = require('mongoose');

const preorderSchema = new mongoose.Schema({
  serial_number: { type: Number, required: true, unique: true, index: true },
  seller: { type: String, index: true },
  seller_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Seller', index: true },
  seller_link: { type: String },
  models: { type: String, required: true },
  eta: { type: String },
  total_price: { type: Number },
  po_amount: { type: Number },
  on_arrival_amount: { type: Number },
  delivery_status: { type: String, default: "Pending" },
  date_added: { type: String }, // Stored as YYYY-MM-DD for compatibility
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false, index: true }
}, { timestamps: true });

module.exports = mongoose.model('Preorder', preorderSchema);
