"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Product = void 0;
const mongoose_1 = require("mongoose");
const productSchema = new mongoose_1.Schema({
    tenantId: { type: String, required: true, index: true, default: "default" },
    name: { type: String, required: true, index: true },
    description: { type: String, default: null },
    categories: { type: [String], default: [], index: true },
    type: { type: String, enum: ["measurable", "non-measurable"], required: true },
    unit: { type: String, enum: ["kg", "g", "l", "ml", "piece", "pack", "box"], default: "piece" },
    comesInBoxes: { type: Boolean, default: false },
    itemsPerBox: { type: Number, default: null },
    boxCostPrice: { type: Number, default: null },
    costPrice: { type: Number, required: true, index: true },
    sellingPrice: { type: Number, required: true, index: true },
    stock: { type: Number, required: true, default: 0, index: true },
    isSmallProduct: { type: Boolean, default: false, index: true },
    lowStockThreshold: { type: Number, required: true, default: 10 },
    status: {
        type: String,
        enum: ["active", "inactive", "discontinued"],
        default: "active",
        index: true,
    },
    images: {
        type: [
            {
                url: { type: String, required: true },
                alt: { type: String, default: "" },
            }
        ],
        validate: [
            {
                validator: (v) => Array.isArray(v) && v.length > 0,
                message: "At least one image is mandatory for the product"
            }
        ]
    },
    deletedAt: { type: Date, default: null, index: true },
}, { timestamps: true, collection: "products" });
// Pre-save hook to calculate cost price if it comes in boxes
productSchema.pre("save", async function () {
    // Box logic for non-measurable
    if (this.type === "non-measurable" && this.comesInBoxes && this.boxCostPrice && this.itemsPerBox) {
        this.costPrice = this.boxCostPrice / this.itemsPerBox;
    }
});
productSchema.index({ tenantId: 1, name: 1 });
productSchema.index({ tenantId: 1, categories: 1 });
productSchema.index({ tenantId: 1, isSmallProduct: 1 });
exports.Product = (0, mongoose_1.model)("Product", productSchema);
//# sourceMappingURL=Product.js.map