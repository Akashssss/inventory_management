import { Model } from "mongoose";
import { BaseEntity } from "../types/query.types";
export interface ISetting extends BaseEntity {
    tenantId: string;
    smallProductThreshold: number;
    smallProductTags: number[];
    storeName: string;
    currency: string;
    createdAt?: Date;
    updatedAt?: Date;
}
export declare const Setting: Model<ISetting, {}, {}, {}, import("mongoose").Document<unknown, {}, ISetting, {}, import("mongoose").DefaultSchemaOptions> & ISetting & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
} & {
    id: string;
}, any, ISetting>;
export type SettingModel = Model<ISetting>;
//# sourceMappingURL=Setting.d.ts.map