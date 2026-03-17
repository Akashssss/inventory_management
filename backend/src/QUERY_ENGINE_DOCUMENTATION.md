# ENTERPRISE QUERY ENGINE DOCUMENTATION

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Quick Start](#quick-start)
3. [Filter Operations](#filter-operations)
4. [Advanced Features](#advanced-features)
5. [Security & Multi-Tenancy](#security--multi-tenancy)
6. [Extending the System](#extending-the-system)
7. [Performance & Optimization](#performance--optimization)
8. [Best Practices](#best-practices)

---

## Architecture Overview

### Core Components

```
Request
  ↓
Security Middleware (Tenant, Auth, RBAC)
  ↓
Controller (Thin)
  ↓
Repository (Business Logic)
  ↓
Query Engine
  ├── Query Validator
  ├── Filter Builder
  ├── Query Builder
  └── Operator Registry
  ↓
MongoDB Query
  ↓
Mongoose Document
  ↓
Response
```

### Design Principles

- **Clean Architecture**: Separation of concerns (Controller → Service → Repository → Engine)
- **Field Whitelisting**: Only exposed fields can be queried/selected
- **Multi-Tenancy**: Automatic tenant filtering injection
- **Soft Deletes**: Automatic exclusion of deleted records
- **RBAC Ready**: Permission checks at field level
- **Type Safety**: Full TypeScript support
- **Extensibility**: Easy to add new operators, validators, and filters

---

## Quick Start

### 1. Setup Query Engine

```typescript
import { createQueryEngine } from "@/core";
import { Product } from "@/models/Product";
import { ProductRepository } from "@/repositories/ProductRepository";

// Initialize globally (once per app)
const queryEngine = createQueryEngine(true, false);
// Arguments: (enableValidation, enableQueryLogging)

// Use in repository
const productRepo = new ProductRepository(queryEngine);
```

### 2. Simple Query

```typescript
// Find active products
const result = await productRepo.find({
  filter: {
    field: "status",
    operator: "eq",
    value: "active",
  },
  pagination: { page: 1, limit: 20 },
});

console.log(result.data); // Product[]
console.log(result.pagination); // { page, limit, total, totalPages, ... }
```

### 3. In Express Controller

```typescript
import express from "express";
import { ProductController } from "@/controllers/ProductController";
import { getProductRepository } from "@/repositories/ProductRepository";

const app = express();
const repo = getProductRepository();
const controller = new ProductController(repo);

app.post("/api/products", (req, res, next) =>
  controller.getProducts(req, res, next)
);
```

---

## Filter Operations

### Filter Node Structure

```typescript
interface FilterNode {
  logic?: "and" | "or"; // For grouping
  conditions?: FilterNode[]; // Child conditions
  field?: string; // Field name
  operator?: string; // Operation type
  value?: any; // Operation value
}
```

### Supported Operators

#### Comparison Operators

| Operator   | Description          | Example                     |
| ---------- | -------------------- | --------------------------- |
| `eq`       | Equals                | `{ field: "status", op: "eq", value: "active" }` |
| `ne`       | Not equals           | `{ field: "status", op: "ne", value: "deleted" }` |
| `lt`       | Less than            | `{ field: "price", op: "lt", value: 100 }` |
| `lte`      | Less than or equal   | `{ field: "stock", op: "lte", value: 10 }` |
| `gt`       | Greater than         | `{ field: "price", op: "gt", value: 50 }` |
| `gte`      | Greater than or equal| `{ field: "rating", op: "gte", value: 4.0 }` |
| `between`  | Within range         | `{ field: "price", op: "between", value: [100, 500] }` |

#### Text/String Operators

| Operator    | Description      | Example                                  |
| ----------- | ---------------- | ---------------------------------------- |
| `contains`  | Contains text    | `{ field: "name", op: "contains", value: "gaming" }` |
| `notContains` | Doesn't contain | `{ field: "name", op: "notContains", value: "used" }` |
| `startsWith` | Starts with     | `{ field: "sku", op: "startsWith", value: "PROD" }` |
| `endsWith`  | Ends with       | `{ field: "email", op: "endsWith", value: "@company.com" }` |
| `regex`     | Regex match     | `{ field: "code", op: "regex", value: "^[A-Z]{3}" }` |

#### Array/Set Operators

| Operator  | Description    | Example                                    |
| --------- | -------------- | ------------------------------------------ |
| `in`      | In array       | `{ field: "category", op: "in", value: ["electronics", "computers"] }` |
| `notIn`   | Not in array   | `{ field: "status", op: "notIn", value: ["deleted", "archived"] }` |

#### Existence Operators

| Operator    | Description   | Example                         |
| ----------- | ------------- | ------------------------------- |
| `isEmpty`   | Is empty/null | `{ field: "description", op: "isEmpty" }` |
| `isNotEmpty` | Not empty     | `{ field: "tags", op: "isNotEmpty" }` |

#### Date Operators

| Operator       | Description      | Example                                       |
| -------------- | ---------------- | --------------------------------------------- |
| `dateIsBefore` | Before date      | `{ field: "createdAt", op: "dateIsBefore", value: "2024-01-01" }` |
| `dateIsAfter`  | After date       | `{ field: "updatedAt", op: "dateIsAfter", value: "2024-01-01" }` |
| `dateIsBetween` | Between dates   | `{ field: "createdAt", op: "dateIsBetween", value: ["2024-01-01", "2024-12-31"] }` |
| `isRelativeToToday` | Relative dates | `{ field: "createdAt", op: "isRelativeToToday", value: { operator: "last_n_days", days: 7 } }` |

### Simple Filter Example

```typescript
// Single condition
const filter = {
  field: "category",
  operator: "eq",
  value: "electronics",
};
```

### Complex Nested Filter Example

```typescript
// "Find Electronics costing $100-$1000 that are either low stock OR discontinued"
const filter = {
  logic: "and",
  conditions: [
    {
      field: "category",
      operator: "eq",
      value: "electronics",
    },
    {
      field: "price",
      operator: "between",
      value: [100, 1000],
    },
    {
      logic: "or",
      conditions: [
        {
          field: "stock",
          operator: "lt",
          value: 5,
        },
        {
          field: "status",
          operator: "eq",
          value: "discontinued",
        },
      ],
    },
  ],
};
```

---

## Advanced Features

### 1. Full-Text Search

```typescript
const result = await productRepo.find({
  search: "gaming laptop",
  searchFields: ["name", "description", "sku"], // Which fields to search
  pagination: { page: 1, limit: 20 },
});
```

### 2. Sorting (Multi-Column)

```typescript
const result = await productRepo.find({
  filter: { field: "status", operator: "eq", value: "active" },
  sort: [
    { field: "createdAt", order: "desc" }, // Primary sort
    { field: "price", order: "asc" }, // Secondary sort
  ],
});
```

### 3. Field Selection

Only select specific fields:

```typescript
const result = await productRepo.find({
  fields: ["_id", "name", "price", "stock"],
  pagination: { page: 1, limit: 20 },
});
```

### 4. Pagination with Metadata

```typescript
const result = await productRepo.find({
  pagination: {
    page: 2,
    limit: 50,
    maxLimit: 1000, // Security cap
  },
});

console.log(result.pagination);
// {
//   page: 2,
//   limit: 50,
//   total: 5000,
//   totalPages: 100,
//   hasNextPage: true,
//   hasPreviousPage: true
// }
```

### 5. Multi-Tenant Filtering

Automatically injected via middleware:

```typescript
// Request context is populated by securityMiddleware
const result = await productRepo.find({
  filter: { field: "status", operator: "eq", value: "active" },
  tenantId: req.context.tenantId, // Automatically filtered
});
```

### 6. Soft Deletes

Automatically excluded unless explicitly included:

```typescript
// Excludes soft-deleted records by default
const result = await productRepo.find({
  filter: { field: "status", operator: "eq", value: "active" },
});

// Include soft-deleted records (admin only)
const resultWithDeleted = await productRepo.find({
  filter: { field: "status", operator: "eq", value: "active" },
  includeSoftDeleted: true,
});
```

---

## Security & Multi-Tenancy

### Middleware Stack

```typescript
import {
  applySecurityMiddleware,
  tenantMiddleware,
  authMiddleware,
  requirePermission,
  softDeleteMiddleware,
} from "@/middleware/securityMiddleware";

const app = express();

// Apply all security middleware
applySecurityMiddleware(app);

// Now all routes have req.context with:
// - tenantId
// - userId
// - roles
// - permissions
// - includeSoftDeleted
// - requestId
```

### Require Permission on Route

```typescript
app.post(
  "/api/products",
  requirePermission("products:write"),
  (req, res) => {
    // Only users with products:write permission can access
  }
);
```

### Field-Level RBAC

```typescript
// In ProductRepository field schema:
const productFieldSchema: FieldMetadata[] = [
  {
    name: "cost",
    type: "number",
    requiredPermission: "admin:financials", // Only admins can see
  },
  // ... more fields
];

// Users without permission get validation error
```

### Safe Error Handling

```typescript
import { errorHandler } from "@/exceptions/AppException";

// Development mode (shows full details)
app.use((err, req, res, next) => errorHandler(err, req, res, next));

// Production mode (hides sensitive info)
app.use((err, req, res, next) => 
  errorHandler(err, req, res, process.env.NODE_ENV === "development")
);
```

---

## Extending the System

### Add Custom Operator

```typescript
import { getOperatorRegistry } from "@/core";

const registry = getOperatorRegistry();

// Register custom operator
registry.register({
  name: "geoDistance" as FilterOperator,
  handler: (field, value) => ({
    [field]: {
      $near: {
        $geometry: {
          type: "Point",
          coordinates: value.coordinates,
        },
        $maxDistance: value.maxDistance,
      },
    },
  }),
  description: "GeoSpatial distance query",
  supportedTypes: ["object"],
});

// Now use in filters:
const result = await repo.find({
  filter: {
    field: "location",
    operator: "geoDistance",
    value: {
      coordinates: [40.7128, -74.0060], // NYC
      maxDistance: 10000, // 10km
    },
  },
});
```

### Add Validator Rules

```typescript
import { getQueryEngine } from "@/core";

const engine = getQueryEngine();

// Restrict query complexity
engine.setMaxQueryComplexity(150); // Increase from default 100

// Enable query logging
engine.setQueryLogging(true);
```

### Create Domain-Specific Repository

```typescript
import { BaseRepository } from "@/repositories/BaseRepository";
import { Order } from "@/models/Order";

export class OrderRepository extends BaseRepository<IOrder> {
  constructor(queryEngine?: MongoQueryEngine) {
    super(Order, queryEngine);
    // Register field schema
    this.queryEngine.registerFieldSchema("orders", orderFieldSchema);
  }

  // Add domain-specific methods
  async findByCustomer(customerId: string): Promise<QueryResult<IOrder>> {
    return this.find({
      filter: {
        field: "customerId",
        operator: "eq",
        value: customerId,
      },
    });
  }

  async findPending(): Promise<QueryResult<IOrder>> {
    return this.find({
      filter: {
        field: "status",
        operator: "eq",
        value: "pending",
      },
      sort: [{ field: "createdAt", order: "asc" }],
    });
  }

  async findRecentOrders(days: number = 30): Promise<QueryResult<IOrder>> {
    return this.find({
      filter: {
        field: "createdAt",
        operator: "isRelativeToToday",
        value: {
          operator: "last_n_days",
          days,
        },
      },
      sort: [{ field: "createdAt", order: "desc" }],
    });
  }
}
```

---

## Performance & Optimization

### Index Strategy

```typescript
// Product model should have indexes:
const productSchema = new Schema<IProduct>({
  // Single field indexes
  tenantId: { type: String, index: true }, // Multi-tenant filtering
  name: { type: String, index: true }, // Search
  category: { type: String, index: true }, // Filtering
  price: { type: Number, index: true }, // Range queries
  status: { type: String, index: true }, // Filtering
  stock: { type: Number, index: true }, // Range queries
  deletedAt: { type: Date, index: true }, // Soft delete filtering

  // Compound indexes
  // { tenantId: 1, status: 1, createdAt: -1 }
  // { tenantId: 1, category: 1 }
});
```

### Query Logging

```typescript
const queryEngine = createQueryEngine(true, true); // Enable logging

// Logs will show:
// [Query q_1707571200000_a1b2c3d4e5] Built query: {...}
// [Query q_1707571200000_a1b2c3d4e5] Executed in 45ms. Results: 20/5000
```

### Complexity Estimation

```typescript
const result = await repo.find({
  filter: { ... },
  pagination: { page: 1, limit: 20 },
});

// Returns execution metadata:
// {
//   meta: {
//     executionTime: 45,
//     queryHash: "a1b2c3d4e5f6",
//     totalQueryComplexity: 15
//   }
// }
```

### Reduce Query Complexity

```typescript
// ❌ BAD: Too complex
const filter = {
  logic: "or",
  conditions: [
    // 30 conditions...
  ],
};

// ✅ GOOD: Simpler, more efficient
const filter = {
  field: "category",
  operator: "in",
  value: ["electronics", "computers", "laptops"],
};
```

---

## Best Practices

### 1. Always Use Field Whitelisting

```typescript
// ✅ Good: Only expose necessary fields
const result = await repo.find({
  fields: ["_id", "name", "price", "stock"],
});

// ❌ Bad: Exposes all fields including sensitive data
const result = await repo.find({
  fields: undefined,
});
```

### 2. Set Pagination Limits

```typescript
// ✅ Good: Cap the limit to prevent large transfers
const result = await repo.find({
  pagination: {
    page: 1,
    limit: Math.min(req.query.limit, 1000), // Max 1000
  },
});

// ❌ Bad: Allows user to request millions of records
const result = await repo.find({
  pagination: { limit: req.query.limit }, // No cap!
});
```

### 3. Validate Filter Before Passing

```typescript
// Query engine validates automatically, but you can pre-validate
try {
  const validator = queryEngine.getValidator();
  validator.validateFilter(filter, productFieldSchema);
  const result = await repo.find({ filter });
} catch (error) {
  // Validation error
  res.status(400).json({ error: error.message });
}
```

### 4. Use Domain-Specific Repository Methods

```typescript
// ✅ Good: Clear intent, reusable
await productRepo.findLowStock(threshold);
await productRepo.findByPriceRange(min, max);
await productRepo.findByCategory(category);

// ❌ Bad: Duplicates logic everywhere
await queryEngine.execute(Product, {
  filter: { field: "stock", operator: "lt", value: 10 },
});
```

### 5. Handle Errors Properly

```typescript
try {
  const result = await repo.find(options);
  res.json(result);
} catch (error) {
  // Automatically converts to AppException with proper status code
  next(error); // Pass to error middleware
}
```

### 6. Document Field Schema

```typescript
// For each model, explicitly define what's searchable/filterable
export const productFieldSchema: FieldMetadata[] = [
  {
    name: "price",
    type: "number",
    filterable: true,
    searchable: false,
    sortable: true,
    selectable: true,
    supportedOperators: ["eq", "ne", "lt", "lte", "gt", "gte", "between"],
    indexed: true,
  },
  // ... rest of fields
];
```

### 7. Use Transactions for Multi-Document Operations

```typescript
const session = await mongoose.startSession();
session.startTransaction();

try {
  // Multiple operations within transaction
  await repo1.bulkWrite([...], { session });
  await repo2.bulkWrite([...], { session });
  await session.commitTransaction();
} catch (error) {
  await session.abortTransaction();
  throw error;
}
```

### 8. Monitor Query Performance

```typescript
// Log slow queries
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (duration > 1000) {
      console.warn(`Slow query: ${req.path} took ${duration}ms`);
    }
  });
  next();
});
```

---

## Testing

### Unit Test Example

```typescript
import { createQueryEngine } from "@/core";
import { Product } from "@/models/Product";

describe("ProductRepository", () => {
  let repo: ProductRepository;

  beforeEach(() => {
    const engine = createQueryEngine();
    repo = new ProductRepository(engine);
  });

  it("should find products by price range", async () => {
    const result = await repo.findByPriceRange(100, 500);
    expect(result.data).toBeDefined();
    expect(result.pagination.total).toBeGreaterThan(0);
  });

  it("should validate unsupported operators", async () => {
    try {
      await repo.find({
        filter: {
          field: "price",
          operator: "invalidOp",
          value: 100,
        },
      });
      fail("Should throw");
    } catch (error) {
      expect(error.code).toBe("OPERATOR_NOT_FOUND");
    }
  });
});
```

---

## Summary

This enterprise query engine provides:

✅ **Centralized query logic** - All queries use the same engine
✅ **Type-safe filters** - Full TypeScript support
✅ **Security by default** - Multi-tenancy, RBAC, field whitelisting
✅ **Soft deletes** - Automatic exclusion of deleted records
✅ **Complex queries** - Infinite nesting with AND/OR
✅ **Search & pagination** - Production-ready
✅ **Validation** - Prevent malicious/expensive queries
✅ **Extensibility** - Easy to add operators, validators, and domain-specific methods
✅ **Performance metrics** - Built-in logging and complexity estimation
✅ **Error handling** - Comprehensive exception types

Perfect for SaaS, enterprise, and high-scale applications.
