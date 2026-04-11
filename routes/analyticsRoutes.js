const express = require('express');
const router = express.Router();
const AnalyticsService = require('../services/analyticsService');
const PreorderService = require('../services/preorderService');

router.get('/', async (req, res) => {
  try {
    const collectionIntelligence = await AnalyticsService.getCollectionIntelligence();
    const preorderStats = await PreorderService.getStatistics();

    res.json({
      success: true,
      analytics: collectionIntelligence,
      preorders: preorderStats
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
