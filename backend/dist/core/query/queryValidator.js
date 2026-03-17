"use strict";
/**
 * QUERY VALIDATOR
 * Validates QueryOptions against field schema before execution
 * Prevents expensive/malicious queries at the source
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueryValidator = void 0;
exports.createQueryValidator = createQueryValidator;
const mongoOperators_1 = require("../operators/mongoOperators");
/**
 * Query validator implementation
 * Checks filters, sorts, fields, and query complexity
 */
class QueryValidator {
    constructor(maxFilterDepth = 10, maxConditionsPerNode = 20) {
        this.registry = (0, mongoOperators_1.getOperatorRegistry)();
        this.maxFilterDepth = 10;
        this.maxConditionsPerNode = 20;
        this.maxFilterDepth = maxFilterDepth;
        this.maxConditionsPerNode = maxConditionsPerNode;
    }
    /**
     * Validate entire query filter tree
     * Checks:
     * - Field names exist in schema
     * - Operators are supported
     * - Values are appropriate types
     * - Tree depth is reasonable
     * - No excessive conditions
     */
    validateFilter(filter, schema) {
        if (!filter)
            return;
        try {
            this.validateFilterNode(filter, schema, 0);
        }
        catch (error) {
            throw new Error(`Filter validation failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Validate individual filter node (recursive)
     *
     * @private
     */
    validateFilterNode(node, schema, depth) {
        // Check depth
        if (depth > this.maxFilterDepth) {
            throw new Error(`Filter nesting depth (${depth}) exceeds maximum (${this.maxFilterDepth})`);
        }
        // GROUPED CONDITIONS
        if (node.logic && node.conditions) {
            if (!["and", "or"].includes(node.logic)) {
                throw new Error(`Invalid logic operator: ${node.logic}`);
            }
            if (node.conditions.length > this.maxConditionsPerNode) {
                throw new Error(`Too many conditions in group (${node.conditions.length}, max: ${this.maxConditionsPerNode})`);
            }
            // Recursively validate each condition
            for (const condition of node.conditions) {
                this.validateFilterNode(condition, schema, depth + 1);
            }
            return;
        }
        // LEAF CONDITION
        if (node.field && node.operator) {
            this.validateLeafCondition(node, schema);
            return;
        }
        // Empty node is valid
    }
    /**
     * Validate a leaf condition (field + operator + value)
     *
     * @private
     */
    validateLeafCondition(node, schema) {
        const { field, operator, value } = node;
        if (!field) {
            throw new Error("Leaf condition missing field");
        }
        if (!operator) {
            throw new Error("Leaf condition missing operator");
        }
        // Check field exists in schema
        const fieldMeta = schema.find((f) => f.name === field);
        if (!fieldMeta) {
            throw new Error(`Field "${field}" not found in schema`);
        }
        // Check field is filterable
        if (fieldMeta.filterable === false) {
            throw new Error(`Field "${field}" is not filterable`);
        }
        // Check operator is supported globally
        if (!this.registry.supports(operator)) {
            throw new Error(`Operator "${operator}" is not supported. Available: ${this.registry.list().join(", ")}`);
        }
        // Check operator is supported for this field type
        const supportedOps = fieldMeta.supportedOperators || this.registry.list();
        if (!supportedOps.includes(operator)) {
            throw new Error(`Operator "${operator}" is not supported for field "${field}" (type: ${fieldMeta.type}). Supported: ${supportedOps.join(", ")}`);
        }
        // Type-specific validation
        this.validateOperatorValue(operator, fieldMeta, value);
    }
    /**
     * Validate value is appropriate for operator and field type
     *
     * @private
     */
    validateOperatorValue(operator, fieldMeta, value) {
        if (["isEmpty", "isNotEmpty"].includes(operator)) {
            // These don't need a value
            return;
        }
        if (value === undefined || value === null) {
            throw new Error(`Operator "${operator}" requires a value, got ${value}`);
        }
        // Type-specific checks
        switch (fieldMeta.type) {
            case "number":
                this.validateNumberOperatorValue(operator, value);
                break;
            case "date":
                this.validateDateOperatorValue(operator, value);
                break;
            case "string":
                this.validateStringOperatorValue(operator, value);
                break;
            case "boolean":
                this.validateBooleanOperatorValue(operator, value);
                break;
            case "array":
                this.validateArrayOperatorValue(operator, value);
                break;
        }
    }
    /**
     * Validate numeric value
     *
     * @private
     */
    validateNumberOperatorValue(operator, value) {
        if (["lt", "lte", "gt", "gte", "eq", "ne"].includes(operator)) {
            if (typeof value !== "number") {
                throw new Error(`Operator "${operator}" requires a number, got ${typeof value}`);
            }
        }
        else if (operator === "between") {
            if (!Array.isArray(value) ||
                value.length !== 2 ||
                !value.every((v) => typeof v === "number")) {
                throw new Error(`Operator "between" requires [min: number, max: number]`);
            }
        }
        else if (["in", "notIn"].includes(operator)) {
            if (!Array.isArray(value) || !value.every((v) => typeof v === "number")) {
                throw new Error(`Operator "${operator}" requires an array of numbers`);
            }
        }
    }
    /**
     * Validate date value
     *
     * @private
     */
    validateDateOperatorValue(operator, value) {
        if (["dateIsBefore", "dateIsAfter", "eq", "ne"].includes(operator)) {
            if (!(value instanceof Date) && typeof value !== "string") {
                throw new Error(`Operator "${operator}" requires a valid date`);
            }
        }
        else if (operator === "dateIsBetween") {
            if (!Array.isArray(value) ||
                value.length !== 2 ||
                !value.every((v) => v instanceof Date || typeof v === "string")) {
                throw new Error(`Operator "dateIsBetween" requires [startDate, endDate]`);
            }
        }
        else if (operator === "isRelativeToToday") {
            if (typeof value !== "object" || !value.operator) {
                throw new Error(`Operator "isRelativeToToday" requires { operator: string, days?: number }`);
            }
        }
    }
    /**
     * Validate string value
     *
     * @private
     */
    validateStringOperatorValue(operator, value) {
        if ([
            "contains",
            "notContains",
            "startsWith",
            "endsWith",
            "regex",
            "eq",
            "ne",
        ].includes(operator)) {
            if (typeof value !== "string" && typeof value !== "object") {
                throw new Error(`Operator "${operator}" requires a string or regex pattern`);
            }
        }
        else if (["in", "notIn"].includes(operator)) {
            if (!Array.isArray(value) || !value.every((v) => typeof v === "string")) {
                throw new Error(`Operator "${operator}" requires an array of strings`);
            }
        }
    }
    /**
     * Validate boolean value
     *
     * @private
     */
    validateBooleanOperatorValue(operator, value) {
        if (["eq", "ne"].includes(operator)) {
            if (typeof value !== "boolean") {
                throw new Error(`Operator "${operator}" requires a boolean value for boolean field`);
            }
        }
    }
    /**
     * Validate array value
     *
     * @private
     */
    validateArrayOperatorValue(_operator, _value) {
        // Array type validation is flexible
    }
    /**
     * Validate sort specification
     */
    validateSort(sort, schema) {
        if (!sort || sort.length === 0)
            return;
        for (const spec of sort) {
            const fieldMeta = schema.find((f) => f.name === spec.field);
            if (!fieldMeta) {
                throw new Error(`Field "${spec.field}" not found in schema`);
            }
            if (fieldMeta.sortable === false) {
                throw new Error(`Field "${spec.field}" is not sortable`);
            }
            if (!["asc", "desc"].includes(spec.order)) {
                throw new Error(`Invalid sort order "${spec.order}". Use "asc" or "desc"`);
            }
        }
    }
    /**
     * Validate field selection
     */
    validateFields(fields, schema) {
        if (!fields || fields.length === 0)
            return;
        for (const field of fields) {
            const fieldMeta = schema.find((f) => f.name === field);
            if (!fieldMeta) {
                throw new Error(`Field "${field}" not found in schema`);
            }
            if (fieldMeta.selectable === false) {
                throw new Error(`Field "${field}" is not selectable`);
            }
        }
    }
    /**
     * Estimate query complexity score
     * Higher scores = more expensive queries
     * Used to prevent DOS attacks
     */
    estimateComplexity(options) {
        let score = 0;
        // Filter complexity (each condition costs 1, depth multiplier)
        if (options.filter) {
            score += this.estimateFilterComplexity(options.filter);
        }
        // Search complexity (multi-field search is more expensive)
        if (options.search && options.searchFields) {
            score += 5 * options.searchFields.length;
        }
        // Sort complexity (multi-column sort)
        if (options.sort) {
            score += 2 * options.sort.length;
        }
        // Large limit increases complexity
        const limit = options.pagination?.limit || 20;
        if (limit > 100) {
            score += Math.ceil((limit - 100) / 10);
        }
        // Full field selection
        if (!options.fields || options.fields.length === 0) {
            score += 5;
        }
        return score;
    }
    /**
     * Estimate filter complexity (helper)
     *
     * @private
     */
    estimateFilterComplexity(node, depth = 1) {
        let score = 0;
        if (node.logic && node.conditions) {
            // Each condition costs points
            score += node.conditions.length * depth;
            // Recursively estimate child conditions
            for (const condition of node.conditions) {
                score += this.estimateFilterComplexity(condition, depth + 1);
            }
        }
        else if (node.field && node.operator) {
            // Regex operators are most expensive
            if (["regex", "contains", "notContains"].includes(node.operator)) {
                score += 3;
            }
            else if (["startsWith", "endsWith", "isRelativeToToday"].includes(node.operator)) {
                score += 2;
            }
            else {
                score += 1;
            }
        }
        return score;
    }
    /**
     * Set maximum nesting depth
     */
    setMaxFilterDepth(depth) {
        this.maxFilterDepth = depth;
    }
    /**
     * Set maximum conditions per node
     */
    setMaxConditionsPerNode(count) {
        this.maxConditionsPerNode = count;
    }
}
exports.QueryValidator = QueryValidator;
/**
 * FACTORY FUNCTION
 */
function createQueryValidator(maxFilterDepth, maxConditionsPerNode) {
    return new QueryValidator(maxFilterDepth, maxConditionsPerNode);
}
//# sourceMappingURL=queryValidator.js.map