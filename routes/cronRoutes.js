const express = require('express');
const router = express.Router();
const { processMonthlyPreorders } = require('../services/cronService');

// POST /api/cron/trigger-emails
// Secure route to be called by external cron service
router.post('/trigger-emails', async (req, res) => {
  // Simple security check using an environment variable
  const authHeader = req.headers['authorization'];
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.warn('CRON_SECRET is not set in environment variables');
    return res.status(500).json({ success: false, error: 'Server misconfiguration' });
  }

  // Expecting "Bearer YOUR_SECRET" or just the secret itself
  const providedSecret = authHeader && authHeader.startsWith('Bearer ') 
    ? authHeader.split(' ')[1] 
    : authHeader;

  if (providedSecret !== cronSecret) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  try {
    const result = await processMonthlyPreorders();
    res.status(200).json(result);
  } catch (error) {
    console.error('API Cron Trigger Error:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
});

module.exports = router;
