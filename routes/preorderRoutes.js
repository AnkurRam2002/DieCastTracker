const express = require('express');
const router = express.Router();
const PreorderService = require('../services/preorderService');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', async (req, res) => {
  try {
    const preorders = await PreorderService.getAllPreorders(req.user._id);
    const data = preorders.map(po => ({
      "S.No": po.serial_number,
      "Seller": po.seller,
      "Models": po.models,
      "ETA": po.eta,
      "Total Price": po.total_price,
      "PO Amount": po.po_amount,
      "On Arrival Amount": po.on_arrival_amount,
      "Delivery Status": po.delivery_status,
      "Date Added": po.date_added
    }));
    res.json({
      success: true,
      data: data,
      total_records: data.length
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { seller, models, eta, total_price, po_amount, on_arrival_amount, delivery_status } = req.body;
    await PreorderService.addPreorder(seller, models, eta, total_price, po_amount, on_arrival_amount, delivery_status, req.user._id);
    res.json({ success: true, message: "Preorder added successfully!" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/:serial_number', async (req, res) => {
  try {
    const { serial_number } = req.params;
    const updates = req.body;
    await PreorderService.updatePreorder(parseInt(serial_number), updates, req.user._id);
    res.json({ success: true, message: `Successfully updated preorder #${serial_number}!` });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.delete('/:serial_number', async (req, res) => {
  try {
    const { serial_number } = req.params;
    await PreorderService.deletePreorder(parseInt(serial_number), req.user._id);
    res.json({ success: true, message: `Successfully deleted preorder #${serial_number}!` });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/statistics', async (req, res) => {
  try {
    const stats = await PreorderService.getStatistics(req.user._id);
    res.json({ success: true, statistics: stats });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
