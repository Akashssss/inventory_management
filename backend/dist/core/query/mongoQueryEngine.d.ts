/**
 * MONGO QUERY ENGINE
 * Central execution engine for all data queries
 * Orchestrates filtering, searching, sorting, pagination
 */
import { QueryOptions, QueryResult, IQueryEngine, IOperatorRegistry, IQueryValidator, IQueryBuilder, RegisteredOperator, FieldMetadata } from "../../types/query.types";
/**
 * MongoDB Query Engine
 * Production-grade query execution with validation, security, and optimization
 */
export declare class MongoQueryEngine implements IQueryEngine {
    private operatorRegistry;
    private validator;
    private builder;
    private fieldSchemas;
    private maxQueryComplexity;
    private enableQueryLogging;
    constructor(enableValidation?: boolean, enableQueryLogging?: boolean);
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
    execute<T>(model: any, options: QueryOptions): Promise<QueryResult<T>>;
    /**
     * Register a custom operator
     */
    registerOperator(operator: RegisteredOperator): void;
    /**
     * Register field schema for a model
     * Used for validation and field whitelisting
     */
    registerFieldSchema(modelName: string, schema: FieldMetadata[]): void;
    /**
     * Get operator registry
     */
    getOperatorRegistry(): IOperatorRegistry;
    /**
     * Get validator
     */
    getValidator(): IQueryValidator;
    /**
     * Get builder
     */
    getBuilder(): IQueryBuilder;
    /**
     * Set maximum query complexity
     */
    setMaxQueryComplexity(complexity: number): void;
    /**
     * Enable/disable query logging
     */
    setQueryLogging(enabled: boolean): void;
    /**
     * Build full-text search filter
     *
     * @private
     */
    private buildSearchFilter;
    /**
     * Generate unique query ID for logging/tracing
     *
     * @private
     */
    private generateQueryId;
    /**
     * Hash query options for caching/tracking
     *
     * @private
     */
    private hashQuery;
    /**
     * Simple hash function (for non-crypto use)
     *
     * @private
     */
    private simpleHash;
}
/**
 * FACTORY FUNCTION
 */
export declare function createQueryEngine(enableValidation?: boolean, enableQueryLogging?: boolean): MongoQueryEngine;
/**
 * Get or create singleton query engine
 */
export declare function getQueryEngine(): MongoQueryEngine;
/**
 * Reset singleton (for testing)
 */
export declare function resetQueryEngine(): void;
//# sourceMappingURL=mongoQueryEngine.d.ts.map