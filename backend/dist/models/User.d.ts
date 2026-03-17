import { Model, Types } from "mongoose";
import { BaseEntity } from "../types/query.types";
export type UserRole = "admin" | "seller";
export interface IUser extends BaseEntity {
    name: string;
    email: string;
    passwordHash: string;
    profileImage?: string;
    role: UserRole;
    isActive: boolean;
    tenantId?: string;
    createdAt?: Date;
    updatedAt?: Date;
    deletedAt?: Date | null;
}
export declare const User: Model<IUser, {}, {}, {}, import("mongoose").Document<unknown, {}, IUser, {}, import("mongoose").DefaultSchemaOptions> & IUser & {
    _id: Types.ObjectId;
} & {
    __v: number;
} & {
    id: string;
}, any, IUser>;
export type UserModel = Model<IUser>;
//# sourceMappingURL=User.d.ts.map