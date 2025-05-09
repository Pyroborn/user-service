const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// GET /users - Get all users
router.get('/', userController.getUsers);

// GET /users/validate - Validate user from X-User-Id header
router.get('/validate/user', userController.validateUser);

// GET /users/:id - Get a user by ID
router.get('/:id', userController.getUserById);

// POST /users - Create a new user
router.post('/', userController.createUser);

module.exports = router; 