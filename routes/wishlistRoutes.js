const express = require('express');
const router = express.Router();
const wishlistService = require('../services/wishlistService');
const { protect } = require('../middleware/auth');

router.use(protect);

// GET /api/wishlist - Get all wishlist items and statistics
router.get('/', async (req, res) => {
  try {
    const { search, statusFilter, sortOrder } = req.query;
    const items = await wishlistService.getAllItems(req.user._id, { search, statusFilter, sortOrder });
    const stats = await wishlistService.getStats(req.user._id);

    res.json({
      success: true,
      data: items,
      stats: stats
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/wishlist - Add new wishlist item
router.post('/', async (req, res) => {
  try {
    const { name, brand, series, subseries, price, link, sellers, image, notes, purchased } = req.body;
    const newItem = await wishlistService.addItem(req.user._id, { name, brand, series, subseries, price, link, sellers, image, notes, purchased });

    res.status(201).json({
      success: true,
      message: 'Item added to wishlist successfully',
      data: newItem
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /api/wishlist/:id - Update wishlist item
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updatedItem = await wishlistService.updateItem(req.user._id, id, req.body);

    res.json({
      success: true,
      message: 'Wishlist item updated successfully',
      data: updatedItem
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/wishlist/:id - Delete wishlist item
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await wishlistService.deleteItem(req.user._id, id);

    res.json({
      success: true,
      message: 'Wishlist item removed successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
