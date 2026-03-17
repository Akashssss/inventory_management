"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SettingRepository = exports.settingFieldSchema = void 0;
exports.getSettingRepository = getSettingRepository;
const BaseRepository_1 = require("./BaseRepository");
const Setting_1 = require("../models/Setting");
exports.settingFieldSchema = [
    { name: "tenantId", type: "string", filterable: true, selectable: true },
    { name: "smallProductThreshold", type: "number", filterable: true, sortable: true, selectable: true },
    { name: "smallProductTags", type: "array", selectable: true },
];
class SettingRepository extends BaseRepository_1.BaseRepository {
    constructor(queryEngine) {
        super(Setting_1.Setting, queryEngine);
        this.queryEngine.registerFieldSchema("settings", exports.settingFieldSchema);
    }
    async getTenantSetting(tenantId) {
        const result = await this.find({
            filter: { field: "tenantId", operator: "eq", value: tenantId },
            pagination: { limit: 1, page: 1 }
        });
        return result.data[0] || null;
    }
}
exports.SettingRepository = SettingRepository;
function getSettingRepository(queryEngine) {
    return new SettingRepository(queryEngine);
}
//# sourceMappingURL=SettingRepository.js.map