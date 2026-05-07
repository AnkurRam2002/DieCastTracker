const express = require('express');
const router = express.Router();
const SeriesService = require('../services/seriesService');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', async (req, res) => {
  try {
    const config = await SeriesService.getSeriesConfig(req.user._id);
    res.json({
      success: true,
      series_options: config.series_options,
      series_metadata: config.series_metadata
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/all', async (req, res) => {
  try {
    const series = await SeriesService.getAllSeries(req.user._id);
    res.json({ success: true, series });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/subseries/all', async (req, res) => {
  try {
    const subseries = await SeriesService.getAllSubseries(req.user._id);
    res.json({ success: true, subseries });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/add', async (req, res) => {
  try {
    const { name, brandId } = req.body;
    await SeriesService.addSeries(name, brandId, req.user._id);
    res.json({ success: true, message: `Series '${name}' added successfully!` });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { name, brandId } = req.body;
    await SeriesService.updateSeries(req.params.id, { name, brandId }, req.user._id);
    res.json({ success: true, message: "Series updated successfully!" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/subseries/add', async (req, res) => {
  try {
    const { seriesId, name } = req.body;
    await SeriesService.addSubseries(seriesId, name, req.user._id);
    res.json({ success: true, message: `Subseries '${name}' added successfully!` });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/subseries/:id', async (req, res) => {
  try {
    const { name, seriesId } = req.body;
    await SeriesService.updateSubseries(req.params.id, { name, seriesId }, req.user._id);
    res.json({ success: true, message: "Subseries updated successfully!" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
