const express = require('express');
const router = express.Router();
const {
  authUser,
  registerUser,
  getUsers,
  updateUserProfile,
} = require('../controllers/userController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/').post(registerUser).get(protect, admin, getUsers);
router.post('/login', authUser);
router.route('/profile').put(protect, updateUserProfile);

module.exports = router;
