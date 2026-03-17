const mongoose = require('mongoose');

const settingsSchema = mongoose.Schema(
  {
    smallProductThreshold: { type: Number, default: 10 }, // Price below which a product is considered "small"
    quickModePrices: { type: [Number], default: [1, 2, 5, 10, 20] }, // Customizable quick price buttons
    shopName: { type: String, default: 'My Shop' },
    currency: { type: String, default: 'INR' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Settings', settingsSchema);
