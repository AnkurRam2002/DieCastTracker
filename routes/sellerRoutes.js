const express = require('express');
const router = express.Router();
const Seller = require('../models/Seller');
const { protect } = require('../middleware/auth');

// Apply auth middleware to all seller routes
router.use(protect);

// Get all sellers for logged-in user
router.get('/', async (req, res) => {
  try {
    const sellers = await Seller.find({ user: req.user._id }).sort({ alias: 1 });
    res.json({ success: true, data: sellers });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get a single seller
router.get('/:id', async (req, res) => {
  try {
    const seller = await Seller.findOne({ _id: req.params.id, user: req.user._id });
    if (!seller) return res.status(404).json({ success: false, error: 'Seller not found' });
    res.json({ success: true, data: seller });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create a new seller
router.post('/', async (req, res) => {
  try {
    const newSeller = new Seller({
      ...req.body,
      user: req.user._id
    });
    const savedSeller = await newSeller.save();
    res.status(201).json({ success: true, data: savedSeller });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Update a seller
router.put('/:id', async (req, res) => {
  try {
    const updatedSeller = await Seller.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!updatedSeller) return res.status(404).json({ success: false, error: 'Seller not found' });
    res.json({ success: true, data: updatedSeller });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Delete a seller
router.delete('/:id', async (req, res) => {
  try {
    const deletedSeller = await Seller.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!deletedSeller) return res.status(404).json({ success: false, error: 'Seller not found' });
    res.json({ success: true, data: {} });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
