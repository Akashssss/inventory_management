/**
 * MONGO OPERATOR REGISTRY
 * Maps filter operators to MongoDB query handlers
 * Extensible design: add new operators by calling registry.register()
 */
import { FilterOperator, IOperatorRegistry, OperatorHandler, RegisteredOperator } from "../../types/query.types";
/**
 * Operator Registry Implementation
 * Manages operator handlers with registration and retrieval
 */
export declare class OperatorRegistry implements IOperatorRegistry {
    private operators;
    constructor();
    /**
     * Register a new operator
     */
    register(operator: RegisteredOperator): void;
    /**
     * Get operator handler
     */
    get(name: FilterOperator): OperatorHandler | undefined;
    /**
     * Get all operators
     */
    getAll(): Map<FilterOperator, OperatorHandler>;
    /**
     * Check if operator is supported
     */
    supports(name: FilterOperator): boolean;
    /**
     * Get list of all operator names
     */
    list(): FilterOperator[];
}
/**
 * Get or create singleton registry
 */
export declare function getOperatorRegistry(): OperatorRegistry;
/**
 * Create new registry instance (for testing)
 */
export declare function createOperatorRegistry(): OperatorRegistry;
/**
 * Reset singleton (for testing)
 */
export declare function resetOperatorRegistry(): void;
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
//# sourceMappingURL=mongoOperators.d.ts.map