const express = require('express');
const router = express.Router();
const {
  createOrder,
  getOrders,
  getAnalytics,
} = require('../controllers/orderController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/').post(protect, createOrder).get(protect, getOrders);
router.route('/analytics').get(protect, admin, getAnalytics);

module.exports = router;
