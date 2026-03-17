const mongoose = require('mongoose');

const orderSchema = mongoose.Schema(
  {
    seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        name: { type: String, required: true },
        quantity: { type: Number, required: true },
        price: { type: Number, required: true }, // Selling price at the time of order
        costPrice: { type: Number, required: true }, // Cost price at the time of order for profit calculation
        unitType: { type: String, required: true },
        isSmallProduct: { type: Boolean, default: false },
        isQuickAdd: { type: Boolean, default: false },
        category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
      },
    ],
    totalAmount: { type: Number, required: true },
    totalCost: { type: Number, required: true },
    profit: { type: Number, required: true },
    paymentMethod: { type: String, default: 'Cash' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Order', orderSchema);
