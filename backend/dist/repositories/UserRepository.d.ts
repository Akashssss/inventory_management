import { IUser } from "@/models/User";
import { BaseRepository } from "@/repositories/BaseRepository";
export declare class UserRepository extends BaseRepository<IUser> {
    constructor();
    findByEmail(email: string): Promise<(import("mongoose").Document<unknown, {}, IUser, {}, import("mongoose").DefaultSchemaOptions> & IUser & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    }) | null>;
}
//# sourceMappingURL=UserRepository.d.ts.map