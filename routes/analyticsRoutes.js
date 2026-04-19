const express = require('express');
const router = express.Router();
const AnalyticsService = require('../services/analyticsService');
const PreorderService = require('../services/preorderService');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', async (req, res) => {
  try {
    const collectionIntelligence = await AnalyticsService.getCollectionIntelligence(req.user._id);
    const preorderStats = await PreorderService.getStatistics(req.user._id);

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
