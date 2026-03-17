"use strict";
/**
 * STOCK TRANSACTION
 * Records stock changes (sale, purchase, adjustment, quick-add)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.StockTransaction = void 0;
const mongoose_1 = require("mongoose");
const stockTransactionSchema = new mongoose_1.Schema({
    tenantId: { type: String, index: true },
    productId: { type: String, required: true, index: true },
    sku: { type: String, default: null },
    changeType: { type: String, required: true },
    quantityChange: { type: Number, required: true },
    unit: { type: String, default: "piece" },
    reason: { type: String, default: null },
    relatedOrderId: { type: String, default: null, index: true },
}, { timestamps: true, collection: "stock_transactions" });
exports.StockTransaction = (0, mongoose_1.model)("StockTransaction", stockTransactionSchema);
//# sourceMappingURL=StockTransaction.js.map