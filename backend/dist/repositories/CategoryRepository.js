"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CategoryRepository = exports.categoryFieldSchema = void 0;
exports.getCategoryRepository = getCategoryRepository;
const BaseRepository_1 = require("./BaseRepository");
const Category_1 = require("../models/Category");
exports.categoryFieldSchema = [
    { name: "name", type: "string", filterable: true, searchable: true, sortable: true, selectable: true },
    { name: "description", type: "string", filterable: true, searchable: true, sortable: true, selectable: true },
    { name: "isActive", type: "boolean", filterable: true, sortable: true, selectable: true },
    { name: "tenantId", type: "string", filterable: true, selectable: true },
    { name: "createdAt", type: "date", filterable: true, sortable: true, selectable: true },
];
class CategoryRepository extends BaseRepository_1.BaseRepository {
    constructor(queryEngine) {
        super(Category_1.Category, queryEngine);
        this.queryEngine.registerFieldSchema("categories", exports.categoryFieldSchema);
    }
}
exports.CategoryRepository = CategoryRepository;
function getCategoryRepository(queryEngine) {
    return new CategoryRepository(queryEngine);
}
//# sourceMappingURL=CategoryRepository.js.map