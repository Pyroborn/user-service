const fs = require('fs-extra');
const path = require('path');
const bcrypt = require('bcrypt');

const USER_DB_PATH = path.join(__dirname, '../data/users.json');

// Ensure the users JSON file exists
const ensureUserDb = async () => {
  if (!await fs.pathExists(USER_DB_PATH)) {
    await fs.writeJSON(USER_DB_PATH, { users: [] });
  }
};

// Read all users from JSON file
const getAllUsers = async () => {
  await ensureUserDb();
  const data = await fs.readJSON(USER_DB_PATH);
  return data.users;
};

// Get a single user by ID
const getUserById = async (userId) => {
  const users = await getAllUsers();
  return users.find(user => user.id === userId) || null;
};

// Create a new user
const createUser = async (userData) => {
  await ensureUserDb();
  const data = await fs.readJSON(USER_DB_PATH);
  
  // Generate a unique ID if not provided
  if (!userData.id) {
    userData.id = `user_${Date.now()}`;
  }
  
  // Validate required fields
  if (!userData.name) {
    throw new Error('User name is required');
  }
  
  // Validate email if provided
  if (userData.email) {
    // Check if email already exists
    if (data.users.some(user => user.email === userData.email)) {
      throw new Error(`User with email ${userData.email} already exists`);
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
  
  // Check if user already exists
  if (data.users.some(user => user.id === userData.id)) {
    throw new Error(`User with ID ${userData.id} already exists`);
  }
  
  // Add created timestamp
  userData.createdAt = new Date().toISOString();
  
  // Add the new user
  data.users.push(userData);
  
  // Write back to file
  await fs.writeJSON(USER_DB_PATH, data, { spaces: 2 });
  
  return userData;
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser
}; 