/**
 * ORDER MODEL
 * Records each sale (billing) with products, quantities, prices, seller and payments
 */
import { Model } from "mongoose";
import { BaseEntity } from "../types/query.types";
export interface OrderItem {
    productId: string;
    productName: string;
    sku?: string;
    unit?: string;
    quantity: number;
    unitPrice: number;
    costPrice?: number;
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
export declare const Order: Model<IOrder, {}, {}, {}, import("mongoose").Document<unknown, {}, IOrder, {}, import("mongoose").DefaultSchemaOptions> & IOrder & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
} & {
    id: string;
}, any, IOrder>;
export type OrderModel = Model<IOrder>;
//# sourceMappingURL=Order.d.ts.map