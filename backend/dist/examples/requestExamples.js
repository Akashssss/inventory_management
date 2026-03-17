"use strict";
/**
 * PRODUCTION API EXAMPLES
 * Real-world request/response examples for the query engine
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.curl3SearchWithFilter = exports.curl2ComplexFilter = exports.curl1SimpleFilter = exports.example13ErrorPermissionDenied = exports.example13ErrorTooComplex = exports.example13ErrorInvalidOperator = exports.example13ErrorInvalidField = exports.example12RealWorld = exports.example11Pagination = exports.example10FieldSelection = exports.example9EmptyChecks = exports.example8RelativeDates = exports.example7ArrayOperations = exports.example6TextMatching = exports.example5DateRange = exports.example4SearchWithFilter = exports.example3ComplexNested = exports.example2PriceRange = exports.example1Response = exports.example1SimpleFilter = void 0;
// ============================================================================
// EXAMPLE 1: SIMPLE FILTERED SEARCH
// ============================================================================
/**
 * Request: GET /products?page=1&limit=20
 * Body:
 */
exports.example1SimpleFilter = {
    filter: {
        field: "status",
        operator: "eq",
        value: "active",
    },
};
/**
 * Response:
 */
exports.example1Response = {
    success: true,
    data: [
        {
            _id: "507f1f77bcf86cd799439011",
            tenantId: "tenant-123",
            sku: "LAPTOP-001",
            name: "Dell XPS 13",
            category: "electronics",
            price: 999.99,
            stock: 25,
            status: "active",
            createdAt: "2024-01-15T10:30:00Z",
            updatedAt: "2024-02-10T14:20:00Z",
        },
        // ... more products
    ],
    pagination: {
        page: 1,
        limit: 20,
        total: 150,
        totalPages: 8,
        hasNextPage: true,
        hasPreviousPage: false,
    },
    meta: {
        executionTime: 45,
        queryHash: "a1b2c3d4e5f6",
        cacheHit: false,
    },
};
// ============================================================================
// EXAMPLE 2: PRICE RANGE FILTER
// ============================================================================
/**
 * Find products priced between $500-$1500
 * Request: POST /products
 * Body:
 */
exports.example2PriceRange = {
    filter: {
        field: "price",
        operator: "between",
        value: [500, 1500],
    },
    sort: [
        {
            field: "price",
            order: "asc",
        },
    ],
    pagination: {
        page: 1,
        limit: 10,
    },
    fields: ["sku", "name", "price", "stock"],
};
// ============================================================================
// EXAMPLE 3: COMPLEX NESTED FILTER (AND/OR)
// ============================================================================
/**
 * Find electronics products that are either:
 * 1. In stock with price >= $100, OR
 * 2. Discontinued but on sale (cost > 50% of price)
 *
 * Request: POST /products
 * Body:
 */
exports.example3ComplexNested = {
    filter: {
        logic: "and",
        conditions: [
            {
                field: "category",
                operator: "eq",
                value: "electronics",
            },
            {
                logic: "or",
                conditions: [
                    {
                        logic: "and",
                        conditions: [
                            {
                                field: "stock",
                                operator: "gt",
                                value: 0,
                            },
                            {
                                field: "price",
                                operator: "gte",
                                value: 100,
                            },
                        ],
                    },
                    {
                        logic: "and",
                        conditions: [
                            {
                                field: "status",
                                operator: "eq",
                                value: "discontinued",
                            },
                            {
                                field: "price",
                                operator: "lt",
                                value: 50,
                            },
                        ],
                    },
                ],
            },
        ],
    },
    sort: [
        {
            field: "price",
            order: "desc",
        },
        {
            field: "stock",
            order: "asc",
        },
    ],
    pagination: {
        page: 1,
        limit: 25,
    },
};
/**
 * Mongo Query Generated:
 * {
 *   $and: [
 *     { category: "electronics" },
 *     {
 *       $or: [
 *         {
 *           $and: [
 *             { stock: { $gt: 0 } },
 *             { price: { $gte: 100 } }
 *           ]
 *         },
 *         {
 *           $and: [
 *             { status: "discontinued" },
 *             { price: { $lt: 50 } }
 *           ]
 *         }
 *       ]
 *     }
 *   ]
 * }
 */
// ============================================================================
// EXAMPLE 4: FULL-TEXT SEARCH WITH FILTERS
// ============================================================================
/**
 * Search for "gaming laptop" in electronics category
 * Request: POST /products
 * Body:
 */
