const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const userRoutes = require('./routes/userRoutes');
const fs = require('fs-extra');

// Initialize app
const app = express();
const PORT = process.env.PORT || 3003;

// Ensure data directory exists
fs.ensureDirSync('./data');

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Routes
app.use('/users', userRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({
    service: 'user-service',
    endpoints: [
      { method: 'GET', path: '/users', description: 'Get all users' },
      { method: 'GET', path: '/users/:id', description: 'Get user by ID' },
      { method: 'POST', path: '/users', description: 'Create a new user' },
      { method: 'GET', path: '/users/validate/user', description: 'Validate user from X-User-Id header' },
      { method: 'GET', path: '/health', description: 'Health check' },
      { method: 'GET', path: '/health/live', description: 'Liveness probe' },
      { method: 'GET', path: '/health/ready', description: 'Readiness probe' }
    ]
  });
});

// Health check endpoints - ensure these match exactly what Kubernetes is looking for
// General health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy', service: 'user-service' });
});

// Make sure we catch both with and without leading slash for maximum compatibility
app.get('health', (req, res) => {
  res.status(200).json({ status: 'healthy', service: 'user-service' });
});

// Liveness probe
app.get('/health/live', (req, res) => {
  console.log('Liveness probe called');
  res.status(200).json({ status: 'live' });
});

// Also handle without leading slash
app.get('health/live', (req, res) => {
  console.log('Liveness probe called (no leading slash)');
  res.status(200).json({ status: 'live' });
});

// Readiness probe
app.get('/health/ready', (req, res) => {
  console.log('Readiness probe called');
  res.status(200).json({ status: 'ready' });
});

// Also handle without leading slash
app.get('health/ready', (req, res) => {
  console.log('Readiness probe called (no leading slash)');
  res.status(200).json({ status: 'ready' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production' ? null : err.message
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`User service running on port ${PORT}`);
  console.log(`Health endpoints available at:`);
  console.log(`- /health`);
  console.log(`- /health/live`);
  console.log(`- /health/ready`);
});

module.exports = app; // For testing 