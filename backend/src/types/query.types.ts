/**
 * QUERY ENGINE TYPE DEFINITIONS
 * Core interfaces for the enterprise-grade query system
 */

// ============================================================================
// FILTER NODE & OPERATORS
// ============================================================================

/**
 * Filter operator type
 * Supports: comparison, logical, text, array, date operations
 */
export type FilterOperator =
  | "eq"
  | "ne"
  | "lt"
  | "lte"
  | "gt"
  | "gte"
  | "in"
  | "notIn"
  | "between"
  | "contains"
  | "notContains"
  | "startsWith"
  | "endsWith"
  | "regex"
  | "isEmpty"
  | "isNotEmpty"
  | "isRelativeToToday"
  | "dateIsBefore"
  | "dateIsAfter"
  | "dateIsBetween";

/**
 * Logical operator for combining conditions
 */
export type LogicalOperator = "and" | "or";

/**
 * Sort direction
 */
export type SortOrder = "asc" | "desc";

/**
 * Recursive filter node structure
 * Supports infinite nesting for complex boolean logic
 *
 * @example
 * {
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
 * }
 */
export interface FilterNode {
  /**
   * Logical operator: "and" or "or"
   * Required if conditions array is present
   */
  logic?: LogicalOperator;

  /**
   * Child filter nodes (supports recursive nesting)
   * Required if logic is specified
   */
  conditions?: FilterNode[];

  /**
   * Field name to filter on
   * Required for leaf conditions
   */
  field?: string;

  /**
   * Operator to apply (eq, lt, contains, etc.)
   * Required for leaf conditions
   */
  operator?: FilterOperator;

  /**
   * Value(s) for the operator
   * For "between": value should be [min, max]
   * For "in"/"notIn": value should be an array
   */
  value?: any;
}

// ============================================================================
// SORTING & PAGINATION
// ============================================================================

/**
 * Sort specification for multi-column sorting
 */
export interface SortSpec {
  /**
   * Field name to sort by
   */
  field: string;

  /**
   * Sort direction
   */
  order: SortOrder;
}

/**
 * Pagination parameters
 */
export interface PaginationParams {
  /**
   * Page number (1-indexed)
   * @default 1
   */
  page?: number;

  /**
   * Items per page
   * @default 20
   */
  limit?: number;

  /**
   * Maximum allowed limit (security)
   * @default 1000
   */
  maxLimit?: number;
}

/**
 * Cursor pagination (future support)
 */
export interface CursorPaginationParams {
  /**
   * Cursor position
   */
  cursor?: string;

  /**
   * Items to fetch
   * @default 20
   */
  limit?: number;

  /**
   * Maximum allowed limit
   * @default 100
   */
  maxLimit?: number;
}

/**
 * Pagination metadata in response
 */
export interface PaginationMetadata {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

/**
 * Cursor pagination metadata (future)
 */
export interface CursorPaginationMetadata {
  nextCursor?: string;
  isLastPage: boolean;
  totalCount?: number;
}

// ============================================================================
// QUERY OPTIONS & EXECUTION
// ============================================================================

/**
 * Complete query execution options
 * Combines filtering, searching, sorting, pagination, field selection
 */
export interface QueryOptions {
  /**
   * Filter tree for advanced filtering
   */
  filter?: FilterNode;

  /**
   * Full-text search string
   */
  search?: string;

  /**
   * Fields to include in full-text search
   */
  searchFields?: string[];

  /**
   * Multi-column sorting
   */
  sort?: SortSpec[];

  /**
   * Pagination parameters
   */
  pagination?: PaginationParams;

  /**
   * Specific fields to select
   * If not specified, returns all fields
   */
  fields?: string[];

  /**
   * Fields that should never be selected (blacklist)
   */
  restrictedFields?: string[];

  /**
   * Tenant ID for multi-tenant filtering (will be auto-injected)
   */
  tenantId?: string;

  /**
   * Include soft-deleted records
   * @default false
   */
  includeSoftDeleted?: boolean;

  /**
   * RBAC permissions for field access
   */
  permissions?: string[];

  /**
   * Additional context for custom filters (extensibility)
   */
  context?: Record<string, any>;
}

/**
 * Query result with pagination metadata
 */
export interface QueryResult<T> {
  /**
   * Result data
   */
  data: T[];

  /**
   * Pagination metadata
   */
  pagination: PaginationMetadata;

  /**
   * Additional metadata
   */
  meta?: {
    executionTime?: number;
    queryHash?: string;
    cacheHit?: boolean;
  };
}

// ============================================================================
// OPERATOR REGISTRY
// ============================================================================

/**
 * Type for MongoDB filter query
 */
export type MongoFilterQuery = Record<string, any>;

/**
 * Handler function for a single operator
 * Returns MongoDB filter query fragment
 */
export type OperatorHandler = (
  field: string,
  value: any
) => MongoFilterQuery;

/**
 * Registered operator
 */
export interface RegisteredOperator {
  name: FilterOperator;
  handler: OperatorHandler;
  supportedTypes?: string[];
  description?: string;
}

/**
 * Operator registry
 */
export interface IOperatorRegistry {
  register(operator: RegisteredOperator): void;
  get(name: FilterOperator): OperatorHandler | undefined;
  getAll(): Map<FilterOperator, OperatorHandler>;
  supports(name: FilterOperator): boolean;
}

// ============================================================================
// QUERY BUILDER & VALIDATOR
// ============================================================================

/**
 * Field metadata for validation & security
 */
export interface FieldMetadata {
  /**
   * Field name
   */
  name: string;

