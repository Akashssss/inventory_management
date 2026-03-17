"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const User_1 = require("../models/User");
dotenv_1.default.config();
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/inventory";
async function hashPassword(password) {
    const salt = await bcryptjs_1.default.genSalt(10);
    return bcryptjs_1.default.hash(password, salt);
}
async function seed() {
    try {
        console.log(`[Seed] Connecting to ${MONGODB_URI}...`);
        await mongoose_1.default.connect(MONGODB_URI);
        console.log(`[Seed] ✓ Connected successfully`);
        const users = [
            {
                name: "Admin User",
                email: "admin@example.com",
                password: "admin123",
                role: "admin",
            },
            {
                name: "Seller User",
                email: "seller@example.com",
                password: "seller123",
                role: "seller",
            },
        ];
        for (const u of users) {
            const existing = await User_1.User.findOne({ email: u.email });
            if (existing) {
                console.log(`[Seed] User ${u.email} already exists. Skipping.`);
                continue;
            }
            const passwordHash = await hashPassword(u.password);
            await User_1.User.create({
                name: u.name,
                email: u.email,
                passwordHash,
                role: u.role,
                tenantId: "default",
                isActive: true,
            });
            console.log(`[Seed] ✓ Created ${u.role} user: ${u.email}`);
        }
        console.log("[Seed] Seeding completed.");
        process.exit(0);
    }
    catch (error) {
        console.error("[Seed] Error seeding users:", error);
        process.exit(1);
    }
}
seed();
//# sourceMappingURL=seedUsers.js.map