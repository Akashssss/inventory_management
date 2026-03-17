const express = require('express');
const router = express.Router();
const {
  getPendingAdjustments,
  resolveAdjustment,
} = require('../controllers/pendingAdjustmentController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/').get(protect, admin, getPendingAdjustments);
router.route('/:id/resolve').put(protect, admin, resolveAdjustment);

module.exports = router;
