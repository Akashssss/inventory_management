import { Schema, model, Model } from "mongoose";
import { BaseEntity } from "../types/query.types";

export interface ICategory extends BaseEntity {
  name: string;
  description?: string;
  isActive: boolean;
  tenantId?: string;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}

const categorySchema = new Schema<ICategory>(
  {
    name: { type: String, required: true, index: true },
    description: { type: String, default: null },
    isActive: { type: Boolean, default: true },
    tenantId: { type: String, default: "default", index: true },
    deletedAt: { type: Date, default: null, index: true },
  },
  { timestamps: true, collection: "categories" }
);

categorySchema.index({ tenantId: 1, name: 1 }, { unique: true });

export const Category = model<ICategory>("Category", categorySchema);
export type CategoryModel = Model<ICategory>;
