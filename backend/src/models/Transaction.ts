import { Schema, model, Model } from "mongoose";
import { BaseEntity } from "../types/query.types";

export interface ITransactionItem {
  productId?: Schema.Types.ObjectId | null;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  sellingPrice: number;
  total: number;
  isQuickAdd?: boolean; // True if added via small products fast mode
  resolvedQuantity?: number; // Tracks how much has been reconciled
}

export interface ITransaction extends BaseEntity {
  tenantId: string;
  sellerId: Schema.Types.ObjectId;
  sellerName: string;
  items: ITransactionItem[];
  subTotal: number;
  tax: number;
  total: number;
  paymentMethod: "cash" | "card" | "online";
  status: "completed" | "refunded";
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}

const transactionItemSchema = new Schema<ITransactionItem>({
  productId: { type: Schema.Types.ObjectId, ref: "Product", required: false, default: null },
  name: { type: String, required: true },
  category: { type: String, required: true },
  quantity: { type: Number, required: true },
  unit: { type: String, required: true },
  sellingPrice: { type: Number, required: true },
  total: { type: Number, required: true },
  isQuickAdd: { type: Boolean, default: false },
  resolvedQuantity: { type: Number, default: 0 },
});

const transactionSchema = new Schema<ITransaction>(
  {
    tenantId: { type: String, required: true, default: "default", index: true },
    sellerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    sellerName: { type: String, required: true },
    items: { type: [transactionItemSchema], required: true },
    subTotal: { type: Number, required: true },
    tax: { type: Number, default: 0 },
    total: { type: Number, required: true, index: true },
    paymentMethod: { type: String, enum: ["cash", "card", "online"], default: "cash" },
    status: { type: String, enum: ["completed", "refunded"], default: "completed" },
    deletedAt: { type: Date, default: null, index: true },
  },
  { timestamps: true, collection: "transactions" }
);

transactionSchema.index({ tenantId: 1, createdAt: -1 });

export const Transaction = model<ITransaction>("Transaction", transactionSchema);
export type TransactionModel = Model<ITransaction>;
