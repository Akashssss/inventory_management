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

async function seed() {
  try {
    console.log(`[Seed] Connecting to ${MONGODB_URI}...`);
    await mongoose.connect(MONGODB_URI);
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
      const existing = await User.findOne({ email: u.email });
      if (existing) {
        console.log(`[Seed] User ${u.email} already exists. Skipping.`);
        continue;
      }

      const passwordHash = await hashPassword(u.password);
      await User.create({
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
  } catch (error) {
    console.error("[Seed] Error seeding users:", error);
    process.exit(1);
  }
}

seed();
