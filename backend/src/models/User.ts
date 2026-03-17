import { Schema, model, Model, Types } from "mongoose";
import { BaseEntity } from "../types/query.types";

export type UserRole = "admin" | "seller";

export interface IUser extends BaseEntity {
  name: string;
  email: string;
  passwordHash: string; // hashed password
  profileImage?: string;
  role: UserRole;
  isActive: boolean;
  tenantId?: string;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    passwordHash: { type: String, required: true },
    profileImage: { type: String, default: null },
    role: { type: String, enum: ["admin", "seller"], default: "seller" },
    isActive: { type: Boolean, default: true },
    tenantId: { type: String, default: "default", index: true },
    deletedAt: { type: Date, default: null, index: true },
  },
  { timestamps: true, collection: "users" }
);

userSchema.methods.isAdmin = function (this: IUser) {
  return this.role === "admin";
};

export const User = model<IUser>("User", userSchema);
export type UserModel = Model<IUser>;