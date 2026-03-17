"use strict";
/**
 * PRODUCT REPOSITORY
 * Domain-specific repository for Product operations
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductRepository = exports.productFieldSchema = void 0;
exports.createProductRepository = createProductRepository;
exports.getProductRepository = getProductRepository;
exports.resetProductRepository = resetProductRepository;
const BaseRepository_1 = require("./BaseRepository");
const Product_1 = require("../models/Product");
const Category_1 = require("../models/Category");
/**
 * Product field schema
 * Used for validation and field whitelisting
 */
exports.productFieldSchema = [
    {
        name: "_id",
        type: "string",
        filterable: true,
        searchable: false,
        sortable: true,
        selectable: true,
        indexed: true,
    },
    {
        name: "tenantId",
        type: "string",
        filterable: true,
        searchable: false,
        sortable: false,
        selectable: false,
        indexed: true,
    },
    {
        name: "name",
        type: "string",
        filterable: true,
        searchable: true,
        sortable: true,
        selectable: true,
        supportedOperators: ["eq", "ne", "contains", "startsWith", "endsWith", "regex", "in", "notIn"],
        indexed: true,
    },
    {
        name: "description",
        type: "string",
        filterable: true,
        searchable: true,
        sortable: false,
        selectable: true,
        supportedOperators: ["contains", "notContains", "isEmpty", "isNotEmpty"],
    },
    {
        name: "categories",
        type: "array",
        filterable: true,
        searchable: true,
        sortable: false,
        selectable: true,
        supportedOperators: ["in", "notIn"],
        indexed: true,
    },
    {
        name: "sellingPrice",
        type: "number",
        filterable: true,
        searchable: false,
        sortable: true,
        selectable: true,
        supportedOperators: ["eq", "ne", "lt", "lte", "gt", "gte", "between"],
        indexed: true,
    },
    {
        name: "costPrice",
        type: "number",
        filterable: true,
        searchable: false,
        sortable: true,
        selectable: true,
        supportedOperators: ["eq", "ne", "lt", "lte", "gt", "gte", "between", "isEmpty", "isNotEmpty"],
    },
    {
        name: "stock",
        type: "number",
        filterable: true,
        searchable: false,
        sortable: true,
        selectable: true,
        supportedOperators: ["eq", "ne", "lt", "lte", "gt", "gte", "between"],
        indexed: true,
    },
    {
        name: "status",
        type: "string",
        filterable: true,
        searchable: false,
        sortable: true,
        selectable: true,
        supportedOperators: ["eq", "ne", "in", "notIn"],
        indexed: true,
    },
    {
        name: "createdAt",
        type: "date",
        filterable: true,
        searchable: false,
        sortable: true,
        selectable: true,
        supportedOperators: ["eq", "ne", "dateIsBefore", "dateIsAfter", "dateIsBetween", "isRelativeToToday"],
        indexed: true,
    },
    {
        name: "updatedAt",
        type: "date",
        filterable: true,
        searchable: false,
        sortable: true,
        selectable: true,
        supportedOperators: ["eq", "ne", "dateIsBefore", "dateIsAfter", "dateIsBetween", "isRelativeToToday"],
        indexed: true,
    },
    {
        name: "isSmallProduct",
        type: "boolean",
        filterable: true,
        searchable: false,
        sortable: true,
        selectable: true,
        supportedOperators: ["eq", "ne"],
        indexed: true,
    },
    {
        name: "type",
        type: "string",
        filterable: true,
        searchable: false,
        sortable: true,
        selectable: true,
        supportedOperators: ["eq", "ne", "in", "notIn"],
    },
    {
        name: "unit",
        type: "string",
        filterable: true,
        searchable: false,
        sortable: true,
        selectable: true,
        supportedOperators: ["eq", "ne", "in", "notIn"],
    },
    {
        name: "lowStockThreshold",
        type: "number",
        filterable: true,
        searchable: false,
        sortable: true,
        selectable: true,
        supportedOperators: ["eq", "ne", "lt", "lte", "gt", "gte"],
    },
    {
        name: "deletedAt",
        type: "date",
        filterable: true,
        searchable: false,
        sortable: true,
        selectable: false,
        supportedOperators: ["isEmpty", "isNotEmpty"],
        indexed: true,
    },
];
/**
 * Product Repository
 * Extends BaseRepository with Product-specific methods
 */
