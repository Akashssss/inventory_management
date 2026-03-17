"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Setting = void 0;
const mongoose_1 = require("mongoose");
const settingSchema = new mongoose_1.Schema({
    tenantId: { type: String, required: true, unique: true, index: true },
    smallProductThreshold: { type: Number, default: 10, required: true },
    smallProductTags: {
        type: [Number],
        default: [],
        validate: {
            validator: function (tags) {
                // 1. Max 10 tags
                if (tags.length > 10)
                    return false;
                // 2. Unique
                const unique = new Set(tags);
                if (unique.size !== tags.length)
                    return false;
                // 3. <= threshold (if threshold is available on "this")
                // Note: In some contexts 'this' might be the parent doc
                const threshold = this.smallProductThreshold;
                if (threshold !== undefined) {
                    return tags.every(t => t <= threshold);
                }
                return true;
            },
            message: "Tags must be unique, max 10, and <= threshold."
        }
    },
    storeName: { type: String, default: "Confectionary Shop" },
    currency: { type: String, default: "₹" },
}, { timestamps: true, collection: "settings" });
exports.Setting = (0, mongoose_1.model)("Setting", settingSchema);
//# sourceMappingURL=Setting.js.map