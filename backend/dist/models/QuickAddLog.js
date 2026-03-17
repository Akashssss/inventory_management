"use strict";
/**
 * QUICK ADD LOG
 * Logs quick-billing actions for small products (category, price tag, quantity)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuickAddLog = void 0;
const mongoose_1 = require("mongoose");
const quickAddSchema = new mongoose_1.Schema({
    tenantId: { type: String, index: true },
    sellerId: { type: String, default: null, index: true },
    category: { type: String, default: null, index: true },
    priceTag: { type: Number, default: null },
    quantity: { type: Number, required: true },
    items: { type: [{ productId: String, sku: String, name: String }], default: [] },
    resolved: { type: Boolean, default: false },
}, { timestamps: true, collection: "quick_add_logs" });
exports.QuickAddLog = (0, mongoose_1.model)("QuickAddLog", quickAddSchema);
//# sourceMappingURL=QuickAddLog.js.map