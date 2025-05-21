const UserModel = require('../models/userModel');

// Get all users
const getUsers = async (req, res, next) => {
  try {
    const users = await UserModel.getAllUsers();
    
    // Remove passwords from all users
    const usersWithoutPasswords = users.map(user => {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });
    
    res.json(usersWithoutPasswords);
  } catch (error) {
    next(error);
  }
};

// Get a single user by ID
const getUserById = async (req, res, next) => {
  try {
    const userId = req.params.id;
    const user = await UserModel.getUserById(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Remove password from response
    const { password, ...userWithoutPassword } = user;
    
    res.json(userWithoutPassword);
  } catch (error) {
    next(error);
  }
};

// Create a new user
const createUser = async (req, res, next) => {
  try {
    const userData = req.body;
    const newUser = await UserModel.createUser(userData);
    
    // Don't return password in response
    const { password, ...userWithoutPassword } = newUser;
    
    res.status(201).json(userWithoutPassword);
  } catch (error) {
    if (error.message.includes('already exists') || error.message.includes('required')) {
      return res.status(400).json({ error: error.message });
    }
    next(error);
  }
};

// Validate user existence
const validateUser = async (req, res, next) => {
  try {
    // Extract user ID from X-User-Id header
    const userId = req.header('X-User-Id');
    
    if (!userId) {
      return res.status(400).json({ error: 'X-User-Id header is required' });
    }
    
    const user = await UserModel.getUserById(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Remove password from response
    const { password, ...userWithoutPassword } = user;
    
    res.json({ valid: true, user: userWithoutPassword });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUsers,
  getUserById,
  createUser,
  validateUser
}; 