require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

// Import routes
const authRoutes = require('./routes/authRoutes');
const skillRoutes = require('./routes/skillRoutes');
const communityRoutes = require('./routes/communityRoutes');
const requestRoutes = require('./routes/requestRoutes');
const chatRoutes = require('./routes/chatRoutes');
const ratingRoutes = require('./routes/ratingRoutes');

const app = express();

// Connect to MongoDB
connectDB().then(async () => {
  try {
    const User = require('./models/User');
    await User.updateMany({}, { $set: { isOnline: false } });
    console.log('Reset all users to offline on startup');
  } catch (err) {
    console.error('Error resetting user status:', err);
  }
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/skills', skillRoutes);
app.use('/api/community', communityRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/ratings', ratingRoutes);

// Root route
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'SkillSwap Connect API is running',
    version: '1.0.0',
    documentation: '/api/docs' // Optional, if you plan to add docs later
  });
});

// Health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

const http = require('http');
const { initSocket } = require('./utils/socket');

const server = http.createServer(app);

// Initialize Socket.io
initSocket(server);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
