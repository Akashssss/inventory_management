/**
 * QUICK ADD LOG
 * Logs quick-billing actions for small products (category, price tag, quantity)
 */
import { Model } from "mongoose";
import { BaseEntity } from "../types/query.types";
export interface IQuickAddLog extends BaseEntity {
    tenantId?: string;
    sellerId?: string;
    category?: string;
    priceTag?: number;
    quantity: number;
    items?: {
        productId?: string;
        sku?: string;
        name?: string;
    }[];
    resolved: boolean;
    createdAt?: Date;
}
export declare const QuickAddLog: Model<IQuickAddLog, {}, {}, {}, import("mongoose").Document<unknown, {}, IQuickAddLog, {}, import("mongoose").DefaultSchemaOptions> & IQuickAddLog & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
} & {
    id: string;
}, any, IQuickAddLog>;
export type QuickAddLogModel = Model<IQuickAddLog>;
//# sourceMappingURL=QuickAddLog.d.ts.map