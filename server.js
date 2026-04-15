require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');

const modelRoutes = require('./routes/modelRoutes');
const brandRoutes = require('./routes/brandRoutes');
const seriesRoutes = require('./routes/seriesRoutes');
const preorderRoutes = require('./routes/preorderRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'https://diecast-tracker.netlify.app'],
  credentials: true
}));
app.use(express.json());
app.use(morgan('dev')); // Logs to console

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URL || 'mongodb://localhost:27017/diecast_tracker';
mongoose.connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/models', modelRoutes);
app.use('/api/brands', brandRoutes);
app.use('/api/series', seriesRoutes);
app.use('/api/preorders', preorderRoutes);
app.use('/api/analytics', analyticsRoutes);

// Serve static files from React frontend
if (process.env.NODE_ENV === 'production' || require('fs').existsSync(path.join(__dirname, 'frontend/dist'))) {
  app.use(express.static(path.join(__dirname, 'frontend/dist')));
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api/')) {
      res.sendFile(path.join(__dirname, 'frontend/dist/index.html'));
    } else {
      res.status(404).json({ success: false, error: "API Route Not Found" });
    }
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, error: err.message || 'Internal Server Error' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
