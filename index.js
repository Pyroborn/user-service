const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const fs = require('fs-extra');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const path = require('path');
const userRoutes = require('./routes/userRoutes');

// Load JWT config or use environment variables
let jwtConfig;
try {
  jwtConfig = require('./config/jwt');
  console.log('JWT Config: JWT_SECRET loaded with length', jwtConfig.JWT_SECRET.length);
} catch (error) {
  console.log('Could not load JWT config, using environment variable instead');
  jwtConfig = {
    JWT_SECRET: process.env.JWT_SECRET || 'your_development_secret_key',
    expiresIn: '24h',
    generateToken: (user) => {
      return jwt.sign(
        { 
          userId: user.id, 
          email: user.email,
          role: user.role,
          name: user.name
        }, 
        process.env.JWT_SECRET || 'your_development_secret_key', 
        { expiresIn: '24h' }
      );
    }
  };
}

// Initialize app
const app = express();
const PORT = process.env.PORT || 3003;

// Create data directory
fs.ensureDirSync('./data');

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Read users helper function
async function readUsers() {
  try {
    const filePath = path.join(__dirname, 'data', 'users.json');
    
    if (!await fs.pathExists(filePath)) {
      await fs.writeFile(filePath, JSON.stringify({ users: [] }, null, 2));
      return [];
    }
    
    const data = await fs.readFile(filePath, 'utf8');
    const jsonData = JSON.parse(data);
    return jsonData.users || [];
  } catch (error) {
    console.error('Error reading users file:', error);
    return [];
  }
}

// Auth middleware
const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, jwtConfig.JWT_SECRET);
    
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Authentication routes
app.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const users = await readUsers();
    const user = users.find(u => u.email === email);

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwtConfig.generateToken(user);

    const { password: _, ...userWithoutPassword } = user;

    res.json({
      token,
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get current user route
app.get('/auth/me', authMiddleware, async (req, res) => {
  try {
    const users = await readUsers();
    const user = users.find(u => u.id === req.user.userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { password: _, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) {
    console.error('Me endpoint error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Token verification endpoint
app.get('/auth/verify', authMiddleware, (req, res) => {
  res.json({
    userId: req.user.userId,
    email: req.user.email,
    role: req.user.role,
    name: req.user.name
  });
});

// User routes
app.use('/users', userRoutes);

// Root route - API documentation
app.get('/', (req, res) => {
  res.json({
    service: 'user-service',
    endpoints: [
      // User endpoints
      { method: 'GET', path: '/users', description: 'Get all users' },
      { method: 'GET', path: '/users/:id', description: 'Get user by ID' },
      { method: 'POST', path: '/users', description: 'Create a new user' },
      { method: 'GET', path: '/users/validate/user', description: 'Validate user from X-User-Id header' },
      
      // Auth endpoints
      { method: 'POST', path: '/auth/login', description: 'Login with email and password' },
      { method: 'GET', path: '/auth/me', description: 'Get current user data (requires auth)' },
      { method: 'GET', path: '/auth/verify', description: 'Verify JWT token (requires auth)' },
      
      // Health endpoints
      { method: 'GET', path: '/health', description: 'Health check' },
      { method: 'GET', path: '/health/live', description: 'Liveness probe' },
      { method: 'GET', path: '/health/ready', description: 'Readiness probe' }
    ]
  });
});

// Health check endpoints
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy', service: 'user-service' });
});

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

app.get('health/ready', (req, res) => {
  console.log('Readiness probe called (no leading slash)');
  res.status(200).json({ status: 'ready' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`User service running on port ${PORT}`);
});

module.exports = app; // For testing 