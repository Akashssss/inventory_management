"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
const mongoose_1 = require("mongoose");
const userSchema = new mongoose_1.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    passwordHash: { type: String, required: true },
    profileImage: { type: String, default: null },
    role: { type: String, enum: ["admin", "seller"], default: "seller" },
    isActive: { type: Boolean, default: true },
    tenantId: { type: String, default: "default", index: true },
    deletedAt: { type: Date, default: null, index: true },
}, { timestamps: true, collection: "users" });
userSchema.methods.isAdmin = function () {
    return this.role === "admin";
};
exports.User = (0, mongoose_1.model)("User", userSchema);
//# sourceMappingURL=User.js.map