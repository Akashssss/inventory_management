import { Model } from "mongoose";
import { BaseEntity } from "../types/query.types";
export type ProductType = "measurable" | "non-measurable";
export type MeasurableUnit = "kg" | "g" | "l" | "ml" | "piece" | "pack" | "box";
export interface IProduct extends BaseEntity {
    tenantId: string;
    name: string;
    description?: string;
    categories: string[];
    type: ProductType;
    unit: MeasurableUnit;
    comesInBoxes: boolean;
    itemsPerBox?: number;
    boxCostPrice?: number;
    costPrice: number;
    sellingPrice: number;
    stock: number;
    isSmallProduct: boolean;
    lowStockThreshold: number;
    status: "active" | "inactive" | "discontinued";
    images: {
        url: string;
        alt?: string;
    }[];
    createdAt?: Date;
    updatedAt?: Date;
    deletedAt?: Date | null;
}
export declare const Product: Model<IProduct, {}, {}, {}, import("mongoose").Document<unknown, {}, IProduct, {}, import("mongoose").DefaultSchemaOptions> & IProduct & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
} & {
    id: string;
}, any, IProduct>;
export type ProductModel = Model<IProduct>;
//# sourceMappingURL=Product.d.ts.map