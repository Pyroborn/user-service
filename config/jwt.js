const jwt = require('jsonwebtoken');

// Make sure dotenv is initialized
require('dotenv').config();

// Load JWT secret from environment
let JWT_SECRET = process.env.JWT_SECRET;

// Log secret length for validation
if (JWT_SECRET) {
    console.log(`JWT Config: JWT_SECRET loaded with length ${JWT_SECRET.length}`);
} else {
    console.error('JWT_SECRET environment variable is not set!');
    console.error('Authentication and token validation will fail.');
}

// Remove quotes if present
if (JWT_SECRET && JWT_SECRET.startsWith('"') && JWT_SECRET.endsWith('"')) {
    JWT_SECRET = JWT_SECRET.substring(1, JWT_SECRET.length - 1);
    console.log('JWT Config: Removed quotes from JWT_SECRET');
}

// Trim whitespace
if (JWT_SECRET) {
    JWT_SECRET = JWT_SECRET.trim();
}

// Generate token with standard claims
const generateToken = (user, expiresIn = '24h') => {
    return jwt.sign(
        {
            id: user.id,
            userId: user.id,
            email: user.email,
            name: user.name,
            role: user.role || 'user'
        },
        JWT_SECRET,
        { expiresIn }
    );
};

// Verify token
const verifyToken = (token) => {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        console.error('JWT verification error:', error.message);
        return null;
    }
};

// Decode token without verification
const decodeToken = (token) => {
    try {
        return jwt.decode(token);
    } catch (error) {
        console.error('JWT decode error:', error.message);
        return null;
    }
};

module.exports = {
    generateToken,
    verifyToken,
    decodeToken,
    JWT_SECRET
};