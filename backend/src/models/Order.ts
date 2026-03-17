/**
 * ORDER MODEL
 * Records each sale (billing) with products, quantities, prices, seller and payments
 */

import { Schema, model, Model } from "mongoose";
import { BaseEntity } from "../types/query.types";

export interface OrderItem {
  productId: string;
  productName: string;
  sku?: string;
  unit?: string; // piece, kg, g, liter, ml
  quantity: number;
  unitPrice: number; // selling price per unit
  costPrice?: number; // cost price per unit
  totalPrice: number;
}

export interface IOrder extends BaseEntity {
  orderNumber: string;
  tenantId?: string;
  sellerId?: string;
  items: OrderItem[];
  subtotal: number;
  taxes?: number;
  discounts?: number;
  total: number;
  paymentMethod?: string;
  status: "pending" | "completed" | "cancelled" | "refunded";
  createdAt?: Date;
  updatedAt?: Date;
}

const orderItemSchema = new Schema<OrderItem>({
  productId: { type: String, required: true },
  productName: { type: String, required: true },
  sku: { type: String, default: null },
  unit: { type: String, default: "piece" },
  quantity: { type: Number, required: true },
  unitPrice: { type: Number, required: true },
  costPrice: { type: Number, default: null },
  totalPrice: { type: Number, required: true },
});

const orderSchema = new Schema<IOrder>(
  {
    orderNumber: { type: String, required: true, index: true },
    tenantId: { type: String, index: true },
    sellerId: { type: String, index: true },
    items: { type: [orderItemSchema], required: true },
    subtotal: { type: Number, required: true },
    taxes: { type: Number, default: 0 },
    discounts: { type: Number, default: 0 },
    total: { type: Number, required: true },
    paymentMethod: { type: String, default: "cash" },
    status: { type: String, enum: ["pending", "completed", "cancelled", "refunded"], default: "completed" },
  },
  { timestamps: true, collection: "orders" }
);

// index for faster queries by tenant and date
orderSchema.index({ tenantId: 1, createdAt: -1 });

export const Order = model<IOrder>("Order", orderSchema);
export type OrderModel = Model<IOrder>;