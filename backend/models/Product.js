const mongoose = require('mongoose');

const productSchema = mongoose.Schema(
  {
    name: { type: String, required: true },
    image: { type: String }, // URL or Base64
    categories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }],
    
    // Pricing
    costPrice: { type: Number, required: true },
    sellingPrice: { type: Number, required: true },
    
    // Type and Stock
    unitType: { 
      type: String, 
      enum: ['piece', 'box', 'kg', 'g', 'liter', 'ml'], 
      default: 'piece' 
    },
    isMeasurable: { type: Boolean, default: false },
    
    // Stock Management
    stock: { type: Number, default: 0 }, // Total available quantity in the base unit (pieces or kg/liter)
    lowStockAlert: { type: Number, default: 5 }, // Threshold for low stock alert
    
    // Box details (optional)
    isBoxBased: { type: Boolean, default: false },
    piecesPerBox: { type: Number },
    boxCount: { type: Number },

    // Small Product Logic
    isSmallProduct: { type: Boolean, default: false },
    forceSmallProduct: { type: Boolean, default: false }, // If admin manually sets it

    description: { type: String },
    isActive: { type: Boolean, default: true },
    salesCount: { type: Number, default: 0 },
    lastSoldAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Product', productSchema);
