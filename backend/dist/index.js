"use strict";
/**
 * SYSTEM INDEX & ENTRY POINT
 * Quick reference for all modules and components
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SoftDeleteException = exports.RateLimitException = exports.PermissionDeniedException = exports.ForbiddenException = exports.UnauthorizedException = exports.DuplicateKeyException = exports.ConflictException = exports.NotFoundException = exports.DatabaseException = exports.QueryComplexityException = exports.FieldNotSelectableException = exports.FieldNotFoundException = exports.OperatorNotFoundException = exports.FilterValidationException = exports.QueryValidationException = exports.ValidationException = exports.AppException = exports.applySecurityMiddleware = exports.requestIdMiddleware = exports.softDeleteMiddleware = exports.requirePermission = exports.authMiddleware = exports.tenantMiddleware = exports.createProductController = exports.ProductController = exports.resetProductRepository = exports.getProductRepository = exports.createProductRepository = exports.productFieldSchema = exports.ProductRepository = exports.createRepository = exports.BaseRepository = exports.Product = exports.resetQueryEngine = exports.getQueryEngine = exports.createQueryEngine = exports.MongoQueryEngine = exports.createQueryValidator = exports.QueryValidator = exports.filterFieldsByPermission = exports.isSensitiveField = exports.createQueryBuilder = exports.MongoQueryBuilder = exports.explainFilterTree = exports.createFilterBuilder = exports.MongoFilterBuilder = exports.resetOperatorRegistry = exports.createOperatorRegistry = exports.getOperatorRegistry = exports.OperatorRegistry = void 0;
exports.startServer = exports.createApp = exports.safeErrorHandler = exports.errorHandler = exports.toAppException = void 0;
// ============================================================================
// CORE QUERY ENGINE
// ============================================================================
var mongoOperators_1 = require("./core/operators/mongoOperators");
// Operator Registry
Object.defineProperty(exports, "OperatorRegistry", { enumerable: true, get: function () { return mongoOperators_1.OperatorRegistry; } });
Object.defineProperty(exports, "getOperatorRegistry", { enumerable: true, get: function () { return mongoOperators_1.getOperatorRegistry; } });
Object.defineProperty(exports, "createOperatorRegistry", { enumerable: true, get: function () { return mongoOperators_1.createOperatorRegistry; } });
Object.defineProperty(exports, "resetOperatorRegistry", { enumerable: true, get: function () { return mongoOperators_1.resetOperatorRegistry; } });
var mongoFilterBuilder_1 = require("./core/query/mongoFilterBuilder");
// Filter Builder
Object.defineProperty(exports, "MongoFilterBuilder", { enumerable: true, get: function () { return mongoFilterBuilder_1.MongoFilterBuilder; } });
Object.defineProperty(exports, "createFilterBuilder", { enumerable: true, get: function () { return mongoFilterBuilder_1.createFilterBuilder; } });
Object.defineProperty(exports, "explainFilterTree", { enumerable: true, get: function () { return mongoFilterBuilder_1.explainFilterTree; } });
var mongoQueryBuilder_1 = require("./core/query/mongoQueryBuilder");
// Query Builder
Object.defineProperty(exports, "MongoQueryBuilder", { enumerable: true, get: function () { return mongoQueryBuilder_1.MongoQueryBuilder; } });
Object.defineProperty(exports, "createQueryBuilder", { enumerable: true, get: function () { return mongoQueryBuilder_1.createQueryBuilder; } });
Object.defineProperty(exports, "isSensitiveField", { enumerable: true, get: function () { return mongoQueryBuilder_1.isSensitiveField; } });
Object.defineProperty(exports, "filterFieldsByPermission", { enumerable: true, get: function () { return mongoQueryBuilder_1.filterFieldsByPermission; } });
var queryValidator_1 = require("./core/query/queryValidator");
// Validator
Object.defineProperty(exports, "QueryValidator", { enumerable: true, get: function () { return queryValidator_1.QueryValidator; } });
Object.defineProperty(exports, "createQueryValidator", { enumerable: true, get: function () { return queryValidator_1.createQueryValidator; } });
var mongoQueryEngine_1 = require("./core/query/mongoQueryEngine");
// Query Engine
Object.defineProperty(exports, "MongoQueryEngine", { enumerable: true, get: function () { return mongoQueryEngine_1.MongoQueryEngine; } });
Object.defineProperty(exports, "createQueryEngine", { enumerable: true, get: function () { return mongoQueryEngine_1.createQueryEngine; } });
Object.defineProperty(exports, "getQueryEngine", { enumerable: true, get: function () { return mongoQueryEngine_1.getQueryEngine; } });
Object.defineProperty(exports, "resetQueryEngine", { enumerable: true, get: function () { return mongoQueryEngine_1.resetQueryEngine; } });
// ============================================================================
// MODELS
// ============================================================================
var Product_1 = require("./models/Product");
Object.defineProperty(exports, "Product", { enumerable: true, get: function () { return Product_1.Product; } });
// ============================================================================
// REPOSITORIES
// ============================================================================
var BaseRepository_1 = require("./repositories/BaseRepository");
Object.defineProperty(exports, "BaseRepository", { enumerable: true, get: function () { return BaseRepository_1.BaseRepository; } });
Object.defineProperty(exports, "createRepository", { enumerable: true, get: function () { return BaseRepository_1.createRepository; } });
var ProductRepository_1 = require("./repositories/ProductRepository");
Object.defineProperty(exports, "ProductRepository", { enumerable: true, get: function () { return ProductRepository_1.ProductRepository; } });
Object.defineProperty(exports, "productFieldSchema", { enumerable: true, get: function () { return ProductRepository_1.productFieldSchema; } });
Object.defineProperty(exports, "createProductRepository", { enumerable: true, get: function () { return ProductRepository_1.createProductRepository; } });
Object.defineProperty(exports, "getProductRepository", { enumerable: true, get: function () { return ProductRepository_1.getProductRepository; } });
Object.defineProperty(exports, "resetProductRepository", { enumerable: true, get: function () { return ProductRepository_1.resetProductRepository; } });
// ============================================================================
// CONTROLLERS
// ============================================================================
var ProductController_1 = require("./controllers/ProductController");
Object.defineProperty(exports, "ProductController", { enumerable: true, get: function () { return ProductController_1.ProductController; } });
Object.defineProperty(exports, "createProductController", { enumerable: true, get: function () { return ProductController_1.createProductController; } });
// ============================================================================
// MIDDLEWARE
// ============================================================================
var securityMiddleware_1 = require("./middleware/securityMiddleware");
Object.defineProperty(exports, "tenantMiddleware", { enumerable: true, get: function () { return securityMiddleware_1.tenantMiddleware; } });
Object.defineProperty(exports, "authMiddleware", { enumerable: true, get: function () { return securityMiddleware_1.authMiddleware; } });
Object.defineProperty(exports, "requirePermission", { enumerable: true, get: function () { return securityMiddleware_1.requirePermission; } });
Object.defineProperty(exports, "softDeleteMiddleware", { enumerable: true, get: function () { return securityMiddleware_1.softDeleteMiddleware; } });
Object.defineProperty(exports, "requestIdMiddleware", { enumerable: true, get: function () { return securityMiddleware_1.requestIdMiddleware; } });
Object.defineProperty(exports, "applySecurityMiddleware", { enumerable: true, get: function () { return securityMiddleware_1.applySecurityMiddleware; } });
// ============================================================================
// EXCEPTIONS
// ============================================================================
var AppException_1 = require("./exceptions/AppException");
// Base
Object.defineProperty(exports, "AppException", { enumerable: true, get: function () { return AppException_1.AppException; } });
// Validation
Object.defineProperty(exports, "ValidationException", { enumerable: true, get: function () { return AppException_1.ValidationException; } });
Object.defineProperty(exports, "QueryValidationException", { enumerable: true, get: function () { return AppException_1.QueryValidationException; } });
Object.defineProperty(exports, "FilterValidationException", { enumerable: true, get: function () { return AppException_1.FilterValidationException; } });
Object.defineProperty(exports, "OperatorNotFoundException", { enumerable: true, get: function () { return AppException_1.OperatorNotFoundException; } });
Object.defineProperty(exports, "FieldNotFoundException", { enumerable: true, get: function () { return AppException_1.FieldNotFoundException; } });
Object.defineProperty(exports, "FieldNotSelectableException", { enumerable: true, get: function () { return AppException_1.FieldNotSelectableException; } });
Object.defineProperty(exports, "QueryComplexityException", { enumerable: true, get: function () { return AppException_1.QueryComplexityException; } });
// Data
Object.defineProperty(exports, "DatabaseException", { enumerable: true, get: function () { return AppException_1.DatabaseException; } });
Object.defineProperty(exports, "NotFoundException", { enumerable: true, get: function () { return AppException_1.NotFoundException; } });
Object.defineProperty(exports, "ConflictException", { enumerable: true, get: function () { return AppException_1.ConflictException; } });
Object.defineProperty(exports, "DuplicateKeyException", { enumerable: true, get: function () { return AppException_1.DuplicateKeyException; } });
// Auth
Object.defineProperty(exports, "UnauthorizedException", { enumerable: true, get: function () { return AppException_1.UnauthorizedException; } });
Object.defineProperty(exports, "ForbiddenException", { enumerable: true, get: function () { return AppException_1.ForbiddenException; } });
Object.defineProperty(exports, "PermissionDeniedException", { enumerable: true, get: function () { return AppException_1.PermissionDeniedException; } });
// Rate limiting
Object.defineProperty(exports, "RateLimitException", { enumerable: true, get: function () { return AppException_1.RateLimitException; } });
// Soft deletes
Object.defineProperty(exports, "SoftDeleteException", { enumerable: true, get: function () { return AppException_1.SoftDeleteException; } });
// Error handling
Object.defineProperty(exports, "toAppException", { enumerable: true, get: function () { return AppException_1.toAppException; } });
Object.defineProperty(exports, "errorHandler", { enumerable: true, get: function () { return AppException_1.errorHandler; } });
Object.defineProperty(exports, "safeErrorHandler", { enumerable: true, get: function () { return AppException_1.safeErrorHandler; } });
// ============================================================================
// APPLICATION
// ============================================================================
var app_1 = require("./app");
Object.defineProperty(exports, "createApp", { enumerable: true, get: function () { return app_1.createApp; } });
Object.defineProperty(exports, "startServer", { enumerable: true, get: function () { return app_1.startServer; } });
//# sourceMappingURL=index.js.map