exports.example4SearchWithFilter = {
    filter: {
        logic: "and",
        conditions: [
            {
                field: "category",
                operator: "in",
                value: ["electronics", "computers"],
            },
            {
                field: "stock",
                operator: "gt",
                value: 0,
            },
        ],
    },
    search: "gaming laptop",
    searchFields: ["name", "description", "sku"],
    sort: [
        {
            field: "createdAt",
            order: "desc",
        },
    ],
    pagination: {
        page: 1,
        limit: 20,
    },
    fields: ["sku", "name", "price", "stock", "category"],
};
// ============================================================================
// EXAMPLE 5: DATE RANGE FILTERING
// ============================================================================
/**
 * Find recently added products (last 30 days) with low stock
 * Request: POST /products
 * Body:
 */
exports.example5DateRange = {
    filter: {
        logic: "and",
        conditions: [
            {
                field: "createdAt",
                operator: "dateIsBetween",
                value: ["2024-01-10", "2024-02-10"],
            },
            {
                field: "stock",
                operator: "between",
                value: [1, 10],
            },
        ],
    },
    sort: [
        {
            field: "createdAt",
            order: "desc",
        },
    ],
    pagination: {
        page: 1,
        limit: 50,
    },
};
// ============================================================================
// EXAMPLE 6: TEXT MATCHING OPERATORS
// ============================================================================
/**
 * Find SKUs starting with "LAPTOP" and names not containing "used"
 * Request: POST /products
 * Body:
 */
exports.example6TextMatching = {
    filter: {
        logic: "and",
        conditions: [
            {
                field: "sku",
                operator: "startsWith",
                value: "LAPTOP",
            },
            {
                field: "name",
                operator: "notContains",
                value: "used",
            },
        ],
    },
    pagination: {
        page: 1,
        limit: 20,
    },
};
// ============================================================================
// EXAMPLE 7: ARRAY/SET OPERATIONS
// ============================================================================
/**
 * Find products with specific tags and exclude certain categories
 * Request: POST /products
 * Body:
 */
exports.example7ArrayOperations = {
    filter: {
        logic: "and",
        conditions: [
            {
                field: "tags",
                operator: "in",
                value: ["featured", "bestseller", "new"],
            },
            {
                field: "category",
                operator: "notIn",
                value: ["discontinued", "clearance"],
            },
            {
                field: "description",
                operator: "isNotEmpty",
            },
        ],
    },
    sort: [
        {
            field: "price",
            order: "asc",
        },
    ],
    pagination: {
        page: 1,
        limit: 30,
    },
};
// ============================================================================
// EXAMPLE 8: RELATIVE DATE FILTERING
// ============================================================================
/**
 * Find products modified in the last 7 days
 * Request: POST /products
 * Body:
 */
exports.example8RelativeDates = {
    filter: {
        field: "updatedAt",
        operator: "isRelativeToToday",
        value: {
            operator: "last_n_days",
            days: 7,
        },
    },
    sort: [
        {
            field: "updatedAt",
            order: "desc",
        },
    ],
    pagination: {
        page: 1,
        limit: 20,
    },
};
// ============================================================================
// EXAMPLE 9: EMPTY/NULL CHECKS
// ============================================================================
/**
 * Find products without cost data or empty images
 * Request: POST /products
 * Body:
 */
exports.example9EmptyChecks = {
    filter: {
        logic: "or",
        conditions: [
            {
                field: "cost",
                operator: "isEmpty",
            },
            {
                field: "images",
                operator: "isEmpty",
            },
        ],
    },
    pagination: {
        page: 1,
        limit: 20,
    },
};
// ============================================================================
// EXAMPLE 10: FIELD SELECTION & RESTRICTED FIELDS
// ============================================================================
/**
 * Select only specific fields, implicitly exclude sensitive data
 * Request: POST /products
 * Body:
 */
exports.example10FieldSelection = {
    filter: {
        field: "status",
        operator: "eq",
        value: "active",
    },
    pagination: {
        page: 1,
        limit: 100,
    },
    fields: ["_id", "name", "price", "stock", "category", "createdAt"],
    // Restricted fields (password, __v) will NOT be included even if requested
};
// ============================================================================
// EXAMPLE 11: PAGINATION WITH LARGE DATASET
// ============================================================================
/**
 * Efficiently paginate through large results
 * Request: GET /products?page=5&limit=50
 * Body:
 */
exports.example11Pagination = {
    filter: {
        field: "status",
        operator: "eq",
        value: "active",
    },
    pagination: {
        page: 5,
        limit: 50,
        maxLimit: 1000, // Safety cap
    },
};
/**
 * Response shows pagination metadata:
 * {
 *   "pagination": {
 *     "page": 5,
 *     "limit": 50,
 *     "total": 10500,
 *     "totalPages": 210,
 *     "hasNextPage": true,
 *     "hasPreviousPage": true
 *   }
 * }
 */
// ============================================================================
// EXAMPLE 12: ADVANCED MULTI-CRITERIA SEARCH
// ============================================================================
/**
 * Real-world scenario: E-commerce product listing with advanced filters
 * - Category filter
 * - Price range
 * - In-stock only
 * - Search by name/sku
 * - Sort by relevance/price
 * - Pagination
 *
 * Request: POST /products/advanced-search
 * Body:
 */
