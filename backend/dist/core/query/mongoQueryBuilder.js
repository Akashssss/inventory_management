"use strict";
/**
 * MONGO QUERY BUILDER
 * Builds complete MongoDB queries from QueryOptions
 * Handles filtering, sorting, field selection, pagination
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MongoQueryBuilder = void 0;
exports.createQueryBuilder = createQueryBuilder;
exports.isSensitiveField = isSensitiveField;
exports.filterFieldsByPermission = filterFieldsByPermission;
const mongoFilterBuilder_1 = require("./mongoFilterBuilder");
/**
 * Complete MongoDB query builder
 * Combines all aspects: filter, sort, fields, pagination
 */
class MongoQueryBuilder {
    constructor(validator, fieldSchema) {
        this.restrictedFields = [
            "__v",
            "password",
            "__proto__",
            "constructor",
        ]; // Default restricted fields
        this.maxComplexity = 100;
        this.filterBuilder = new mongoFilterBuilder_1.MongoFilterBuilder(validator);
        this.validator = validator;
        this.fieldSchema = fieldSchema;
    }
    /**
     * Build MongoDB filter from FilterNode
     */
    buildFilter(filter) {
        if (!filter)
            return {};
        return this.filterBuilder.build(filter);
    }
    /**
     * Build MongoDB sort specification
     *
     * @param sort - Array of sort specifications
     * @returns MongoDB sort object { field: 1 or -1 }
     */
    buildSort(sort) {
        const sortObj = {};
        if (!sort || sort.length === 0) {
            return sortObj;
        }
        for (const spec of sort) {
            // Validate field is sortable
            if (this.fieldSchema) {
                const fieldMeta = this.fieldSchema.find((f) => f.name === spec.field);
                if (!fieldMeta?.sortable) {
                    throw new Error(`Field "${spec.field}" is not sortable or not whitelisted`);
                }
            }
            sortObj[spec.field] = spec.order === "asc" ? 1 : -1;
        }
        return sortObj;
    }
    /**
     * Build field selection string
     * Used with Mongoose .select() method
     *
     * @param requestedFields - Fields to select
     * @returns Field selection string (space-separated)
     */
    buildFields(requestedFields) {
        if (!requestedFields || requestedFields.length === 0) {
            // Return all non-restricted fields
            const restricted = this.getRestrictedFields();
            return restricted.map((f) => `-${f}`).join(" ");
        }
        // Whitelist requested fields
        const safeFields = this.whitelistFields(requestedFields);
        return safeFields.join(" ");
    }
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
    build(options) {
        // Estimate complexity (optional)
        const totalQueryComplexity = this.validator
            ? this.validator.estimateComplexity(options)
            : undefined;
        if (totalQueryComplexity && totalQueryComplexity > this.maxComplexity) {
            throw new Error(`Query complexity (${totalQueryComplexity}) exceeds maximum allowed (${this.maxComplexity})`);
        }
        // Build components
        let filter = this.buildFilter(options.filter);
        // Add multi-tenant filter if tenantId provided
        if (options.tenantId) {
            filter = { $and: [filter, { tenantId: options.tenantId }] };
        }
        // Add soft delete filter if not including soft-deleted
        if (options.includeSoftDeleted !== true) {
            filter = {
                $and: [filter, { $or: [{ deletedAt: null }, { deletedAt: undefined }] }],
            };
        }
        const sort = options.sort && options.sort.length > 0 ? this.buildSort(options.sort) : undefined;
        const fields = this.buildFields(options.fields);
        // Pagination
        const page = Math.max(1, options.pagination?.page || 1);
        const limit = Math.min(options.pagination?.limit || 20, options.pagination?.maxLimit || 1000);
        const skip = (page - 1) * limit;
        return {
            filter,
            sort: Object.keys(sort || {}).length > 0 ? sort : undefined,
            fields: fields ? fields : undefined,
            skip,
            limit,
            totalQueryComplexity,
        };
    }
    /**
     * Whitelist fields for selection
     * Returns only fields that are selectable and not restricted
     *
     * @private
     */
    whitelistFields(requestedFields) {
        const restricted = this.getRestrictedFields();
        return requestedFields.filter((field) => {
            // Block restricted fields
            if (restricted.includes(field)) {
                throw new Error(`Field "${field}" cannot be selected (restricted)`);
            }
            // If schema exists, check if field is selectable
            if (this.fieldSchema) {
                const fieldMeta = this.fieldSchema.find((f) => f.name === field);
                if (!fieldMeta || fieldMeta.selectable === false) {
                    throw new Error(`Field "${field}" is not selectable or whitelisted`);
                }
            }
            return true;
        });
    }
    /**
     * Get list of restricted fields
     *
     * @private
     */
    getRestrictedFields() {
        return this.restrictedFields;
    }
    /**
     * Set custom restricted fields
     */
    setRestrictedFields(fields) {
        this.restrictedFields = fields;
    }
    /**
     * Set maximum query complexity
     */
    setMaxComplexity(complexity) {
        this.maxComplexity = complexity;
    }
    /**
     * Update field schema
     */
    updateFieldSchema(schema) {
        this.fieldSchema = schema;
    }
}
exports.MongoQueryBuilder = MongoQueryBuilder;
/**
 * FACTORY FUNCTION
 */
function createQueryBuilder(validator, fieldSchema) {
    return new MongoQueryBuilder(validator, fieldSchema);
}
/**
 * SECURITY HELPERS
 */
/**
 * Check if field is sensitive/restricted
 */
function isSensitiveField(fieldName, sensitiveFields = ["password", "token", "secret", "apiKey"]) {
    return sensitiveFields.some((sensitive) => fieldName.toLowerCase() === sensitive.toLowerCase());
}
/**
 * Sanitize fields selection based on RBAC permissions
 */
function filterFieldsByPermission(requestedFields, fieldSchema, userPermissions) {
    return requestedFields.filter((field) => {
        const fieldMeta = fieldSchema.find((f) => f.name === field);
        if (!fieldMeta)
            return false;
        // If field requires permission, check if user has it
        if (fieldMeta.requiredPermission) {
            return userPermissions.includes(fieldMeta.requiredPermission);
        }
        return true;
    });
}
//# sourceMappingURL=mongoQueryBuilder.js.map