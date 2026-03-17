/**
 * QUICK ADD LOG
 * Logs quick-billing actions for small products (category, price tag, quantity)
 */

import { Schema, model, Model } from "mongoose";
import { BaseEntity } from "../types/query.types";

export interface IQuickAddLog extends BaseEntity {
  tenantId?: string;
  sellerId?: string;
  category?: string;
  priceTag?: number; // e.g., 1,2,3 rupee quick tags
  quantity: number;
  items?: { productId?: string; sku?: string; name?: string }[];
  resolved: boolean; // reconciliation complete
  createdAt?: Date;
}

const quickAddSchema = new Schema<IQuickAddLog>(
  {
    tenantId: { type: String, index: true },
    sellerId: { type: String, default: null, index: true },
    category: { type: String, default: null, index: true },
    priceTag: { type: Number, default: null },
    quantity: { type: Number, required: true },
    items: { type: [{ productId: String, sku: String, name: String }], default: [] },
    resolved: { type: Boolean, default: false },
  },
  { timestamps: true, collection: "quick_add_logs" }
);

export const QuickAddLog = model<IQuickAddLog>("QuickAddLog", quickAddSchema);
export type QuickAddLogModel = Model<IQuickAddLog>;