"use strict";
/**
 * MONGO FILTER BUILDER
 * Recursively converts FilterNode trees into MongoDB filter queries
 * Supports infinite nesting with AND/OR logic
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MongoFilterBuilder = void 0;
exports.createFilterBuilder = createFilterBuilder;
exports.explainFilterTree = explainFilterTree;
const mongoOperators_1 = require("../operators/mongoOperators");
/**
 * Recursive MongoDB filter builder
 * Transforms nested filter trees into MongoDB $and/$or queries
 */
class MongoFilterBuilder {
    constructor(validator) {
        this.registry = (0, mongoOperators_1.getOperatorRegistry)();
        this.validator = validator;
    }
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
    build(node) {
        if (!node)
            return {};
        // RECURSION: Handle grouped conditions (AND/OR)
        if (node.logic && node.conditions && node.conditions.length > 0) {
            const builtConditions = node.conditions.map((condition) => this.build(condition));
            // Filter out empty conditions
            const nonEmptyConditions = builtConditions.filter((cond) => Object.keys(cond).length > 0);
            if (nonEmptyConditions.length === 0)
                return {};
            // Special case: single condition doesn't need wrapper
            if (nonEmptyConditions.length === 1 && node.logic === "and") {
                return nonEmptyConditions[0];
            }
            if (node.logic === "and") {
                return { $and: nonEmptyConditions };
            }
            if (node.logic === "or") {
                return { $or: nonEmptyConditions };
            }
        }
        // LEAF CONDITION: Apply operator
        if (node.field && node.operator) {
            return this.buildLeafCondition(node);
        }
        return {};
    }
    /**
     * Build a single leaf condition (field + operator + value)
     *
     * @private
     */
    buildLeafCondition(node) {
        const { field, operator, value } = node;
        if (!field || !operator) {
            throw new Error("Leaf condition must have both field and operator");
        }
        // Get operator handler
        const handler = this.registry.get(operator);
        if (!handler) {
            throw new Error(`Unsupported operator: "${operator}". Use one of: ${this.registry.list().join(", ")}`);
        }
        try {
            // Execute operator handler
            return handler(field, value);
        }
        catch (error) {
            throw new Error(`Error building filter for field "${field}" with operator "${operator}": ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Build filter with field validation
     * (if validator is provided)
     */
    buildWithValidation(node, fieldSchema) {
        if (this.validator && fieldSchema) {
            this.validator.validateFilter(node, fieldSchema);
        }
        return this.build(node);
    }
    /**
     * Add filtering extensions (for multi-tenancy, soft deletes, etc.)
     * Injects additional filters without modifying original node
     */
    buildWithExtensions(node, extensions) {
        const baseFilter = this.build(node);
        const baseFilterKeys = Object.keys(baseFilter);
        if (baseFilterKeys.length === 0 && extensions.length === 0) {
            return {};
        }
        // If no base filter, return extensions combined
        if (baseFilterKeys.length === 0) {
            return extensions.length === 1 ? extensions[0] : { $and: extensions };
        }
        // Merge with base filter
        const filters = [baseFilter, ...extensions];
        return { $and: filters };
    }
    /**
     * Merge multiple filter nodes
     */
    merge(nodes, logic = "and") {
        const builtFilters = nodes
            .map((node) => this.build(node))
            .filter((filter) => Object.keys(filter).length > 0);
        if (builtFilters.length === 0)
            return {};
        if (builtFilters.length === 1)
            return builtFilters[0];
        return { [logic === "and" ? "$and" : "$or"]: builtFilters };
    }
}
exports.MongoFilterBuilder = MongoFilterBuilder;
/**
 * FACTORY FUNCTION
 */
function createFilterBuilder(validator) {
    return new MongoFilterBuilder(validator);
}
/**
 * UTILITY: Explain filter tree structure (for debugging)
 */
function explainFilterTree(node, depth = 0) {
    const indent = "  ".repeat(depth);
    if (node.logic && node.conditions) {
        let explanation = `${indent}${node.logic.toUpperCase()} [\n`;
        explanation += node.conditions
            .map((cond) => explainFilterTree(cond, depth + 1))
            .join("");
        explanation += `${indent}]\n`;
        return explanation;
    }
    if (node.field && node.operator) {
        return `${indent}${node.field} ${node.operator} ${JSON.stringify(node.value)}\n`;
    }
    return `${indent}(empty)\n`;
}
//# sourceMappingURL=mongoFilterBuilder.js.map