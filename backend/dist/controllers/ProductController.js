"use strict";
/**
 * PRODUCT CONTROLLER
 * Thin controller using repository pattern
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductController = void 0;
exports.createProductController = createProductController;
const Setting_1 = require("@/models/Setting");
/**
 * Product Controller
 * Handles HTTP requests and delegates to repository
 */
class ProductController {
    constructor(repository) {
        this.repository = repository;
    }
    /**
     * GET /products
     * Advanced search with filtering, sorting, pagination
     *
     * Query parameters:
     * - page: number (default: 1)
     * - limit: number (default: 20)
     * - search: string (full-text search)
     * - sort: JSON array of { field, order }
     * - fields: JSON array of field names to select
     *
     * Request body (filter):
     * {
     *   "filter": {
     *     "logic": "and",
     *     "conditions": [...]
     *   }
     * }
     */
    async getProducts(req, res, next) {
        try {
            const { page, limit, search, fields } = req.query;
            const { filter, sort } = req.body || {};
            // Build query options
            const options = {
                filter,
                search: search,
                searchFields: ["name", "sku", "description", "category"],
                sort: typeof sort === "string"
                    ? JSON.parse(sort)
                    : sort,
                pagination: {
                    page: page ? Number(page) : 1,
                    limit: limit ? Number(limit) : 20,
                    maxLimit: 1000,
                },
                fields: typeof fields === "string"
                    ? JSON.parse(fields)
                    : fields,
                tenantId: req.context?.tenantId,
                includeSoftDeleted: req.context?.includeSoftDeleted || false,
            };
            // Execute query
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
    /**
     * GET /products/:id
     * Get product by ID
     */
    async getProductById(req, res, next) {
        try {
            const { id } = req.params;
            const product = await this.repository.findById(id);
            if (!product) {
                res.status(404).json({
                    success: false,
                    error: {
                        code: "NOT_FOUND",
                        message: `Product with ID "${id}" not found`,
                    },
                });
                return;
            }
            res.status(200).json({
                success: true,
                data: product,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * POST /products
     * Create new product
     */
    async getSmallProductCategories(req, res, next) {
        try {
            const tenantId = req.context?.tenantId;
            const categories = await this.repository.getSmallProductCategories(tenantId);
            res.status(200).json({ success: true, data: categories });
        }
        catch (error) {
            next(error);
        }
    }
    async getSmallProductPrices(req, res, next) {
        try {
            const { category } = req.query;
            if (!category) {
                res.status(400).json({ success: false, error: { message: "Category is required" } });
                return;
            }
            const tenantId = req.context?.tenantId;
            const prices = await this.repository.getSmallProductPrices(category, tenantId);
            res.status(200).json({ success: true, data: prices });
        }
        catch (error) {
            next(error);
        }
    }
    async createProduct(req, res, next) {
        try {
            const { name, categories, costPrice, sellingPrice, type } = req.body;
            // Validate required fields
            if (!name || !categories || costPrice === undefined || sellingPrice === undefined || !type) {
                res.status(400).json({
                    success: false,
                    error: {
                        code: "VALIDATION_ERROR",
                        message: "Missing required fields: name, categories, costPrice, sellingPrice, type",
                    },
                });
                return;
            }
            // Prepare data for the model
            const productData = {
                ...req.body,
                categories: Array.isArray(categories) ? categories : [categories],
                images: req.body.image ? [{ url: req.body.image }] : (req.file ? [{ url: `/uploads/${req.file.filename}` }] : [])
            };
            // Ensure numeric fields are correctly typed (FormData sends everything as strings)
            productData.costPrice = Number(productData.costPrice || 0);
            productData.sellingPrice = Number(productData.sellingPrice || 0);
            productData.stock = Number(productData.stock || 0);
            productData.lowStockThreshold = Number(productData.lowStockThreshold || 10);
            if (productData.itemsPerBox)
                productData.itemsPerBox = Number(productData.itemsPerBox);
            if (productData.boxCostPrice)
                productData.boxCostPrice = Number(productData.boxCostPrice);
            // Handle boolean strings from FormData
            if (typeof productData.comesInBoxes === 'string')
                productData.comesInBoxes = productData.comesInBoxes === 'true';
            if (typeof productData.isSmallProduct === 'string')
                productData.isSmallProduct = productData.isSmallProduct === 'true';
            // Logic for Box Purchase stock calculation
            const numBoxes = Number(req.body.numBoxes || 0);
            if (productData.type === "non-measurable" && productData.comesInBoxes && numBoxes > 0 && productData.itemsPerBox > 0) {
                productData.stock = numBoxes * productData.itemsPerBox;
            }
            // Small Product Detection
            if (productData.type === "non-measurable") {
                const tenantId = req.context?.tenantId || "default";
                const setting = await Setting_1.Setting.findOne({ tenantId }).exec();
                const threshold = setting?.smallProductThreshold || 10;
                productData.isSmallProduct = productData.sellingPrice <= threshold;
            }
            else {
                productData.isSmallProduct = false;
            }
            const product = await this.repository.create(productData);
            res.status(201).json({
                success: true,
                data: product,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * PUT /products/:id
     * Update product
     */
    async updateProduct(req, res, next) {
        try {
            const { id } = req.params;
            const updateData = { ...req.body };
            // Support multi-category from both formats
            if (updateData.categoryId) {
                updateData.categories = [updateData.categoryId];
            }
            if (updateData.categories && !Array.isArray(updateData.categories)) {
                updateData.categories = [updateData.categories];
            }
            // Map image path to images array
            if (updateData.image) {
                updateData.images = [{ url: updateData.image }];
            }
            else if (req.file) {
                updateData.images = [{ url: `/uploads/${req.file.filename}` }];
            }
            // Ensure numeric fields are correctly typed
            if (updateData.costPrice !== undefined)
                updateData.costPrice = Number(updateData.costPrice);
            if (updateData.sellingPrice !== undefined)
                updateData.sellingPrice = Number(updateData.sellingPrice);
            if (updateData.stock !== undefined)
                updateData.stock = Number(updateData.stock);
            if (updateData.itemsPerBox !== undefined)
                updateData.itemsPerBox = Number(updateData.itemsPerBox);
            if (updateData.boxCostPrice !== undefined)
                updateData.boxCostPrice = Number(updateData.boxCostPrice);
            if (updateData.lowStockThreshold !== undefined)
                updateData.lowStockThreshold = Number(updateData.lowStockThreshold);
            // Handle boolean strings from FormData
            if (typeof updateData.comesInBoxes === 'string')
                updateData.comesInBoxes = updateData.comesInBoxes === 'true';
            if (typeof updateData.isSmallProduct === 'string')
                updateData.isSmallProduct = updateData.isSmallProduct === 'true';
            // Re-evaluate small product status on price update
            if (updateData.sellingPrice !== undefined) {
                const tenantId = req.context?.tenantId || "default";
                const setting = await Setting_1.Setting.findOne({ tenantId }).exec();
                const threshold = setting?.smallProductThreshold || 10;
                // Only non-measurable can be small products
                const currentProd = await this.repository.findById(id);
                if (currentProd?.type === "non-measurable") {
                    updateData.isSmallProduct = updateData.sellingPrice <= threshold;
                }
            }
            const product = await this.repository.update(id, updateData);
            res.status(200).json({
                success: true,
                data: product,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * DELETE /products/:id
     * Soft delete product
     */
    async deleteProduct(req, res, next) {
        try {
            const { id } = req.params;
            await this.repository.softDelete(id);
            res.status(200).json({
                success: true,
                message: "Product deleted",
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * POST /products/:id/restore
     * Restore soft-deleted product
     */
    async restoreProduct(req, res, next) {
        try {
            const { id } = req.params;
            await this.repository.restore(id);
            res.status(200).json({
                success: true,
                message: "Product restored",
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * GET /products/search
     * Simple search endpoint
     */
    async searchProducts(req, res, next) {
        try {
            const { q, search, page, limit } = req.query;
            const body = req.body || {};
            // Handle empty search by returning all products or performing an empty search
            const query = (q || search || body.q || body.search || "");
            // Build options including body filter/sort if present
            const options = {
                pagination: {
                    page: page ? Number(page) : 1,
                    limit: limit ? Number(limit) : 20,
                },
                tenantId: req.context?.tenantId,
                filter: body.filter,
                sort: body.sort,
            };
            // Normalize categoryId filter to categories if present
            if (options.filter && options.filter.conditions) {
                options.filter.conditions = options.filter.conditions.map((cond) => {
                    if (cond.field === "categoryId") {
                        return { ...cond, field: "categories", operator: "in", value: [cond.value] };
                    }
                    return cond;
                });
            }
            let result;
            if (query) {
                result = await this.repository.search(query, options);
            }
            else {
                result = await this.repository.find(options);
            }
            res.status(200).json({
                success: true,
                data: result.data,
                pagination: result.pagination,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * GET /products/by-category/:category
     * Find products by category
     */
    async getByCategory(req, res, next) {
        try {
            const { category } = req.params;
            const { page, limit } = req.query;
            const result = await this.repository.findByCategory(category, {
                pagination: {
                    page: page ? Number(page) : 1,
                    limit: limit ? Number(limit) : 20,
                },
                tenantId: req.context?.tenantId,
            });
            res.status(200).json({
                success: true,
                data: result.data,
                pagination: result.pagination,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * GET /products/low-stock
     * Find low stock products
     */
    async getLowStock(req, res, next) {
        try {
            const { threshold, page, limit } = req.query;
            const result = await this.repository.findLowStock(threshold ? Number(threshold) : 10, {
                pagination: {
                    page: page ? Number(page) : 1,
                    limit: limit ? Number(limit) : 20,
                },
                tenantId: req.context?.tenantId,
            });
            res.status(200).json({
                success: true,
                data: result.data,
                pagination: result.pagination,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * POST /products/advanced-search
     * Complex filtered search
     *
     * Request body:
     * {
     *   "category": "electronics",
     *   "minPrice": 100,
     *   "maxPrice": 1000,
     *   "minStock": 5
     * }
     */
    async advancedSearch(req, res, next) {
        try {
            const { category, minPrice, maxPrice, minStock } = req.body;
            const { page, limit, sort } = req.query;
            const result = await this.repository.findByAdvancedCriteria(category, minPrice, maxPrice, minStock, {
                sort: typeof sort === "string" ? JSON.parse(sort) : undefined,
                pagination: {
                    page: page ? Number(page) : 1,
                    limit: limit ? Number(limit) : 20,
                },
                tenantId: req.context?.tenantId,
            });
            res.status(200).json({
                success: true,
                data: result.data,
                pagination: result.pagination,
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.ProductController = ProductController;
/**
 * FACTORY FUNCTION
 */
function createProductController(repository) {
    return new ProductController(repository);
}
//# sourceMappingURL=ProductController.js.map