exports.example12RealWorld = {
    filter: {
        logic: "and",
        conditions: [
            {
                field: "category",
                operator: "in",
                value: ["electronics", "computers", "laptops"],
            },
            {
                field: "price",
                operator: "between",
                value: [500, 2000],
            },
            {
                field: "stock",
                operator: "gt",
                value: 0,
            },
            {
                field: "status",
                operator: "eq",
                value: "active",
            },
            {
                logic: "or",
                conditions: [
                    {
                        field: "tags",
                        operator: "in",
                        value: ["featured", "bestseller"],
                    },
                    {
                        field: "createdAt",
                        operator: "isRelativeToToday",
                        value: { operator: "last_n_days", days: 30 },
                    },
                ],
            },
        ],
    },
    search: "gaming",
    searchFields: ["name", "description", "category"],
    sort: [
        { field: "createdAt", order: "desc" },
        { field: "price", order: "asc" },
    ],
    pagination: {
        page: 1,
        limit: 20,
        maxLimit: 1000,
    },
    fields: [
        "_id",
        "sku",
        "name",
        "description",
        "price",
        "stock",
        "category",
        "tags",
        "images",
        "createdAt",
    ],
};
// ============================================================================
// EXAMPLE 13: ERROR CASES
// ============================================================================
/**
 * Validation error: Invalid field
 */
exports.example13ErrorInvalidField = {
    error: {
        code: "FIELD_NOT_FOUND",
        message: 'Field "invalidField" not found in schema',
        statusCode: 400,
        details: {
            field: "invalidField",
        },
        timestamp: "2024-02-10T14:50:00Z",
    },
};
/**
 * Validation error: Invalid operator
 */
exports.example13ErrorInvalidOperator = {
    error: {
        code: "OPERATOR_NOT_FOUND",
        message: 'Operator "invalidOperator" is not supported',
        statusCode: 400,
        details: {
            operator: "invalidOperator",
            supportedOperators: [
                "eq",
                "ne",
                "lt",
                "lte",
                "gt",
                "gte",
                "between",
                // ... more operators
            ],
        },
        timestamp: "2024-02-10T14:50:00Z",
    },
};
/**
 * Query too complex error
 */
exports.example13ErrorTooComplex = {
    error: {
        code: "QUERY_TOO_COMPLEX",
        message: "Query complexity (125) exceeds maximum allowed (100). Simplify your filters or pagination.",
        statusCode: 429,
        details: {
            complexity: 125,
            maxPermitted: 100,
        },
        timestamp: "2024-02-10T14:50:00Z",
    },
};
/**
 * Permission denied error
 */
exports.example13ErrorPermissionDenied = {
    error: {
        code: "PERMISSION_DENIED",
        message: 'Permission "admin" required',
        statusCode: 403,
        details: {
            requiredPermission: "admin",
        },
        timestamp: "2024-02-10T14:50:00Z",
    },
};
// ============================================================================
// EXAMPLE 14: CURL COMMANDS
// ============================================================================
/**
 * Simple filter request
 */
exports.curl1SimpleFilter = `
curl -X POST http://localhost:3000/api/products \\
  -H "Content-Type: application/json" \\
  -H "x-tenant-id: tenant-123" \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \\
  -d '{
    "filter": {
      "field": "status",
      "operator": "eq",
      "value": "active"
    }
  }'
`;
/**
 * Complex nested filter request
 */
exports.curl2ComplexFilter = `
curl -X POST http://localhost:3000/api/products \\
  -H "Content-Type: application/json" \\
  -H "x-tenant-id: tenant-123" \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \\
  -d '{
    "filter": {
      "logic": "and",
      "conditions": [
        {"field": "category", "operator": "eq", "value": "electronics"},
        {"field": "price", "operator": "gte", "value": 100},
        {
          "logic": "or",
          "conditions": [
            {"field": "stock", "operator": "lt", "value": 5},
            {"field": "status", "operator": "eq", "value": "discontinued"}
          ]
        }
      ]
    },
    "sort": [{"field": "price", "order": "asc"}],
    "pagination": {"page": 1, "limit": 20}
  }'
`;
/**
 * Search with filter request
 */
exports.curl3SearchWithFilter = `
curl -X POST http://localhost:3000/api/products \\
  -H "Content-Type: application/json" \\
  -H "x-tenant-id: tenant-123" \\
  -d '{
    "filter": {
      "field": "status",
      "operator": "eq",
      "value": "active"
    },
    "search": "laptop gaming",
    "searchFields": ["name", "description"],
    "sort": [{"field": "createdAt", "order": "desc"}],
    "pagination": {"page": 1, "limit": 20}
  }'
`;
//# sourceMappingURL=requestExamples.js.map