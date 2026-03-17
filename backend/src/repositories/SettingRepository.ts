import { BaseRepository } from "./BaseRepository";
import { Setting, ISetting } from "../models/Setting";
import { MongoQueryEngine } from "../core";
import { FieldMetadata } from "../types/query.types";

export const settingFieldSchema: FieldMetadata[] = [
  { name: "tenantId", type: "string", filterable: true, selectable: true },
  { name: "smallProductThreshold", type: "number", filterable: true, sortable: true, selectable: true },
  { name: "smallProductTags", type: "array", selectable: true },
];

export class SettingRepository extends BaseRepository<ISetting> {
  constructor(queryEngine?: MongoQueryEngine) {
    super(Setting, queryEngine);
    this.queryEngine.registerFieldSchema("settings", settingFieldSchema);
  }

  async getTenantSetting(tenantId: string): Promise<ISetting | null> {
    const result = await this.find({
      filter: { field: "tenantId", operator: "eq", value: tenantId },
      pagination: { limit: 1, page: 1 }
    });
    return result.data[0] || null;
  }
}

export function getSettingRepository(queryEngine?: MongoQueryEngine): SettingRepository {
  return new SettingRepository(queryEngine);
}
