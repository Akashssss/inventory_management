import { Schema, Model } from "mongoose";
import { BaseEntity } from "../types/query.types";
export interface ITransactionItem {
    productId?: Schema.Types.ObjectId | null;
    name: string;
    category: string;
    quantity: number;
    unit: string;
    sellingPrice: number;
    total: number;
    isQuickAdd?: boolean;
    resolvedQuantity?: number;
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
export declare const Transaction: Model<ITransaction, {}, {}, {}, import("mongoose").Document<unknown, {}, ITransaction, {}, import("mongoose").DefaultSchemaOptions> & ITransaction & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
} & {
    id: string;
}, any, ITransaction>;
export type TransactionModel = Model<ITransaction>;
//# sourceMappingURL=Transaction.d.ts.map