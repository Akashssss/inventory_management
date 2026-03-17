/**
 * STOCK TRANSACTION
 * Records stock changes (sale, purchase, adjustment, quick-add)
 */
import { Model } from "mongoose";
import { BaseEntity } from "../types/query.types";
export type StockChangeType = "sale" | "purchase" | "adjustment" | "quick_add" | "reconciliation";
export interface IStockTransaction extends BaseEntity {
    tenantId?: string;
    productId: string;
    sku?: string;
    changeType: StockChangeType;
    quantityChange: number;
    unit?: string;
    reason?: string;
    relatedOrderId?: string;
    createdAt?: Date;
}
export declare const StockTransaction: Model<IStockTransaction, {}, {}, {}, import("mongoose").Document<unknown, {}, IStockTransaction, {}, import("mongoose").DefaultSchemaOptions> & IStockTransaction & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
} & {
    id: string;
}, any, IStockTransaction>;
export type StockTransactionModel = Model<IStockTransaction>;
//# sourceMappingURL=StockTransaction.d.ts.map