const mongoose = require('mongoose');

const sellerOfferSchema = new mongoose.Schema({
  seller_name: { type: String, required: false },
  price: { type: Number, required: false, default: 0 },
  link: { type: String, required: false },
  notes: { type: String, required: false }
});

const wishlistSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: false, default: 'Untitled Collectible' },
  brand: { type: String, required: false },
  series: { type: String, required: false },
  subseries: { type: String, required: false },
  price: { type: Number, required: false, default: 0 },
  link: { type: String, required: false },
  sellers: [sellerOfferSchema],
  image: { type: String, required: false }, // Base64 data URL or web image link
  notes: { type: String, required: false },
  purchased: { type: Boolean, default: false, index: true }
}, { timestamps: true });

module.exports = mongoose.model('Wishlist', wishlistSchema);
