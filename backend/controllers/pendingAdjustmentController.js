const PendingAdjustment = require('../models/PendingAdjustment');

// @desc    Get all pending adjustments
// @route   GET /api/pending-adjustments
const getPendingAdjustments = async (req, res) => {
  try {
    const adjustments = await PendingAdjustment.find({ status: 'pending' })
      .populate('order')
      .populate('category')
      .populate('seller', 'name email');
    res.json(adjustments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Resolve a pending adjustment
// @route   PUT /api/pending-adjustments/:id/resolve
const resolveAdjustment = async (req, res) => {
  try {
    const adjustment = await PendingAdjustment.findById(req.params.id);
    if (adjustment) {
      adjustment.status = 'resolved';
      adjustment.resolvedBy = req.user._id;
      adjustment.resolvedAt = Date.now();
      await adjustment.save();
      res.json({ message: 'Adjustment resolved' });
    } else {
      res.status(404).json({ message: 'Adjustment not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getPendingAdjustments,
  resolveAdjustment,
};
