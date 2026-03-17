/**
 * QUERY VALIDATOR
 * Validates QueryOptions against field schema before execution
 * Prevents expensive/malicious queries at the source
 */
import { QueryOptions, SortSpec, FilterNode, FieldMetadata, IQueryValidator } from "../../types/query.types";
/**
 * Query validator implementation
 * Checks filters, sorts, fields, and query complexity
 */
export declare class QueryValidator implements IQueryValidator {
    private registry;
    private maxFilterDepth;
    private maxConditionsPerNode;
    constructor(maxFilterDepth?: number, maxConditionsPerNode?: number);
    /**
     * Validate entire query filter tree
     * Checks:
     * - Field names exist in schema
     * - Operators are supported
     * - Values are appropriate types
     * - Tree depth is reasonable
     * - No excessive conditions
     */
    validateFilter(filter: FilterNode | undefined, schema: FieldMetadata[]): void;
    /**
     * Validate individual filter node (recursive)
     *
     * @private
     */
    private validateFilterNode;
    /**
     * Validate a leaf condition (field + operator + value)
     *
     * @private
     */
    private validateLeafCondition;
    /**
     * Validate value is appropriate for operator and field type
     *
     * @private
     */
    private validateOperatorValue;
    /**
     * Validate numeric value
     *
     * @private
     */
    private validateNumberOperatorValue;
    /**
     * Validate date value
     *
     * @private
     */
    private validateDateOperatorValue;
    /**
     * Validate string value
     *
     * @private
     */
    private validateStringOperatorValue;
    /**
     * Validate boolean value
     *
     * @private
     */
    private validateBooleanOperatorValue;
    /**
     * Validate array value
     *
     * @private
     */
    private validateArrayOperatorValue;
    /**
     * Validate sort specification
     */
    validateSort(sort: SortSpec[] | undefined, schema: FieldMetadata[]): void;
    /**
     * Validate field selection
     */
    validateFields(fields: string[] | undefined, schema: FieldMetadata[]): void;
    /**
     * Estimate query complexity score
     * Higher scores = more expensive queries
     * Used to prevent DOS attacks
     */
    estimateComplexity(options: QueryOptions): number;
    /**
     * Estimate filter complexity (helper)
     *
     * @private
     */
    private estimateFilterComplexity;
    /**
     * Set maximum nesting depth
     */
    setMaxFilterDepth(depth: number): void;
    /**
     * Set maximum conditions per node
     */
    setMaxConditionsPerNode(count: number): void;
}
/**
 * FACTORY FUNCTION
 */
export declare function createQueryValidator(maxFilterDepth?: number, maxConditionsPerNode?: number): QueryValidator;
//# sourceMappingURL=queryValidator.d.ts.map