class ProductRepository extends BaseRepository_1.BaseRepository {
    constructor(queryEngine) {
        super(Product_1.Product, queryEngine);
        // Register field schema with query engine
        this.queryEngine.registerFieldSchema("products", exports.productFieldSchema);
    }
    /**
     * Find products by category
     */
    async findByCategory(category, options) {
        return this.find({
            filter: {
                field: "categories",
                operator: "in",
                value: [category],
            },
            ...options,
        });
    }
    /**
     * Find low stock products
     */
    async findLowStock(threshold = 10, options) {
        return this.find({
            filter: {
                field: "stock",
                operator: "lt",
                value: threshold,
            },
            ...options,
        });
    }
    /**
     * Find products within price range
     */
    async findByPriceRange(minPrice, maxPrice, options) {
        return this.find({
            filter: {
                field: "sellingPrice",
                operator: "between",
                value: [minPrice, maxPrice],
            },
            ...options,
        });
    }
    /**
     * Search products by name and description
     */
    async search(query, options) {
        return this.find({
            search: query,
            searchFields: ["name", "description"],
            ...options,
        });
    }
    /**
     * Find active products only
     */
    async findActive(options) {
        return this.find({
            filter: {
                field: "status",
                operator: "eq",
                value: "active",
            },
            ...options,
        });
    }
    /**
     * Find products by multiple criteria (complex query)
     */
    async findByAdvancedCriteria(category, minPrice, maxPrice, minStock = 1, options) {
        return this.find({
            filter: {
                logic: "and",
                conditions: [
                    { field: "categories", operator: "in", value: [category] },
                    { field: "sellingPrice", operator: "between", value: [minPrice, maxPrice] },
                    { field: "stock", operator: "gte", value: minStock },
                    { field: "status", operator: "eq", value: "active" },
                ],
            },
            ...options,
        });
    }
    async getSmallProductCategories(tenantId) {
        const filter = { isSmallProduct: true, stock: { $gt: 0 } };
        if (tenantId)
            filter.tenantId = tenantId;
        // Get unique category IDs/names from products
        const categoryValues = await this.model.distinct("categories", filter).exec();
        // Resolve any IDs to names and ensure unique names
        const categories = await Category_1.Category.find({
            $or: [
                { _id: { $in: categoryValues } },
                { name: { $in: categoryValues } }
            ],
            tenantId: tenantId || "default"
        }).select("name").exec();
        // Return unique set of names
        return Array.from(new Set(categories.map(c => c.name)));
    }
    async getSmallProductPrices(categoryName, tenantId) {
        const filter = {
            isSmallProduct: true,
            stock: { $gt: 0 }
        };
        if (tenantId)
            filter.tenantId = tenantId;
        // Resolve Name to ID or Name
        const categoryDoc = await Category_1.Category.findOne({
            name: categoryName,
            tenantId: tenantId || "default"
        }).select("_id").exec();
        if (categoryDoc) {
            filter.categories = categoryDoc._id.toString();
        }
        else {
            filter.categories = categoryName;
        }
        const prices = await this.model.distinct("sellingPrice", filter).exec();
        return prices.sort((a, b) => a - b);
    }
}
exports.ProductRepository = ProductRepository;
/**
 * FACTORY FUNCTION
 */
function createProductRepository(queryEngine) {
    return new ProductRepository(queryEngine);
}
/**
 * SINGLETON INSTANCE (optional)
 */
let productRepositoryInstance = null;
function getProductRepository() {
    if (!productRepositoryInstance) {
        productRepositoryInstance = new ProductRepository();
    }
    return productRepositoryInstance;
}
function resetProductRepository() {
    productRepositoryInstance = null;
}
//# sourceMappingURL=ProductRepository.js.map