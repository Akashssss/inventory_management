/**
 * SYSTEM INDEX & ENTRY POINT
 * Quick reference for all modules and components
 */

// ============================================================================
// CORE QUERY ENGINE
// ============================================================================

export {
  // Operator Registry
  OperatorRegistry,
  getOperatorRegistry,
  createOperatorRegistry,
  resetOperatorRegistry,
} from "./core/operators/mongoOperators";

export {
  // Filter Builder
  MongoFilterBuilder,
  createFilterBuilder,
  explainFilterTree,
} from "./core/query/mongoFilterBuilder";

export {
  // Query Builder
  MongoQueryBuilder,
  createQueryBuilder,
  isSensitiveField,
  filterFieldsByPermission,
} from "./core/query/mongoQueryBuilder";

export {
  // Validator
  QueryValidator,
  createQueryValidator,
} from "./core/query/queryValidator";

export {
  // Query Engine
  MongoQueryEngine,
  createQueryEngine,
  getQueryEngine,
  resetQueryEngine,
} from "./core/query/mongoQueryEngine";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type {
  // Filter & Operators
  FilterNode,
  FilterOperator,
  LogicalOperator,
  SortOrder,
  MongoFilterQuery,
  OperatorHandler,
  RegisteredOperator,
  IOperatorRegistry,
  // Query
  QueryOptions,
  QueryResult,
  QueryError,
  // Sorting & Pagination
  SortSpec,
  PaginationParams,
  PaginationMetadata,
  CursorPaginationParams,
  CursorPaginationMetadata,
  // Field Metadata
  FieldMetadata,
  // Request Context
  RequestContext,
  // Base Entity
  BaseEntity,
  // Repository
  IRepository,
  // Validators & Builders
  IQueryValidator,
  IQueryBuilder,
  IQueryEngine,
} from "./types/query.types";

// ============================================================================
// MODELS
// ============================================================================

export { Product } from "./models/Product";
export type { IProduct, ProductModel } from "./models/Product";

// ============================================================================
// REPOSITORIES
// ============================================================================

export { BaseRepository, createRepository } from "./repositories/BaseRepository";

export {
  ProductRepository,
  productFieldSchema,
  createProductRepository,
  getProductRepository,
  resetProductRepository,
} from "./repositories/ProductRepository";

// ============================================================================
// CONTROLLERS
// ============================================================================

export {
  ProductController,
  createProductController,
} from "./controllers/ProductController";

// ============================================================================
// MIDDLEWARE
// ============================================================================

export {
  tenantMiddleware,
  authMiddleware,
  requirePermission,
  softDeleteMiddleware,
  requestIdMiddleware,
  applySecurityMiddleware,
} from "./middleware/securityMiddleware";

// ============================================================================
// EXCEPTIONS
// ============================================================================

export {
  // Base
  AppException,
  // Validation
  ValidationException,
  QueryValidationException,
  FilterValidationException,
  OperatorNotFoundException,
  FieldNotFoundException,
  FieldNotSelectableException,
  QueryComplexityException,
  // Data
  DatabaseException,
  NotFoundException,
  ConflictException,
  DuplicateKeyException,
  // Auth
  UnauthorizedException,
  ForbiddenException,
  PermissionDeniedException,
  // Rate limiting
  RateLimitException,
  // Soft deletes
  SoftDeleteException,
  // Error handling
  toAppException,
  errorHandler,
  safeErrorHandler,
} from "./exceptions/AppException";

// ============================================================================
// APPLICATION
// ============================================================================

export { createApp, startServer } from "./app";

// ============================================================================
// QUICK START GUIDE
// ============================================================================

