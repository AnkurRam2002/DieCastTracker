const express = require('express');
const router = express.Router();
const SeriesService = require('../services/seriesService');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', async (req, res) => {
  try {
    const brands = await SeriesService.getAllBrands(req.user._id);
    res.json({ success: true, brands });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/add', async (req, res) => {
  try {
    const { name } = req.body;
    const newBrand = await SeriesService.addBrand(name, req.user._id);
    res.json({ success: true, message: `Brand '${name}' added successfully!`, brand: newBrand });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { name } = req.body;
    await SeriesService.updateBrand(req.params.id, name, req.user._id);
    res.json({ success: true, message: "Brand updated successfully!" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
