const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const path = require('path');
const jwtConfig = require('./config/jwt');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Helper function to read users
async function readUsers() {
    const data = await fs.readFile(path.join(__dirname, 'data', 'users.json'), 'utf8');
    return JSON.parse(data).users;
}

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

        // Use the JWT config module to generate the token
        const token = jwtConfig.generateToken(user);

        // Don't send password in response
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

// Protected route to get current user
app.get('/auth/me', authMiddleware, async (req, res) => {
    try {
        const users = await readUsers();
        const user = users.find(u => u.id === req.user.userId);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Don't send password in response
        const { password: _, ...userWithoutPassword } = user;
        res.json(userWithoutPassword);
    } catch (error) {
        console.error('Me endpoint error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Token verification endpoint
app.get('/auth/verify', authMiddleware, (req, res) => {
    // If middleware passes, the token is valid
    // Return user info from the token
    res.json({
        userId: req.user.userId,
        email: req.user.email,
        role: req.user.role,
        name: req.user.name
    });
});

// Get user by ID
app.get('/users/:id', async (req, res) => {
    try {
        const users = await readUsers();
        const user = users.find(u => u.id === req.params.id);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Don't send password in response
        const { password: _, ...userWithoutPassword } = user;
        res.json(userWithoutPassword);
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get all users
app.get('/users', async (req, res) => {
    try {
        const users = await readUsers();
        // Remove passwords from response
        const usersWithoutPasswords = users.map(user => {
            const { password: _, ...userWithoutPassword } = user;
            return userWithoutPassword;
        });
        res.json(usersWithoutPasswords);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Create a new user
app.post('/users', async (req, res) => {
    try {
        const userData = req.body;
        
        // Validate required fields
        if (!userData.name) {
            return res.status(400).json({ error: 'Name is required' });
        }
        
        // Generate ID if not provided
        if (!userData.id) {
            userData.id = `user_${Date.now()}`;
        }
        
        // Check for existing email
        if (userData.email) {
            const users = await readUsers();
            const existingUser = users.find(u => u.email === userData.email);
            if (existingUser) {
                return res.status(400).json({ error: 'User with this email already exists' });
            }
        }
        
        // Hash password if provided
        if (userData.password) {
            const salt = await bcrypt.genSalt(10);
            userData.password = await bcrypt.hash(userData.password, salt);
        }
        
        // Default role if not provided
        if (!userData.role) {
            userData.role = 'user';
        }
        
        // Add created timestamp
        userData.createdAt = new Date().toISOString();
        
        // Add the user to the JSON file
        const users = await readUsers();
        users.push(userData);
        
        await fs.writeFile(
            path.join(__dirname, 'data', 'users.json'),
            JSON.stringify({ users }, null, 2)
        );
        
        // Don't return password in response
        const { password, ...userWithoutPassword } = userData;
        
        res.status(201).json(userWithoutPassword);
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

const PORT = process.env.PORT || 3003;
app.listen(PORT, () => {
    console.log(`User service running on port ${PORT}`);
});

module.exports = app; 