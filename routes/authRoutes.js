const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { success: false, error: 'Too many login attempts, please try again later' },
  statusCode: 429
});

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'secret', {
    expiresIn: '30d',
  });
};

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 register requests per windowMs
  message: { success: false, error: 'Too many accounts created from this IP, please try again after an hour' },
  statusCode: 429
});

router.post('/register', registerLimiter, async (req, res) => {
  const { username, password } = req.body;
  try {
    const userExists = await User.findOne({ username });
    if (userExists) {
      return res.status(400).json({ success: false, error: 'User already exists' });
    }
    const user = await User.create({ username, password });
    if (user) {
      res.status(201).json({
        success: true,
        _id: user._id,
        username: user.username,
        token: generateToken(user._id)
      });
    } else {
      res.status(400).json({ success: false, error: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/login', loginLimiter, async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username });
    if (user && (await user.matchPassword(password))) {
      res.json({
        success: true,
        _id: user._id,
        username: user.username,
        token: generateToken(user._id)
      });
    } else {
      res.status(401).json({ success: false, error: 'Invalid username or password' });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/profile', protect, async (req, res) => {
  res.json({ success: true, user: req.user });
});

router.put('/preferences', protect, async (req, res) => {
  try {
    const { primary_brand, secondary_brand } = req.body;
    const newPrimary = Object.prototype.hasOwnProperty.call(req.body, 'primary_brand') 
      ? primary_brand 
      : req.user.primary_brand;
    const newSecondary = Object.prototype.hasOwnProperty.call(req.body, 'secondary_brand') 
      ? secondary_brand 
      : req.user.secondary_brand;

    if (newPrimary && newSecondary && newPrimary === newSecondary) {
      return res.status(400).json({ success: false, error: 'Primary and secondary brands cannot be the same' });
    }

    if (Object.prototype.hasOwnProperty.call(req.body, 'primary_brand')) {
      req.user.primary_brand = primary_brand;
    }
    if (Object.prototype.hasOwnProperty.call(req.body, 'secondary_brand')) {
      req.user.secondary_brand = secondary_brand;
    }
    
    await req.user.save();
    res.json({ success: true, user: req.user });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
