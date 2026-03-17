const mongoose = require('mongoose');

const categorySchema = mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    description: { type: String },
    hasSmallProducts: { type: Boolean, default: false }, // Optimized flag for quick filtering
    smallProductCount: { type: Number, default: 0 }, // Track count for efficiency
    smallProductThreshold: { 
      type: Number, 
      default: 0,
      min: 0,
      description: 'Price threshold for small products. Products below this price are considered small.'
    },
    smallProductPriceTags: {
      type: [
        {
          price: { 
            type: Number, 
            required: true,
            min: 0
          },
          _id: false
        }
      ],
      default: [],
      validate: {
        validator: function(tags) {
          // Max 10 price tags
          if (tags.length > 10) return false;
          
          // All prices must be unique
          const prices = tags.map(t => t.price);
          return prices.length === new Set(prices).size;
        },
        message: 'Cannot have more than 10 price tags or duplicate prices'
      }
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Category', categorySchema);
