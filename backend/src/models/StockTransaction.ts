/**
 * STOCK TRANSACTION
 * Records stock changes (sale, purchase, adjustment, quick-add)
 */

import { Schema, model, Model } from "mongoose";
import { BaseEntity } from "../types/query.types";

export type StockChangeType = "sale" | "purchase" | "adjustment" | "quick_add" | "reconciliation";

export interface IStockTransaction extends BaseEntity {
  tenantId?: string;
  productId: string;
  sku?: string;
  changeType: StockChangeType;
  quantityChange: number; // positive for addition, negative for removal
  unit?: string;
  reason?: string;
  relatedOrderId?: string;
  createdAt?: Date;
}

const stockTransactionSchema = new Schema<IStockTransaction>(
  {
    tenantId: { type: String, index: true },
    productId: { type: String, required: true, index: true },
    sku: { type: String, default: null },
    changeType: { type: String, required: true },
    quantityChange: { type: Number, required: true },
    unit: { type: String, default: "piece" },
    reason: { type: String, default: null },
    relatedOrderId: { type: String, default: null, index: true },
  },
  { timestamps: true, collection: "stock_transactions" }
);

export const StockTransaction = model<IStockTransaction>("StockTransaction", stockTransactionSchema);
export type StockTransactionModel = Model<IStockTransaction>;