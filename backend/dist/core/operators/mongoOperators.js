"use strict";
/**
 * MONGO OPERATOR REGISTRY
 * Maps filter operators to MongoDB query handlers
 * Extensible design: add new operators by calling registry.register()
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.OperatorRegistry = void 0;
exports.getOperatorRegistry = getOperatorRegistry;
exports.createOperatorRegistry = createOperatorRegistry;
exports.resetOperatorRegistry = resetOperatorRegistry;
/**
 * Default MongoDB operators
 * Each handler returns a MongoDB filter query fragment
 */
const defaultOperators = {
    // ==================== COMPARISON ====================
    eq: (field, value) => ({
        [field]: value,
    }),
    ne: (field, value) => ({
        [field]: { $ne: value },
    }),
    lt: (field, value) => ({
        [field]: { $lt: value },
    }),
    lte: (field, value) => ({
        [field]: { $lte: value },
    }),
    gt: (field, value) => ({
        [field]: { $gt: value },
    }),
    gte: (field, value) => ({
        [field]: { $gte: value },
    }),
    // ==================== RANGE ====================
    between: (field, value) => {
        if (!Array.isArray(value) || value.length !== 2) {
            throw new Error(`"between" operator requires an array with 2 values [min, max]`);
        }
        const [min, max] = value;
        return {
            [field]: { $gte: min, $lte: max },
        };
    },
    // ==================== ARRAY/SET ====================
    in: (field, value) => {
        if (!Array.isArray(value)) {
            throw new Error(`"in" operator requires an array value`);
        }
        return {
            [field]: { $in: value },
        };
    },
    notIn: (field, value) => {
        if (!Array.isArray(value)) {
            throw new Error(`"notIn" operator requires an array value`);
        }
        return {
            [field]: { $nin: value },
        };
    },
    // ==================== TEXT/STRING ====================
    contains: (field, value) => ({
        [field]: { $regex: escapeRegex(String(value)), $options: "i" },
    }),
    notContains: (field, value) => ({
        [field]: { $not: { $regex: escapeRegex(String(value)), $options: "i" } },
    }),
    startsWith: (field, value) => ({
        [field]: { $regex: `^${escapeRegex(String(value))}`, $options: "i" },
    }),
    endsWith: (field, value) => ({
        [field]: { $regex: `${escapeRegex(String(value))}$`, $options: "i" },
    }),
    regex: (field, value) => {
        if (typeof value !== "string" && !value.pattern) {
            throw new Error(`"regex" operator requires a string or regex pattern`);
        }
        const pattern = value.pattern || value;
        const options = value.options || "i";
        return {
            [field]: { $regex: pattern, $options: options },
        };
    },
    // ==================== EXISTENCE ====================
    isEmpty: (field) => ({
        $or: [
            { [field]: { $exists: false } },
            { [field]: null },
            { [field]: "" },
            { [field]: [] },
        ],
    }),
    isNotEmpty: (field) => ({
        $and: [
            { [field]: { $exists: true } },
            { [field]: { $ne: null } },
            { [field]: { $ne: "" } },
            { [field]: { $ne: [] } },
        ],
    }),
    // ==================== DATE ====================
    dateIsBefore: (field, value) => {
        const date = ensureDate(value);
        return {
            [field]: { $lt: date },
        };
    },
    dateIsAfter: (field, value) => {
        const date = ensureDate(value);
        return {
            [field]: { $gt: date },
        };
    },
    dateIsBetween: (field, value) => {
        if (!Array.isArray(value) || value.length !== 2) {
            throw new Error(`"dateIsBetween" operator requires [startDate, endDate]`);
        }
        const [start, end] = value;
        return {
            [field]: { $gte: ensureDate(start), $lte: ensureDate(end) },
        };
    },
    // ==================== RELATIVE DATES ====================
    isRelativeToToday: (field, value) => {
        const { operator, days = 0 } = value;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const compareDate = new Date(today);
        compareDate.setDate(compareDate.getDate() + days);
        switch (operator) {
            case "today":
                const tomorrow = new Date(today);
                tomorrow.setDate(tomorrow.getDate() + 1);
                return {
                    [field]: { $gte: today, $lt: tomorrow },
                };
            case "yesterday":
                const yesterday = new Date(today);
                yesterday.setDate(yesterday.getDate() - 1);
                return {
                    [field]: { $gte: yesterday, $lt: today },
                };
            case "tomorrow":
                const dayAfterTomorrow = new Date(today);
                dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
                return {
                    [field]: { $gte: compareDate, $lt: dayAfterTomorrow },
                };
            case "next_n_days":
                const futureDate = new Date(today);
                futureDate.setDate(futureDate.getDate() + days);
                return {
                    [field]: { $gte: today, $lte: futureDate },
                };
            case "last_n_days":
                const pastDate = new Date(today);
                pastDate.setDate(pastDate.getDate() - days);
                return {
                    [field]: { $gte: pastDate, $lte: today },
                };
            default:
                throw new Error(`Unknown relative date operator: ${operator}. Use: today, yesterday, tomorrow, next_n_days, last_n_days`);
        }
    },
};
/**
 * Operator Registry Implementation
 * Manages operator handlers with registration and retrieval
 */
class OperatorRegistry {
    constructor() {
        this.operators = new Map(Object.entries(defaultOperators));
    }
    /**
     * Register a new operator
     */
    register(operator) {
        if (this.operators.has(operator.name)) {
            throw new Error(`Operator "${operator.name}" is already registered. Override not allowed.`);
        }
        this.operators.set(operator.name, operator.handler);
    }
    /**
     * Get operator handler
     */
    get(name) {
        return this.operators.get(name);
    }
    /**
     * Get all operators
     */
    getAll() {
        return new Map(this.operators);
    }
    /**
     * Check if operator is supported
     */
    supports(name) {
        return this.operators.has(name);
    }
    /**
     * Get list of all operator names
     */
    list() {
        return Array.from(this.operators.keys());
    }
}
exports.OperatorRegistry = OperatorRegistry;
/**
 * UTILITY FUNCTIONS
 */
/**
 * Escape regex special characters
 */
function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
/**
 * Convert value to Date object
 */
function ensureDate(value) {
    if (value instanceof Date)
        return value;
    const date = new Date(value);
    if (isNaN(date.getTime())) {
        throw new Error(`Invalid date value: ${value}`);
    }
    return date;
}
// ============================================================================
// SINGLETON INSTANCE & FACTORY
// ============================================================================
let registryInstance = null;
/**
 * Get or create singleton registry
 */
function getOperatorRegistry() {
    if (!registryInstance) {
        registryInstance = new OperatorRegistry();
    }
    return registryInstance;
}
/**
 * Create new registry instance (for testing)
 */
function createOperatorRegistry() {
    return new OperatorRegistry();
}
/**
 * Reset singleton (for testing)
 */
function resetOperatorRegistry() {
    registryInstance = null;
}
/**
 * Example: How to extend with custom operators
 *
 * const registry = getOperatorRegistry();
 *
 * registry.register({
 *   name: 'customOperator' as FilterOperator,
 *   handler: (field, value) => ({
 *     [field]: { $custom: value }
 *   }),
 *   description: 'Custom operator for special use case'
 * });
 */
//# sourceMappingURL=mongoOperators.js.map