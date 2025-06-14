const fs = require('fs-extra');
const path = require('path');
const bcrypt = require('bcrypt');

const USER_DB_PATH = path.join(__dirname, '../data/users.json');

// Create users file if it doesn't exist
const ensureUserDb = async () => {
  if (!await fs.pathExists(USER_DB_PATH)) {
    await fs.writeJSON(USER_DB_PATH, { users: [] });
  }
};

// Get all users
const getAllUsers = async () => {
  await ensureUserDb();
  const data = await fs.readJSON(USER_DB_PATH);
  return data.users;
};

// Get user by ID
const getUserById = async (userId) => {
  const users = await getAllUsers();
  return users.find(user => user.id === userId) || null;
};

// Create new user
const createUser = async (userData) => {
  await ensureUserDb();
  const data = await fs.readJSON(USER_DB_PATH);
  
  // Generate ID if not provided
  if (!userData.id) {
    userData.id = `user_${Date.now()}`;
  }
  
  // Validate required fields
  if (!userData.name) {
    throw new Error('User name is required');
  }
  
  // Validate email
  if (userData.email) {
    // Check for duplicate email
    if (data.users.some(user => user.email === userData.email)) {
      throw new Error(`User with email ${userData.email} already exists`);
    }
  }
  
  // Hash password if provided
  if (userData.password) {
    const salt = await bcrypt.genSalt(10);
    userData.password = await bcrypt.hash(userData.password, salt);
  }
  
  // Set default role
  if (!userData.role) {
    userData.role = 'user';
  }
  
  // Check for duplicate ID
  if (data.users.some(user => user.id === userData.id)) {
    throw new Error(`User with ID ${userData.id} already exists`);
  }
  
  // Add timestamp
  userData.createdAt = new Date().toISOString();
  
  // Save user
  data.users.push(userData);
  
  // Write to file
  await fs.writeJSON(USER_DB_PATH, data, { spaces: 2 });
  
  return userData;
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser
}; 