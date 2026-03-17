/**
 * MONGO QUERY BUILDER
 * Builds complete MongoDB queries from QueryOptions
 * Handles filtering, sorting, field selection, pagination
 */
import { QueryOptions, SortSpec, MongoFilterQuery, FieldMetadata, IQueryValidator, IQueryBuilder } from "../../types/query.types";
/**
 * Complete MongoDB query builder
 * Combines all aspects: filter, sort, fields, pagination
 */
export declare class MongoQueryBuilder implements IQueryBuilder {
    private filterBuilder;
    private validator?;
    private fieldSchema?;
    private restrictedFields;
    private maxComplexity;
    constructor(validator?: IQueryValidator, fieldSchema?: FieldMetadata[]);
    /**
     * Build MongoDB filter from FilterNode
     */
    buildFilter(filter?: any): MongoFilterQuery;
    /**
     * Build MongoDB sort specification
     *
     * @param sort - Array of sort specifications
     * @returns MongoDB sort object { field: 1 or -1 }
     */
    buildSort(sort?: SortSpec[]): Record<string, 1 | -1>;
    /**
     * Build field selection string
     * Used with Mongoose .select() method
     *
     * @param requestedFields - Fields to select
     * @returns Field selection string (space-separated)
     */
    buildFields(requestedFields?: string[]): string;
    /**
     * Build complete MongoDB query parameters
     *
     * @example
     * const query = builder.build({
     *   filter: { field: "price", operator: "gte", value: 100 },
     *   sort: [{ field: "createdAt", order: "desc" }],
     *   pagination: { page: 1, limit: 20 },
     *   fields: ["name", "price"]
     * });
     *
     * // Usage:
     * await Model.find(query.filter)
     *   .sort(query.sort)
     *   .select(query.fields)
     *   .skip(query.skip)
     *   .limit(query.limit);
     */
    build(options: QueryOptions): {
        filter: MongoFilterQuery;
        sort?: Record<string, 1 | -1>;
        fields?: string;
        skip: number;
        limit: number;
        totalQueryComplexity?: number;
    };
    /**
     * Whitelist fields for selection
     * Returns only fields that are selectable and not restricted
     *
     * @private
     */
    private whitelistFields;
    /**
     * Get list of restricted fields
     *
     * @private
     */
    private getRestrictedFields;
    /**
     * Set custom restricted fields
     */
    setRestrictedFields(fields: string[]): void;
    /**
     * Set maximum query complexity
     */
    setMaxComplexity(complexity: number): void;
    /**
     * Update field schema
     */
    updateFieldSchema(schema: FieldMetadata[]): void;
}
/**
 * FACTORY FUNCTION
 */
export declare function createQueryBuilder(validator?: IQueryValidator, fieldSchema?: FieldMetadata[]): MongoQueryBuilder;
/**
 * SECURITY HELPERS
 */
/**
 * Check if field is sensitive/restricted
 */
export declare function isSensitiveField(fieldName: string, sensitiveFields?: string[]): boolean;
/**
 * Sanitize fields selection based on RBAC permissions
 */
export declare function filterFieldsByPermission(requestedFields: string[], fieldSchema: FieldMetadata[], userPermissions: string[]): string[];
//# sourceMappingURL=mongoQueryBuilder.d.ts.map