  /**
   * Data type
   */
  type: "string" | "number" | "boolean" | "date" | "array" | "object";

  /**
   * Can this field be filtered
   */
  filterable?: boolean;

  /**
   * Can this field be searched
   */
  searchable?: boolean;

  /**
   * Can this field be sorted
   */
  sortable?: boolean;

  /**
   * Can this field be selected
   */
  selectable?: boolean;

  /**
   * Supported operators for this field
   */
  supportedOperators?: FilterOperator[];

  /**
   * Is this a sensitive field
   */
  sensitive?: boolean;

  /**
   * Requires specific permission
   */
  requiredPermission?: string;

  /**
   * Max query complexity for this field
   */
  maxComplexity?: number;

  /**
   * Index hint for MongoDB
   */
  indexed?: boolean;
}

/**
 * Query validator interface
 */
export interface IQueryValidator {
  /**
   * Validate filter tree against field schema
   */
  validateFilter(filter: FilterNode, schema: FieldMetadata[]): void;

  /**
   * Validate sort specification
   */
  validateSort(sort: SortSpec[], schema: FieldMetadata[]): void;

  /**
   * Validate field selection
   */
  validateFields(fields: string[], schema: FieldMetadata[]): void;

  /**
   * Estimate query complexity
   */
  estimateComplexity(options: QueryOptions): number;
}

/**
 * Query builder interface
 */
export interface IQueryBuilder {
  /**
   * Build MongoDB filter from filter tree
   */
  buildFilter(filter?: FilterNode): MongoFilterQuery;

  /**
   * Build sort object
   */
  buildSort(sort?: SortSpec[]): Record<string, 1 | -1>;

  /**
   * Build field selection
   */
  buildFields(fields?: string[]): string;

  /**
   * Build complete MongoDB query
   */
  build(options: QueryOptions): {
    filter: MongoFilterQuery;
    sort?: Record<string, 1 | -1>;
    fields?: string;
    skip: number;
    limit: number;
  };
}

// ============================================================================
// MIDDLEWARE & CONTEXT
// ============================================================================

/**
 * Request context injected by middleware
 */
export interface RequestContext {
  /**
   * Current tenant ID
   */
  tenantId?: string;

  /**
   * Current user ID
   */
  userId?: string;

  /**
   * Current user object
   */
  user?: any;

  /**
   * User roles for RBAC
   */
  roles?: string[];

  /**
   * User permissions
   */
  permissions?: string[];

  /**
   * Request ID for tracing
   */
  requestId?: string;

  /**
   * Whether to include soft-deleted records
   */
  includeSoftDeleted?: boolean;

  /**
   * Additional metadata
   */
  metadata?: Record<string, any>;
}

// ============================================================================
// ERRORS
// ============================================================================

/**
 * Query execution error details
 */
export interface QueryError {
  code: string;
  message: string;
  field?: string;
  operator?: string;
  details?: Record<string, any>;
}

// ============================================================================
// REPOSITORY PATTERN
// ============================================================================

/**
 * Base entity interface
 */
export interface BaseEntity {
  _id?: string | any;
  tenantId?: string;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}

/**
 * Repository interface for CRUD + advanced queries
 */
export interface IRepository<T extends BaseEntity> {
  /**
   * Find with advanced query
   */
  find(options: QueryOptions): Promise<QueryResult<T>>;

  /**
   * Find by ID
   */
  findById(id: string): Promise<T | null>;

  /**
   * Create entity
   */
  create(data: Partial<T>): Promise<T>;

  /**
   * Update entity
   */
  update(id: string, data: Partial<T>): Promise<T>;

  /**
   * Delete entity
   */
  delete(id: string): Promise<void>;

  /**
   * Soft delete entity
   */
  softDelete(id: string): Promise<void>;

  /**
   * Restore soft-deleted entity
   */
  restore(id: string): Promise<void>;

  /**
   * Bulk operations
   */
  bulkWrite(operations: any[]): Promise<any>;

  /**
   * Count matching records
   */
  count(filter?: FilterNode): Promise<number>;

  /**
   * Check if document exists
   */
  exists(id: string): Promise<boolean>;
}

// ============================================================================
// QUERY ENGINE
// ============================================================================

/**
 * Main query engine interface
 */
export interface IQueryEngine {
  /**
   * Execute query
   */
  execute<T>(model: any, options: QueryOptions): Promise<QueryResult<T>>;

  /**
   * Register custom operator
   */
  registerOperator(operator: RegisteredOperator): void;

  /**
   * Register field schema
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
}
