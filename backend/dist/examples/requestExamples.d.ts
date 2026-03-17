/**
 * PRODUCTION API EXAMPLES
 * Real-world request/response examples for the query engine
 */
/**
 * Request: GET /products?page=1&limit=20
 * Body:
 */
export declare const example1SimpleFilter: {
    filter: {
        field: string;
        operator: string;
        value: string;
    };
};
/**
 * Response:
 */
export declare const example1Response: {
    success: boolean;
    data: {
        _id: string;
        tenantId: string;
        sku: string;
        name: string;
        category: string;
        price: number;
        stock: number;
        status: string;
        createdAt: string;
        updatedAt: string;
    }[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNextPage: boolean;
        hasPreviousPage: boolean;
    };
    meta: {
        executionTime: number;
        queryHash: string;
        cacheHit: boolean;
    };
};
/**
 * Find products priced between $500-$1500
 * Request: POST /products
 * Body:
 */
export declare const example2PriceRange: {
    filter: {
        field: string;
        operator: string;
        value: number[];
    };
    sort: {
        field: string;
        order: string;
    }[];
    pagination: {
        page: number;
        limit: number;
    };
    fields: string[];
};
/**
 * Find electronics products that are either:
 * 1. In stock with price >= $100, OR
 * 2. Discontinued but on sale (cost > 50% of price)
 *
 * Request: POST /products
 * Body:
 */
