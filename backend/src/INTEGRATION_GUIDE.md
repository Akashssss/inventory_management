/**
 * COMPREHENSIVE INTEGRATION GUIDE
 * Step-by-step guide to implement the query engine in your application
 */

// ============================================================================
// STEP 1: INSTALL DEPENDENCIES
// ============================================================================

/**
 * npm install express mongoose typescript @types/express @types/node
 */

// ============================================================================
// STEP 2: SETUP FOLDER STRUCTURE
// ============================================================================

/**
 * src/
 *   core/
 *     operators/mongoOperators.ts
 *     query/
 *       mongoFilterBuilder.ts
 *       mongoQueryBuilder.ts
 *       queryValidator.ts
 *       mongoQueryEngine.ts
 *   types/
 *     query.types.ts
 *   models/
 *     Product.ts
 *   repositories/
 *     BaseRepository.ts
 *     ProductRepository.ts
 *   controllers/
 *     ProductController.ts
 *   middleware/
 *     securityMiddleware.ts
 *   exceptions/
 *     AppException.ts
 *   config/
 *     database.ts
 *   app.ts
 *   main.ts
 */

// ============================================================================
// STEP 3: DATABASE CONFIGURATION
// ============================================================================

/**
 * src/config/database.ts
 */

import mongoose from "mongoose";

export async function connectDatabase() {
  const mongoUri =
    process.env.MONGODB_URI || "mongodb://localhost:27017/inventory";

  try {
    await mongoose.connect(mongoUri);
    console.log("✅ Connected to MongoDB");
  } catch (error) {
    console.error("❌ Failed to connect to MongoDB:", error);
    process.exit(1);
  }
}

// ============================================================================
// STEP 4: INITIALIZE PRODUCTS
// ============================================================================

/**
 * Ensure you have Products model from src/models/Product.ts
 * The model includes all schema, indexes, and hooks
 */

// ============================================================================
// STEP 5: CREATE MAIN APPLICATION
// ============================================================================

/**
 * src/main.ts
 */

import { connectDatabase } from "@/config/database";
import { startServer } from "@/app";

async function bootstrap() {
  try {
    // Connect to database
    await connectDatabase();

    // Start server
    startServer(Number(process.env.PORT) || 3000);

    console.log("🚀 Application started successfully");
  } catch (error) {
    console.error("💥 Failed to start application:", error);
    process.exit(1);
  }
}

bootstrap();

// ============================================================================
// STEP 6: ENVIRONMENT VARIABLES
// ============================================================================

/**
 * .env
 */

/**
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://localhost:27017/inventory
MAX_QUERY_COMPLEXITY=100
JWT_SECRET=your_secret_key_here
 */

// ============================================================================
// STEP 7: TESTING THE SYSTEM
// ============================================================================

/**
 * 1. Seed some test data
 * 2. Start the server: npm run dev
 * 3. Make API requests using curl, Postman, or the examples below
 */

// ============================================================================
// EXAMPLE: SIMPLE QUERY IN CODE
// ============================================================================

import { Product } from "@/models/Product";
import { ProductRepository } from "@/repositories/ProductRepository";

async function testQuery() {
  const repo = new ProductRepository();

  // Find active products priced between $100-$500
  const result = await repo.find({
    filter: {
      logic: "and",
      conditions: [
        { field: "status", operator: "eq", value: "active" },
        { field: "price", operator: "between", value: [100, 500] },
      ],
    },
    sort: [{ field: "price", order: "asc" }],
    pagination: { page: 1, limit: 10 },
    tenantId: "tenant-123",
  });

  console.log("Found products:", result.data.length);
  console.log("Total:", result.pagination.total);
}

// ============================================================================
// EXAMPLE: API REQUEST IN POSTMAN
// ============================================================================

/**
 * POST http://localhost:3000/api/products
 *
 * Headers:
 * - Content-Type: application/json
 * - x-tenant-id: tenant-123
 * - Authorization: Bearer YOUR_JWT_TOKEN
 *
 * Body (JSON):
 * {
 *   "filter": {
 *     "logic": "and",
 *     "conditions": [
 *       {
 *         "field": "status",
 *         "operator": "eq",
 *         "value": "active"
 *       },
 *       {
 *         "field": "price",
 *         "operator": "between",
 *         "value": [100, 500]
 *       },
 *       {
 *         "field": "stock",
 *         "operator": "gt",
 *         "value": 0
 *       }
 *     ]
 *   },
 *   "search": "laptop",
 *   "searchFields": ["name", "description"],
 *   "sort": [
 *     {
 *       "field": "price",
 *       "order": "asc"
 *     },
 *     {
 *       "field": "createdAt",
 *       "order": "desc"
 *     }
 *   ],
 *   "pagination": {
 *     "page": 1,
 *     "limit": 20
 *   },
 *   "fields": [
 *     "_id",
 *     "sku",
 *     "name",
 *     "price",
 *     "stock",
 *     "category"
 *   ]
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "data": [
 *     {
 *       "_id": "...",
 *       "sku": "LAPTOP-001",
 *       "name": "Gaming Laptop",
 *       "price": 1299.99,
 *       "stock": 5,
 *       "category": "electronics"
 *     }
 *   ],
 *   "pagination": {
 *     "page": 1,
 *     "limit": 20,
 *     "total": 45,
 *     "totalPages": 3,
 *     "hasNextPage": true,
 *     "hasPreviousPage": false
 *   },
 *   "meta": {
 *     "executionTime": 52,
 *     "queryHash": "a1b2c3d4e5f6"
 *   }
 * }
 */

