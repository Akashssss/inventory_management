const Settings = require('../models/Settings');

// @desc    Get settings
// @route   GET /api/settings
const getSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({});
    }
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update settings
// @route   PUT /api/settings
const updateSettings = async (req, res) => {
  try {
    const { quickModePrices, smallProductThreshold } = req.body;

    // Validate quick mode prices
    if (quickModePrices) {
      // Max 10 buttons
      if (quickModePrices.length > 10) {
        return res.status(400).json({ message: 'Maximum 10 quick mode price buttons allowed' });
      }

      // Validate prices are within threshold
      const threshold = smallProductThreshold || (await Settings.findOne())?.smallProductThreshold || 10;
      const invalidPrices = quickModePrices.filter(price => price > threshold);
      
      if (invalidPrices.length > 0) {
        return res.status(400).json({ 
          message: `Quick mode prices must be within threshold (${threshold}). Invalid prices: ${invalidPrices.join(', ')}` 
        });
      }

      // Ensure prices are positive
      if (quickModePrices.some(price => price <= 0)) {
        return res.status(400).json({ message: 'Quick mode prices must be positive numbers' });
      }
    }

    let settings = await Settings.findOne();
    if (settings) {
      if (req.body.smallProductThreshold !== undefined) {
        settings.smallProductThreshold = req.body.smallProductThreshold;
      }
      if (quickModePrices) {
        settings.quickModePrices = quickModePrices;
      }
      settings.shopName = req.body.shopName || settings.shopName;
      settings.currency = req.body.currency || settings.currency;
      
      const updatedSettings = await settings.save();
      res.json(updatedSettings);
    } else {
      const newSettings = await Settings.create(req.body);
      res.json(newSettings);
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getSettings,
  updateSettings,
};
