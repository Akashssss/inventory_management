"use strict";
/**
 * MONGO QUERY ENGINE
 * Central execution engine for all data queries
 * Orchestrates filtering, searching, sorting, pagination
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MongoQueryEngine = void 0;
exports.createQueryEngine = createQueryEngine;
exports.getQueryEngine = getQueryEngine;
exports.resetQueryEngine = resetQueryEngine;
const mongoOperators_1 = require("../operators/mongoOperators");
const mongoQueryBuilder_1 = require("./mongoQueryBuilder");
const queryValidator_1 = require("./queryValidator");
/**
 * MongoDB Query Engine
 * Production-grade query execution with validation, security, and optimization
 */
class MongoQueryEngine {
    constructor(enableValidation = true, enableQueryLogging = false) {
        this.fieldSchemas = new Map();
        this.maxQueryComplexity = 100;
        this.enableQueryLogging = false;
        this.operatorRegistry = (0, mongoOperators_1.getOperatorRegistry)();
        this.validator = (0, queryValidator_1.createQueryValidator)();
        this.builder = (0, mongoQueryBuilder_1.createQueryBuilder)(this.validator);
        this.enableQueryLogging = enableQueryLogging;
    }
    /**
     * Execute a query with full feature support
     * This is the main entry point for all queries
     *
     * @example
     * const result = await queryEngine.execute(Product, {
     *   filter: { field: "price", operator: "gte", value: 100 },
     *   search: "laptop",
     *   searchFields: ["name", "description"],
     *   sort: [{ field: "price", order: "asc" }],
     *   pagination: { page: 1, limit: 20 },
     *   fields: ["name", "price", "stock"],
     *   tenantId: "tenant-123"
     * });
     */
    async execute(model, options) {
        const startTime = Date.now();
        const queryId = this.generateQueryId();
        try {
            // STEP 1: VALIDATE
            const schema = this.fieldSchemas.get(model.collection.name);
            if (schema) {
                this.validator.validateFilter(options.filter, schema);
                this.validator.validateSort(options.sort, schema);
                this.validator.validateFields(options.fields, schema);
            }
            // STEP 2: CHECK COMPLEXITY
            const complexity = this.validator.estimateComplexity(options);
            if (complexity > this.maxQueryComplexity) {
                throw new Error(`Query too complex (score: ${complexity}, max: ${this.maxQueryComplexity}). Simplify your filters or pagination.`);
            }
            // STEP 3: BUILD MONGO QUERY
            const builtQuery = this.builder.build(options);
            if (this.enableQueryLogging) {
                console.log(`[Query ${queryId}] Built query:`, {
                    filter: builtQuery.filter,
                    sort: builtQuery.sort,
                    skip: builtQuery.skip,
                    limit: builtQuery.limit,
                    complexity,
                });
            }
            // STEP 4: BUILD MONGOOSE QUERY
            let mongooseQuery = model.find(builtQuery.filter);
            // Apply sort
            if (builtQuery.sort) {
                mongooseQuery = mongooseQuery.sort(builtQuery.sort);
            }
            // Apply field selection
            if (builtQuery.fields) {
                mongooseQuery = mongooseQuery.select(builtQuery.fields);
            }
            // STEP 5: APPLY FULL-TEXT SEARCH (if provided)
            if (options.search && options.searchFields && options.searchFields.length > 0) {
                const searchFilter = this.buildSearchFilter(options.search, options.searchFields);
                mongooseQuery = model.find({
                    $and: [builtQuery.filter, searchFilter],
                });
                if (builtQuery.sort)
                    mongooseQuery = mongooseQuery.sort(builtQuery.sort);
                if (builtQuery.fields)
                    mongooseQuery = mongooseQuery.select(builtQuery.fields);
            }
            // STEP 6: EXECUTE QUERY & COUNT (in parallel for efficiency)
            const [data, total] = await Promise.all([
                mongooseQuery.skip(builtQuery.skip).limit(builtQuery.limit).exec(),
                model.countDocuments(builtQuery.filter),
            ]);
            // STEP 7: BUILD RESULT
            const page = (options.pagination?.page || 1);
            const limit = builtQuery.limit;
            const totalPages = Math.ceil(total / limit);
            const paginationMeta = {
                page,
                limit,
                total,
                totalPages,
                hasNextPage: page < totalPages,
                hasPreviousPage: page > 1,
            };
            const executionTime = Date.now() - startTime;
            if (this.enableQueryLogging) {
                console.log(`[Query ${queryId}] Executed in ${executionTime}ms. Results: ${data.length}/${total}`);
            }
            return {
                data,
                pagination: paginationMeta,
                meta: {
                    executionTime,
                    queryHash: this.hashQuery(options),
                    cacheHit: false, // Can be extended with caching layer
                },
            };
        }
        catch (error) {
            if (this.enableQueryLogging) {
                console.error(`[Query ${queryId}] Error:`, error);
            }
            throw error;
        }
    }
    /**
     * Register a custom operator
     */
    registerOperator(operator) {
        this.operatorRegistry.register(operator);
    }
    /**
     * Register field schema for a model
     * Used for validation and field whitelisting
     */
    registerFieldSchema(modelName, schema) {
        this.fieldSchemas.set(modelName, schema);
        this.builder.updateFieldSchema(schema);
    }
    /**
     * Get operator registry
     */
    getOperatorRegistry() {
        return this.operatorRegistry;
    }
    /**
     * Get validator
     */
    getValidator() {
        return this.validator;
    }
    /**
     * Get builder
     */
    getBuilder() {
        return this.builder;
    }
    /**
     * Set maximum query complexity
     */
    setMaxQueryComplexity(complexity) {
        this.maxQueryComplexity = complexity;
        this.builder.setMaxComplexity(complexity);
    }
    /**
     * Enable/disable query logging
     */
    setQueryLogging(enabled) {
        this.enableQueryLogging = enabled;
    }
    /**
     * Build full-text search filter
     *
     * @private
     */
    buildSearchFilter(search, fields) {
        return {
            $or: fields.map((field) => ({
                [field]: { $regex: escapeRegex(search), $options: "i" },
            })),
        };
    }
    /**
     * Generate unique query ID for logging/tracing
     *
     * @private
     */
    generateQueryId() {
        return `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    /**
     * Hash query options for caching/tracking
     *
     * @private
     */
    hashQuery(options) {
        const str = JSON.stringify({
            filter: options.filter,
            search: options.search,
            sort: options.sort,
        });
        return this.simpleHash(str);
    }
    /**
     * Simple hash function (for non-crypto use)
     *
     * @private
     */
    simpleHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = (hash << 5) - hash + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return Math.abs(hash).toString(16);
    }
}
exports.MongoQueryEngine = MongoQueryEngine;
/**
 * ESCAPE REGEX HELPER
 */
function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
/**
 * FACTORY FUNCTION
 */
function createQueryEngine(enableValidation = true, enableQueryLogging = false) {
    return new MongoQueryEngine(enableValidation, enableQueryLogging);
}
/**
 * SINGLETON INSTANCE
 */
let engineInstance = null;
/**
 * Get or create singleton query engine
 */
function getQueryEngine() {
    if (!engineInstance) {
        engineInstance = createQueryEngine();
    }
    return engineInstance;
}
/**
 * Reset singleton (for testing)
 */
function resetQueryEngine() {
    engineInstance = null;
}
//# sourceMappingURL=mongoQueryEngine.js.map