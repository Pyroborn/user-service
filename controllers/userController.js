const UserModel = require('../models/userModel');

// Get all users
const getUsers = async (req, res, next) => {
  try {
    const users = await UserModel.getAllUsers();
    res.json(users);
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
    
    res.json(user);
  } catch (error) {
    next(error);
  }
};

// Create a new user
const createUser = async (req, res, next) => {
  try {
    const userData = req.body;
    const newUser = await UserModel.createUser(userData);
    res.status(201).json(newUser);
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
    
    res.json({ valid: true, user });
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