// ============================================================================
// COMMON PATTERNS & RECIPES
// ============================================================================

/**
 * PATTERN 1: Repository-Specific Methods
 */

class OrderRepository extends BaseRepository {
  async findByStatus(status: string) {
    return this.find({
      filter: { field: "status", operator: "eq", value: status },
    });
  }

  async findRecentOrders(days: number = 30) {
    return this.find({
      filter: {
        field: "createdAt",
        operator: "isRelativeToToday",
        value: { operator: "last_n_days", days },
      },
      sort: [{ field: "createdAt", order: "desc" }],
    });
  }
}

/**
 * PATTERN 2: Complex Filtered Search
 */

async function handleComplexSearch(req, res, next) {
  const {
    minPrice,
    maxPrice,
    categories,
    inStock,
    searchTerm,
    page,
    limit,
  } = req.body;

  const conditions = [];

  // Price range
  if (minPrice !== undefined && maxPrice !== undefined) {
    conditions.push({
      field: "price",
      operator: "between",
      value: [minPrice, maxPrice],
    });
  }

  // Categories
  if (categories?.length) {
    conditions.push({
      field: "category",
      operator: "in",
      value: categories,
    });
  }

  // In stock only
  if (inStock) {
    conditions.push({
      field: "stock",
      operator: "gt",
      value: 0,
    });
  }

  const filter =
    conditions.length > 0
      ? { logic: "and", conditions }
      : undefined;

  const result = await productRepo.find({
    filter,
    search: searchTerm,
    searchFields: ["name", "description", "sku"],
    pagination: { page, limit },
    tenantId: req.context.tenantId,
  });

  res.json(result);
}

/**
 * PATTERN 3: Bulk Operations
 */

async function bulkUpdateProducts(ids: string[], updates: any) {
  const operations = ids.map((id) => ({
    updateOne: {
      filter: { _id: id },
      update: { $set: updates },
    },
  }));

  return productRepo.bulkWrite(operations);
}

/**
 * PATTERN 4: Pagination Through Large Dataset
 */

async function paginateThroughAll() {
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const result = await productRepo.find({
      pagination: { page, limit: 1000 },
    });

    console.log(`Processing page ${page}, got ${result.data.length} items`);

    // Process items
    for (const product of result.data) {
      // Do something
    }

    hasMore = result.pagination.hasNextPage;
    page++;
  }
}

/**
 * PATTERN 5: Combined Filtering & Searching
 */

async function searchWithFilters(searchTerm: string, filters: any) {
  return productRepo.find({
    search: searchTerm,
    searchFields: ["name", "description", "tags"],
    filter: filters,
    sort: [
      { field: "_score", order: "desc" }, // If using text index
      { field: "createdAt", order: "desc" },
    ],
    pagination: { page: 1, limit: 20 },
  });
}

// ============================================================================
// MIGRATION GUIDE (FROM OLD SYSTEM)
// ============================================================================

/**
 * OLD WAY:
 * Model.find({ status: "active", price: { $gte: 100 } })
 *
 * NEW WAY:
 * repo.find({
 *   filter: {
 *     logic: "and",
 *     conditions: [
 *       { field: "status", operator: "eq", value: "active" },
 *       { field: "price", operator: "gte", value: 100 }
 *     ]
 *   }
 * })
 *
 * BENEFITS:
 * ✅ Type-safe
 * ✅ Centralized validation
 * ✅ Automatic multi-tenancy injection
 * ✅ Field whitelisting
 * ✅ Consistent error handling
 * ✅ Query complexity estimation
 * ✅ Easy to extend
 */

// ============================================================================
// TROUBLESHOOTING
// ============================================================================

/**
 * Problem: Query returns no results
 * Solution: Check if tenantId is correctly injected. Verify the filter is correct.
 *
 * Problem: "Field not found" error
 * Solution: Ensure the field exists in productFieldSchema and is marked filterable: true
 *
 * Problem: "Operator not supported" error
 * Solution: Check if the operator is in the list of supported operators
 *
 * Problem: "Query too complex" error
 * Solution: Simplify the filter or increase MAX_QUERY_COMPLEXITY
 *
 * Problem: Soft-deleted records are showing
 * Solution: Verify includeSoftDeleted is not set to true
 *
 * Problem: Performance is slow
 * Solution: Add indexes, limit fields selection, reduce limit, check query logs
 */

// ============================================================================
// MONITORING & LOGGING
// ============================================================================

/**
 * Enable query logging in development:
 *
 * const queryEngine = createQueryEngine(true, true);
 *
 * Logs will show:
 * [Query q_1707571200000_a1b2c3d4e5] Built query: {...}
 * [Query q_1707571200000_a1b2c3d4e5] Executed in 45ms. Results: 20/5000
 */

/**
 * Monitor slow queries:
 *
 * app.use((req, res, next) => {
 *   const start = Date.now();
 *   res.on("finish", () => {
 *     const duration = Date.now() - start;
 *     if (duration > 1000) {
 *       console.warn(`Slow query: ${req.path} took ${duration}ms`);
 *     }
 *   });
 *   next();
 * });
 */

export {};
