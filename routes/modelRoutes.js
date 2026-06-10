const express = require('express');
const router = express.Router();
const ModelService = require('../services/modelService');
const SeriesService = require('../services/seriesService');
const Model = require('../models/Model');
const { protect } = require('../middleware/auth');
const rateLimit = require('express-rate-limit');

const addModelLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, error: 'Too many models added, please try again later' },
  statusCode: 429
});

router.use(protect);

router.get('/data', async (req, res) => {
  try {
    const { page, limit, search, brandFilter, mainSeriesFilter, seriesFilter, sortOrder, tab } = req.query;
    const result = await ModelService.getAllModels(req.user._id, {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 50,
      search: search || '',
      brandFilter: brandFilter || '',
      mainSeriesFilter: mainSeriesFilter || '',
      seriesFilter: seriesFilter || '',
      sortOrder: sortOrder || 'asc',
      tab: tab || 'hotwheels'
    });

    const data = result.data.map(m => ({
      "S.No": m.serial_number,
      "Item Name": m.model_name,
      "Subseries": m.metadata.subseries ? m.metadata.subseries.name : "",
      "Series": m.metadata.series ? m.metadata.series.name : "",
      "Brand": m.metadata.brand ? m.metadata.brand.name : "Hot Wheels",
      "Item No": m.metadata.model_no || ""
    }));

    res.json({
      success: true,
      data: data,
      columns: ["S.No", "Model Name", "Subseries", "Series", "Brand"],
      total_records: result.total,
      page: result.page,
      total_pages: result.totalPages
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/add', addModelLimiter, async (req, res) => {
  try {
    const { model_name, series, subseries, brand, model_no } = req.body;
    
    // Input validation
    if (!model_name || typeof model_name !== 'string' || model_name.trim() === '') {
      return res.status(400).json({ success: false, error: 'Valid model_name is required' });
    }
    if (model_no && typeof model_no !== 'string') {
      return res.status(400).json({ success: false, error: 'model_no must be a string' });
    }

    const newM = await ModelService.addModel(model_name, series, subseries, brand, model_no, req.user._id);
    res.json({
      success: true,
      message: `Successfully added '${model_name}' to the collection!`,
      serial_number: newM.serial_number
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/update', async (req, res) => {
  try {
    const { serial_number, updates } = req.body;
    await ModelService.updateModel(serial_number, updates, req.user._id);
    res.json({ success: true, message: `Successfully updated model with serial number ${serial_number}!` });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.delete('/delete', async (req, res) => {
  try {
    const { serial_number } = req.body;
    await ModelService.deleteModel(serial_number, req.user._id);
    res.json({ success: true, message: `Successfully deleted model with serial number ${serial_number}!` });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/stats', async (req, res) => {
  try {
    const totalModels = await Model.countDocuments({ user: req.user._id });
    const modelsList = await Model.find({ user: req.user._id })
      .populate('metadata.brand')
      .populate('metadata.series')
      .populate('metadata.subseries')
      .lean();

    const seriesCounts = {};
    const subseriesCounts = {};
    for (const m of modelsList) {
      const sName = m.metadata.series ? m.metadata.series.name : "Unknown";
      seriesCounts[sName] = (seriesCounts[sName] || 0) + 1;

      const subName = m.metadata.subseries ? m.metadata.subseries.name : "Unknown";
      subseriesCounts[subName] = (subseriesCounts[subName] || 0) + 1;
    }

    const stats = {
      total_models: totalModels,
      column_info: {
        "Main Series": {
          type: "text",
          unique_values: Object.keys(seriesCounts).length,
          top_values: seriesCounts
        },
        "Series": {
          type: "text",
          unique_values: Object.keys(subseriesCounts).length,
          top_values: subseriesCounts
        }
      }
    };
    res.json({ success: true, stats });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/search', async (req, res) => {
  try {
    const { q = "" } = req.query;
    if (!q) {
      return res.redirect('/api/models/data');
    }

    const searchQuery = q.toLowerCase();
    const allModels = await Model.find({ user: req.user._id })
      .populate('metadata.brand')
      .populate('metadata.series')
      .populate('metadata.subseries')
      .lean();

    const filtered = allModels.filter(m => {
      const modelMatch = m.model_name.toLowerCase().includes(searchQuery);
      const subName = m.metadata.subseries ? m.metadata.subseries.name : "";
      const sName = m.metadata.series ? m.metadata.series.name : "";
      const brand = m.metadata.brand ? m.metadata.brand.name : "Hot Wheels";

      const seriesMatch = subName.toLowerCase().includes(searchQuery);
      const mainSeriesMatch = sName.toLowerCase().includes(searchQuery);
      const brandMatch = brand.toLowerCase().includes(searchQuery);

      return modelMatch || seriesMatch || mainSeriesMatch || brandMatch;
    }).map(m => ({
      "S.No": m.serial_number,
      "Item Name": m.model_name,
      "Subseries": m.metadata.subseries ? m.metadata.subseries.name : "",
      "Series": m.metadata.series ? m.metadata.series.name : "",
      "Brand": m.metadata.brand ? m.metadata.brand.name : "Hot Wheels",
      "Item No": m.metadata.model_no || ""
    }));

    res.json({
      success: true,
      data: filtered,
      total_found: filtered.length,
      search_query: q
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/dropdown-options', async (req, res) => {
  try {
    // Dropdown options could be user specific, or global.
    // Assuming user specific based on req.user._id
    const config = await SeriesService.getSeriesConfig(req.user._id);
    res.json({
      success: true,
      series: config.series_options
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
