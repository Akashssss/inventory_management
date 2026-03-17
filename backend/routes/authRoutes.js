const express = require('express');
const router = express.Router();
const { authUser, registerUser } = require('../controllers/userController');

// @route   POST /api/auth/login
// @desc    Login user and get token
router.post('/login', authUser);

// @route   POST /api/auth/register
// @desc    Register a new user
router.post('/register', registerUser);

module.exports = router;
