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
async function create() {
    const [email, password, role, name] = process.argv.slice(2);
    if (!email || !password || !role || !name) {
        console.error("Usage: npm run create:user -- <email> <password> <role> <name>");
        console.error("Example: npm run create:user -- admin2@example.com admin123 admin \"Admin Two\"");
        process.exit(1);
    }
    if (role !== "admin" && role !== "seller") {
        console.error("Error: Role must be either 'admin' or 'seller'");
        process.exit(1);
    }
    try {
        console.log(`[CreateUser] Connecting to ${MONGODB_URI}...`);
        await mongoose_1.default.connect(MONGODB_URI);
        console.log(`[CreateUser] ✓ Connected successfully`);
        const existing = await User_1.User.findOne({ email });
        if (existing) {
            console.error(`[CreateUser] Error: User ${email} already exists.`);
            process.exit(1);
        }
        const passwordHash = await hashPassword(password);
        await User_1.User.create({
            name,
            email,
            passwordHash,
            role,
            tenantId: "default",
            isActive: true,
        });
        console.log(`[CreateUser] ✓ Created ${role} user: ${email}`);
        console.log("[CreateUser] Done.");
        process.exit(0);
    }
    catch (error) {
        console.error("[CreateUser] Error:", error);
        process.exit(1);
    }
}
create();
//# sourceMappingURL=createUser.js.map