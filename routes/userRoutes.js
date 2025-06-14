const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// Get all users
router.get('/', userController.getUsers);

// Validate user
router.get('/validate/user', userController.validateUser);

// Get user by ID
router.get('/:id', userController.getUserById);

// Create user
router.post('/', userController.createUser);

module.exports = router; 