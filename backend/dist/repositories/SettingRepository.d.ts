import { BaseRepository } from "./BaseRepository";
import { ISetting } from "../models/Setting";
import { MongoQueryEngine } from "../core";
import { FieldMetadata } from "../types/query.types";
export declare const settingFieldSchema: FieldMetadata[];
export declare class SettingRepository extends BaseRepository<ISetting> {
    constructor(queryEngine?: MongoQueryEngine);
    getTenantSetting(tenantId: string): Promise<ISetting | null>;
}
export declare function getSettingRepository(queryEngine?: MongoQueryEngine): SettingRepository;
//# sourceMappingURL=SettingRepository.d.ts.map