/**
 * USAGE EXAMPLE
 *
 * import {
 *   createQueryEngine,
 *   ProductRepository,
 *   ProductController,
 *   applySecurityMiddleware,
 *   errorHandler,
 * } from "@/index";
 * import express from "express";
 *
 * // Create express app
 * const app = express();
 * app.use(express.json());
 *
 * // Setup security
 * applySecurityMiddleware(app);
 *
 * // Initialize query engine
 * const queryEngine = createQueryEngine(true, false);
 *
 * // Create repository
 * const productRepo = new ProductRepository(queryEngine);
 *
 * // Create controller
 * const productCtrl = new ProductController(productRepo);
 *
 * // Setup routes
 * app.post("/api/products", (req, res, next) =>
 *   productCtrl.getProducts(req, res, next)
 * );
 *
 * // Error handling
 * app.use(errorHandler);
 *
 * // Start
 * app.listen(3000, () => console.log("Server running on port 3000"));
 */

// ============================================================================
// EXAMPLE QUERIES
// ============================================================================

/**
 * SIMPLE FILTER
 *
 * const result = await productRepo.find({
 *   filter: {
 *     field: "status",
 *     operator: "eq",
 *     value: "active",
 *   },
 *   pagination: { page: 1, limit: 20 },
 * });
 */

/**
 * PRICE RANGE
 *
 * const result = await productRepo.find({
 *   filter: {
 *     field: "price",
 *     operator: "between",
 *     value: [100, 500],
 *   },
 *   sort: [{ field: "price", order: "asc" }],
 * });
 */

/**
 * COMPLEX NESTED FILTER
 *
 * const result = await productRepo.find({
 *   filter: {
 *     logic: "and",
 *     conditions: [
 *       { field: "category", operator: "eq", value: "electronics" },
 *       { field: "price", operator: "gte", value: 100 },
 *       {
 *         logic: "or",
 *         conditions: [
 *           { field: "stock", operator: "lt", value: 5 },
 *           { field: "status", operator: "eq", value: "discontinued" }
 *         ]
 *       }
 *     ]
 *   },
 *   sort: [{ field: "price", order: "asc" }],
 *   pagination: { page: 1, limit: 20 },
 * });
 */

/**
 * SEARCH + FILTER + SORT + PAGINATION
 *
 * const result = await productRepo.find({
 *   filter: {
 *     field: "status",
 *     operator: "eq",
 *     value: "active",
 *   },
 *   search: "gaming laptop",
 *   searchFields: ["name", "description"],
 *   sort: [
 *     { field: "createdAt", order: "desc" },
 *     { field: "price", order: "asc" }
 *   ],
 *   pagination: { page: 1, limit: 20 },
 *   fields: ["_id", "name", "price", "stock"],
 *   tenantId: "tenant-123",
 * });
 */

// ============================================================================
// DOCUMENTATION REFERENCES
// ============================================================================

/**
 * DOCUMENTATION FILES (in src/):
 *
 * README.md                          - Project overview & quick start
 * QUERY_ENGINE_DOCUMENTATION.md      - Complete reference & guide
 * INTEGRATION_GUIDE.md               - Setup & integration patterns
 * FILE_MANIFEST.md                   - Complete file listing
 * examples/requestExamples.ts        - Real-world request examples
 *
 * START HERE:
 * 1. Read README.md for overview
 * 2. Follow INTEGRATION_GUIDE.md for setup
 * 3. Check requestExamples.ts for API examples
 * 4. Reference QUERY_ENGINE_DOCUMENTATION.md for details
 */

// ============================================================================
// SUPPORTED OPERATORS (23 Total)
// ============================================================================

/**
 * COMPARISON (6)
 * eq, ne, lt, lte, gt, gte
 *
 * RANGE (1)
 * between
 *
 * ARRAY/SET (2)
 * in, notIn
 *
 * TEXT/STRING (5)
 * contains, notContains, startsWith, endsWith, regex
 *
 * EXISTENCE (2)
 * isEmpty, isNotEmpty
 *
 * DATE (4)
 * dateIsBefore, dateIsAfter, dateIsBetween, isRelativeToToday
 *
 * LOGICAL (1 - for grouping)
 * and, or (in filter node structure)
 *
 * TOTAL: 23 operators
 */

