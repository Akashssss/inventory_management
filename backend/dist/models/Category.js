"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Category = void 0;
const mongoose_1 = require("mongoose");
const categorySchema = new mongoose_1.Schema({
    name: { type: String, required: true, index: true },
    description: { type: String, default: null },
    isActive: { type: Boolean, default: true },
    tenantId: { type: String, default: "default", index: true },
    deletedAt: { type: Date, default: null, index: true },
}, { timestamps: true, collection: "categories" });
categorySchema.index({ tenantId: 1, name: 1 }, { unique: true });
exports.Category = (0, mongoose_1.model)("Category", categorySchema);
//# sourceMappingURL=Category.js.map