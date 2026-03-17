import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import { User } from "../models/User";

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/inventory";

async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
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
    await mongoose.connect(MONGODB_URI);
    console.log(`[CreateUser] ✓ Connected successfully`);

    const existing = await User.findOne({ email });
    if (existing) {
      console.error(`[CreateUser] Error: User ${email} already exists.`);
      process.exit(1);
    }

    const passwordHash = await hashPassword(password);
    await User.create({
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
  } catch (error) {
    console.error("[CreateUser] Error:", error);
    process.exit(1);
  }
}

create();
