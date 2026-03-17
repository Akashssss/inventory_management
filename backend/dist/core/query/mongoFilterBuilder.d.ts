/**
 * MONGO FILTER BUILDER
 * Recursively converts FilterNode trees into MongoDB filter queries
 * Supports infinite nesting with AND/OR logic
 */
import { FilterNode, MongoFilterQuery, IQueryValidator } from "../../types/query.types";
/**
 * Recursive MongoDB filter builder
 * Transforms nested filter trees into MongoDB $and/$or queries
 */
export declare class MongoFilterBuilder {
    private registry;
    private validator?;
    constructor(validator?: IQueryValidator);
    /**
     * Build MongoDB filter from filter tree
     * Handles recursive nesting and AND/OR logic
     *
     * @param node - Root filter node
     * @returns MongoDB filter query
     *
     * @example
     * const filter = {
     *   logic: "and",
     *   conditions: [
     *     { field: "price", operator: "gte", value: 100 },
     *     {
     *       logic: "or",
     *       conditions: [
     *         { field: "category", operator: "eq", value: "electronics" },
     *         { field: "stock", operator: "lt", value: 5 }
     *       ]
     *     }
     *   ]
     * };
     *
     * const mongoFilter = builder.build(filter);
     * // Result:
     * // {
     * //   $and: [
     * //     { price: { $gte: 100 } },
     * //     {
     * //       $or: [
     * //         { category: "electronics" },
     * //         { stock: { $lt: 5 } }
     * //       ]
     * //     }
     * //   ]
     * // }
     */
    build(node?: FilterNode): MongoFilterQuery;
    /**
     * Build a single leaf condition (field + operator + value)
     *
     * @private
     */
    private buildLeafCondition;
    /**
     * Build filter with field validation
     * (if validator is provided)
     */
    buildWithValidation(node: FilterNode, fieldSchema?: any[]): MongoFilterQuery;
    /**
     * Add filtering extensions (for multi-tenancy, soft deletes, etc.)
     * Injects additional filters without modifying original node
     */
    buildWithExtensions(node: FilterNode | undefined, extensions: MongoFilterQuery[]): MongoFilterQuery;
    /**
     * Merge multiple filter nodes
     */
    merge(nodes: FilterNode[], logic?: "and" | "or"): MongoFilterQuery;
}
/**
 * FACTORY FUNCTION
 */
export declare function createFilterBuilder(validator?: IQueryValidator): MongoFilterBuilder;
/**
 * UTILITY: Explain filter tree structure (for debugging)
 */
export declare function explainFilterTree(node: FilterNode, depth?: number): string;
//# sourceMappingURL=mongoFilterBuilder.d.ts.map