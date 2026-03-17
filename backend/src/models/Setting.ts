import { Schema, model, Model } from "mongoose";
import { BaseEntity } from "../types/query.types";

export interface ISetting extends BaseEntity {
  tenantId: string;
  smallProductThreshold: number; // E.g., 10 rupees limit for small product
  smallProductTags: number[]; // e.g., [1, 2, 5] (Must be <= threshold)
  storeName: string;
  currency: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const settingSchema = new Schema<ISetting>(
  {
    tenantId: { type: String, required: true, unique: true, index: true },
    smallProductThreshold: { type: Number, default: 10, required: true },
    smallProductTags: { 
      type: [Number], 
      default: [],
      validate: {
        validator: function(tags: number[]) {
          // 1. Max 10 tags
          if (tags.length > 10) return false;
          // 2. Unique
          const unique = new Set(tags);
          if (unique.size !== tags.length) return false;
          // 3. <= threshold (if threshold is available on "this")
          // Note: In some contexts 'this' might be the parent doc
          const threshold = (this as any).smallProductThreshold;
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
  },
  { timestamps: true, collection: "settings" }
);

export const Setting = model<ISetting>("Setting", settingSchema);
export type SettingModel = Model<ISetting>;