export declare const example3ComplexNested: {
    filter: {
        logic: string;
        conditions: ({
            field: string;
            operator: string;
            value: string;
            logic?: undefined;
            conditions?: undefined;
        } | {
            logic: string;
            conditions: {
                logic: string;
                conditions: ({
                    field: string;
                    operator: string;
                    value: string;
                } | {
                    field: string;
                    operator: string;
                    value: number;
                })[];
            }[];
            field?: undefined;
            operator?: undefined;
            value?: undefined;
        })[];
    };
    sort: {
        field: string;
        order: string;
    }[];
    pagination: {
        page: number;
        limit: number;
    };
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
/**
 * Search for "gaming laptop" in electronics category
 * Request: POST /products
 * Body:
 */
export declare const example4SearchWithFilter: {
    filter: {
        logic: string;
        conditions: ({
            field: string;
            operator: string;
            value: string[];
        } | {
            field: string;
            operator: string;
            value: number;
        })[];
    };
    search: string;
    searchFields: string[];
    sort: {
        field: string;
        order: string;
    }[];
    pagination: {
        page: number;
        limit: number;
    };
    fields: string[];
};
/**
 * Find recently added products (last 30 days) with low stock
 * Request: POST /products
 * Body:
 */
export declare const example5DateRange: {
    filter: {
        logic: string;
        conditions: ({
            field: string;
            operator: string;
            value: string[];
        } | {
            field: string;
            operator: string;
            value: number[];
        })[];
    };
    sort: {
        field: string;
        order: string;
    }[];
    pagination: {
        page: number;
        limit: number;
    };
};
/**
 * Find SKUs starting with "LAPTOP" and names not containing "used"
 * Request: POST /products
 * Body:
 */
export declare const example6TextMatching: {
    filter: {
        logic: string;
        conditions: {
            field: string;
            operator: string;
            value: string;
        }[];
    };
    pagination: {
        page: number;
        limit: number;
    };
};
/**
 * Find products with specific tags and exclude certain categories
 * Request: POST /products
 * Body:
 */
export declare const example7ArrayOperations: {
    filter: {
        logic: string;
        conditions: ({
            field: string;
            operator: string;
            value: string[];
        } | {
            field: string;
            operator: string;
            value?: undefined;
        })[];
    };
    sort: {
        field: string;
        order: string;
    }[];
    pagination: {
        page: number;
        limit: number;
    };
};
/**
 * Find products modified in the last 7 days
 * Request: POST /products
 * Body:
 */
export declare const example8RelativeDates: {
    filter: {
        field: string;
        operator: string;
        value: {
            operator: string;
            days: number;
        };
    };
    sort: {
        field: string;
        order: string;
    }[];
    pagination: {
        page: number;
        limit: number;
    };
};
/**
 * Find products without cost data or empty images
 * Request: POST /products
 * Body:
 */
export declare const example9EmptyChecks: {
    filter: {
        logic: string;
        conditions: {
            field: string;
            operator: string;
        }[];
    };
    pagination: {
        page: number;
        limit: number;
    };
};
/**
 * Select only specific fields, implicitly exclude sensitive data
 * Request: POST /products
 * Body:
 */
export declare const example10FieldSelection: {
    filter: {
        field: string;
        operator: string;
        value: string;
    };
    pagination: {
        page: number;
        limit: number;
    };
    fields: string[];
};
/**
 * Efficiently paginate through large results
 * Request: GET /products?page=5&limit=50
 * Body:
 */
export declare const example11Pagination: {
    filter: {
        field: string;
        operator: string;
        value: string;
    };
    pagination: {
        page: number;
        limit: number;
        maxLimit: number;
    };
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
export declare const example12RealWorld: {
    filter: {
        logic: string;
        conditions: ({
            field: string;
            operator: string;
            value: string[];
            logic?: undefined;
            conditions?: undefined;
        } | {
            field: string;
            operator: string;
            value: number[];
            logic?: undefined;
            conditions?: undefined;
        } | {
            field: string;
            operator: string;
            value: number;
            logic?: undefined;
            conditions?: undefined;
        } | {
            field: string;
            operator: string;
            value: string;
            logic?: undefined;
            conditions?: undefined;
        } | {
            logic: string;
            conditions: ({
                field: string;
                operator: string;
                value: string[];
            } | {
                field: string;
                operator: string;
                value: {
                    operator: string;
                    days: number;
                };
            })[];
            field?: undefined;
            operator?: undefined;
            value?: undefined;
        })[];
    };
    search: string;
    searchFields: string[];
    sort: {
        field: string;
        order: string;
    }[];
    pagination: {
        page: number;
        limit: number;
        maxLimit: number;
    };
    fields: string[];
};
/**
 * Validation error: Invalid field
 */
export declare const example13ErrorInvalidField: {
    error: {
        code: string;
        message: string;
        statusCode: number;
        details: {
            field: string;
        };
        timestamp: string;
    };
};
/**
 * Validation error: Invalid operator
 */
export declare const example13ErrorInvalidOperator: {
    error: {
        code: string;
        message: string;
        statusCode: number;
        details: {
            operator: string;
            supportedOperators: string[];
        };
        timestamp: string;
    };
};
/**
 * Query too complex error
 */
export declare const example13ErrorTooComplex: {
    error: {
        code: string;
        message: string;
        statusCode: number;
        details: {
            complexity: number;
            maxPermitted: number;
        };
        timestamp: string;
    };
};
/**
 * Permission denied error
 */
export declare const example13ErrorPermissionDenied: {
    error: {
        code: string;
        message: string;
        statusCode: number;
        details: {
            requiredPermission: string;
        };
        timestamp: string;
    };
};
/**
 * Simple filter request
 */
export declare const curl1SimpleFilter = "\ncurl -X POST http://localhost:3000/api/products \\\n  -H \"Content-Type: application/json\" \\\n  -H \"x-tenant-id: tenant-123\" \\\n  -H \"Authorization: Bearer YOUR_JWT_TOKEN\" \\\n  -d '{\n    \"filter\": {\n      \"field\": \"status\",\n      \"operator\": \"eq\",\n      \"value\": \"active\"\n    }\n  }'\n";
/**
 * Complex nested filter request
 */
export declare const curl2ComplexFilter = "\ncurl -X POST http://localhost:3000/api/products \\\n  -H \"Content-Type: application/json\" \\\n  -H \"x-tenant-id: tenant-123\" \\\n  -H \"Authorization: Bearer YOUR_JWT_TOKEN\" \\\n  -d '{\n    \"filter\": {\n      \"logic\": \"and\",\n      \"conditions\": [\n        {\"field\": \"category\", \"operator\": \"eq\", \"value\": \"electronics\"},\n        {\"field\": \"price\", \"operator\": \"gte\", \"value\": 100},\n        {\n          \"logic\": \"or\",\n          \"conditions\": [\n            {\"field\": \"stock\", \"operator\": \"lt\", \"value\": 5},\n            {\"field\": \"status\", \"operator\": \"eq\", \"value\": \"discontinued\"}\n          ]\n        }\n      ]\n    },\n    \"sort\": [{\"field\": \"price\", \"order\": \"asc\"}],\n    \"pagination\": {\"page\": 1, \"limit\": 20}\n  }'\n";
/**
 * Search with filter request
 */
export declare const curl3SearchWithFilter = "\ncurl -X POST http://localhost:3000/api/products \\\n  -H \"Content-Type: application/json\" \\\n  -H \"x-tenant-id: tenant-123\" \\\n  -d '{\n    \"filter\": {\n      \"field\": \"status\",\n      \"operator\": \"eq\",\n      \"value\": \"active\"\n    },\n    \"search\": \"laptop gaming\",\n    \"searchFields\": [\"name\", \"description\"],\n    \"sort\": [{\"field\": \"createdAt\", \"order\": \"desc\"}],\n    \"pagination\": {\"page\": 1, \"limit\": 20}\n  }'\n";
//# sourceMappingURL=requestExamples.d.ts.map