// ============================================================================
// KEY FEATURES
// ============================================================================

/**
 * ✅ Advanced Filtering
 *    - Recursive nested AND/OR conditions
 *    - 23 operators with type-aware validation
 *    - Extensible operator registry
 *
 * ✅ Full-Text Search
 *    - Multi-field search
 *    - Case-insensitive
 *    - Combined with filters
 *
 * ✅ Sorting & Pagination
 *    - Multi-column sorting
 *    - Safe pagination with limits
 *    - Metadata (total, totalPages, hasNextPage, etc.)
 *    - Ready for cursor pagination
 *
 * ✅ Field Selection
 *    - Select specific fields
 *    - Whitelist-based security
 *    - RBAC-aware field access
 *
 * ✅ Security & Enterprise
 *    - Multi-tenancy with auto-injection
 *    - Soft deletes by default
 *    - Role-based access control (RBAC)
 *    - Query complexity protection
 *    - Field validation
 *    - Safe error handling
 *
 * ✅ Architecture
 *    - Clean separation of concerns
 *    - Repository pattern
 *    - Dependency injection
 *    - Factory functions
 *    - 100% TypeScript
 *
 * ✅ Extensibility
 *    - Custom operators
 *    - Custom validators
 *    - Domain-specific repositories
 *    - Aggregation pipeline ready
 *    - PostgreSQL-ready architecture
 */

// ============================================================================
// QUICK API REFERENCE
// ============================================================================

/**
 * QUERY ENGINE
 * const engine = createQueryEngine(enableValidation, enableLogging);
 * engine.execute(Model, options): Promise<QueryResult>
 * engine.registerOperator(operator)
 * engine.registerFieldSchema(modelName, schema)
 * engine.setMaxQueryComplexity(number)
 * engine.setQueryLogging(boolean)
 *
 * REPOSITORY
 * repo.find(options): Promise<QueryResult>
 * repo.findById(id): Promise<Entity | null>
 * repo.create(data): Promise<Entity>
 * repo.update(id, data): Promise<Entity>
 * repo.delete(id): Promise<void>
 * repo.softDelete(id): Promise<void>
 * repo.restore(id): Promise<void>
 * repo.count(filter): Promise<number>
 * repo.exists(id): Promise<boolean>
 * repo.bulkWrite(operations): Promise<any>
 *
 * CONTROLLER (Express)
 * controller.getProducts(req, res, next)
 * controller.getProductById(req, res, next)
 * controller.createProduct(req, res, next)
 * controller.updateProduct(req, res, next)
 * controller.deleteProduct(req, res, next)
 * controller.restoreProduct(req, res, next)
 * controller.searchProducts(req, res, next)
 * controller.getByCategory(req, res, next)
 * controller.getLowStock(req, res, next)
 * controller.advancedSearch(req, res, next)
 *
 * MIDDLEWARE
 * tenantMiddleware(req, res, next)
 * authMiddleware(req, res, next)
 * requirePermission(permission)(req, res, next)
 * softDeleteMiddleware(req, res, next)
 * requestIdMiddleware(req, res, next)
 * applySecurityMiddleware(app)
 *
 * ERROR HANDLING
 * toAppException(error): AppException
 * errorHandler(error, req, res, next)
 * safeErrorHandler(error, req, res, isDevelopment)
 */

// ============================================================================
// DEPLOYMENT CHECKLIST
// ============================================================================

/**
 * □ Install dependencies (express, mongoose, typescript)
 * □ Setup MongoDB connection
 * □ Configure environment variables
 * □ Add indexes to database collections
 * □ Setup JWT authentication
 * □ Configure CORS if needed
 * □ Enable query logging in development
 * □ Setup error handling middleware
 * □ Configure rate limiting
 * □ Document field schemas
 * □ Test all CRUD operations
 * □ Test complex queries
 * □ Test error cases
 * □ Setup monitoring
 * □ Configure backups
 * □ Deploy to production
 */

export {};
