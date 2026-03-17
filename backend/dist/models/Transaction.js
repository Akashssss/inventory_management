"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Transaction = void 0;
const mongoose_1 = require("mongoose");
const transactionItemSchema = new mongoose_1.Schema({
    productId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Product", required: false, default: null },
    name: { type: String, required: true },
    category: { type: String, required: true },
    quantity: { type: Number, required: true },
    unit: { type: String, required: true },
    sellingPrice: { type: Number, required: true },
    total: { type: Number, required: true },
    isQuickAdd: { type: Boolean, default: false },
    resolvedQuantity: { type: Number, default: 0 },
});
const transactionSchema = new mongoose_1.Schema({
    tenantId: { type: String, required: true, default: "default", index: true },
    sellerId: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    sellerName: { type: String, required: true },
    items: { type: [transactionItemSchema], required: true },
    subTotal: { type: Number, required: true },
    tax: { type: Number, default: 0 },
    total: { type: Number, required: true, index: true },
    paymentMethod: { type: String, enum: ["cash", "card", "online"], default: "cash" },
    status: { type: String, enum: ["completed", "refunded"], default: "completed" },
    deletedAt: { type: Date, default: null, index: true },
}, { timestamps: true, collection: "transactions" });
transactionSchema.index({ tenantId: 1, createdAt: -1 });
exports.Transaction = (0, mongoose_1.model)("Transaction", transactionSchema);
//# sourceMappingURL=Transaction.js.map