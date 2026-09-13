const mongoose = require('mongoose');

const sellerSchema = new mongoose.Schema({
  alias: { type: String, required: true },
  firstName: { type: String },
  lastName: { type: String },
  number: { type: String },
  email: { type: String },
  modeOfSale: { type: String },
  links: [{
    name: { type: String },
    link: { type: String }
  }],
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true }
}, { timestamps: true });

module.exports = mongoose.model('Seller', sellerSchema);
