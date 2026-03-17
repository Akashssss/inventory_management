import { Model } from "mongoose";
import { BaseEntity } from "../types/query.types";
export interface ICategory extends BaseEntity {
    name: string;
    description?: string;
    isActive: boolean;
    tenantId?: string;
    createdAt?: Date;
    updatedAt?: Date;
    deletedAt?: Date | null;
}
export declare const Category: Model<ICategory, {}, {}, {}, import("mongoose").Document<unknown, {}, ICategory, {}, import("mongoose").DefaultSchemaOptions> & ICategory & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
} & {
    id: string;
}, any, ICategory>;
export type CategoryModel = Model<ICategory>;
//# sourceMappingURL=Category.d.ts.map