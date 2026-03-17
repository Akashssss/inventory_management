"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CategoryController = void 0;
exports.createCategoryController = createCategoryController;
class CategoryController {
    constructor(repository) {
        this.repository = repository;
    }
    async getCategories(req, res, next) {
        try {
            const { page, limit, search, fields } = req.query;
            const { filter, sort } = req.body || {};
            const options = {
                filter,
                search: search,
                searchFields: ["name", "description"],
                sort: typeof sort === "string" ? JSON.parse(sort) : sort,
                pagination: {
                    page: page ? Number(page) : 1,
                    limit: limit ? Number(limit) : 20,
                    maxLimit: 1000,
                },
                fields: typeof fields === "string" ? JSON.parse(fields) : fields,
                tenantId: req.context?.tenantId || "default",
                includeSoftDeleted: req.context?.includeSoftDeleted || false,
            };
            const result = await this.repository.find(options);
            res.status(200).json({
                success: true,
                data: result.data,
                pagination: result.pagination,
                meta: result.meta,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async createCategory(req, res, next) {
        try {
            const { name } = req.body;
            if (!name) {
                res.status(400).json({ success: false, error: { message: "Name is required" } });
                return;
            }
            const category = await this.repository.create({
                ...req.body,
                tenantId: req.context?.tenantId || "default",
            });
            res.status(201).json({ success: true, data: category });
        }
        catch (error) {
            next(error);
        }
    }
    async updateCategory(req, res, next) {
        try {
            const id = req.params.id;
            const category = await this.repository.update(id, req.body);
            res.status(200).json({ success: true, data: category });
        }
        catch (error) {
            next(error);
        }
    }
    async deleteCategory(req, res, next) {
        try {
            const id = req.params.id;
            await this.repository.softDelete(id);
            res.status(200).json({ success: true, message: "Category deleted" });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.CategoryController = CategoryController;
function createCategoryController(repository) {
    return new CategoryController(repository);
}
//# sourceMappingURL=CategoryController.js.map