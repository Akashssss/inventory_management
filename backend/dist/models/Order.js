"use strict";
/**
 * ORDER MODEL
 * Records each sale (billing) with products, quantities, prices, seller and payments
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Order = void 0;
const mongoose_1 = require("mongoose");
const orderItemSchema = new mongoose_1.Schema({
    productId: { type: String, required: true },
    productName: { type: String, required: true },
    sku: { type: String, default: null },
    unit: { type: String, default: "piece" },
    quantity: { type: Number, required: true },
    unitPrice: { type: Number, required: true },
    costPrice: { type: Number, default: null },
    totalPrice: { type: Number, required: true },
});
const orderSchema = new mongoose_1.Schema({
    orderNumber: { type: String, required: true, index: true },
    tenantId: { type: String, index: true },
    sellerId: { type: String, index: true },
    items: { type: [orderItemSchema], required: true },
    subtotal: { type: Number, required: true },
    taxes: { type: Number, default: 0 },
    discounts: { type: Number, default: 0 },
    total: { type: Number, required: true },
    paymentMethod: { type: String, default: "cash" },
    status: { type: String, enum: ["pending", "completed", "cancelled", "refunded"], default: "completed" },
}, { timestamps: true, collection: "orders" });
// index for faster queries by tenant and date
orderSchema.index({ tenantId: 1, createdAt: -1 });
exports.Order = (0, mongoose_1.model)("Order", orderSchema);
//# sourceMappingURL=Order.js.map