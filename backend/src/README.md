# Enterprise Query Engine - Complete Backend System

**Production-grade, type-safe query engine for Node.js/Express/MongoDB**

## 🚀 Quick Overview

A modular, scalable query system designed for enterprise SaaS platforms. Supports complex nested filtering, full-text search, sorting, pagination, field selection, multi-tenancy, RBAC, and soft deletes—all out of the box.

```typescript
// Simple & intuitive API
const result = await productRepo.find({
  filter: {
    logic: "and",
    conditions: [
      { field: "status", operator: "eq", value: "active" },
      { field: "price", operator: "between", value: [100, 1000] },
    ],
  },
  search: "laptop",
  searchFields: ["name", "description"],
  sort: [{ field: "price", order: "asc" }],
  pagination: { page: 1, limit: 20 },
  fields: ["_id", "name", "price", "stock"],
  tenantId: "tenant-123",
});
```

---

## 📁 File Structure

```
src/
├── core/
│   ├── operators/
│   │   └── mongoOperators.ts          # Operator registry & handlers
│   ├── query/
│   │   ├── mongoFilterBuilder.ts      # Recursive filter tree builder
│   │   ├── mongoQueryBuilder.ts       # Complete query builder
│   │   ├── queryValidator.ts          # Validation & complexity checks
│   │   └── mongoQueryEngine.ts        # Main execution engine
│   └── index.ts                       # Core exports
├── types/
│   └── query.types.ts                 # All TypeScript interfaces
├── models/
│   └── Product.ts                     # Example MongoDB model
├── repositories/
│   ├── BaseRepository.ts              # Generic CRUD + queries
│   └── ProductRepository.ts           # Domain-specific repository
├── controllers/
│   └── ProductController.ts           # Express request handlers
├── middleware/
│   └── securityMiddleware.ts          # Tenant, auth, RBAC
├── exceptions/
│   └── AppException.ts                # Custom exceptions
├── examples/
│   └── requestExamples.ts             # Real-world request/response examples
├── QUERY_ENGINE_DOCUMENTATION.md      # Full documentation
├── INTEGRATION_GUIDE.md               # Step-by-step setup
├── app.ts                             # Express app initialization
└── main.ts                            # Entry point
```

---

## 🎯 Key Features

### ✅ Advanced Filtering
- **Recursive nested AND/OR conditions** - Build queries of any complexity
- **20+ operators** - eq, ne, lt, lte, gt, gte, between, in, notIn, contains, regex, isEmpty, dateIsBefore, dateIsAfter, isRelativeToToday, and more
- **Type-aware validation** - Ensures values match field types
- **Operator registry** - Easy to add custom operators

### ✅ Full-Text Search
- Multi-field search with case-insensitive regex
- MongoDB text index support
- Combined with structured filters

### ✅ Sorting & Pagination
- Multi-column sorting (primary, secondary, tertiary...)
- Page-based pagination with max limit cap
- Metadata: total, totalPages, hasNextPage, hasPreviousPage
- Foundation ready for cursor pagination

### ✅ Field Selection
- Select only needed fields
- Whitelist-based security
- Automatic restricted field filtering
- RBAC-aware field access

### ✅ Security & Enterprise Features
- **Multi-tenancy** - Automatic tenant filtering injection
- **Soft deletes** - Automatic exclusion of deleted records (with override)
- **RBAC** - Field-level permission checks
- **Field whitelisting** - Only exposed fields are queryable
- **Query complexity estimation** - Prevent DOS attacks
- **Validation layer** - Catch errors early
- **Safe error handling** - Production-safe exception responses

### ✅ Clean Architecture
- Repository pattern
- Thin controllers
- Separation of concerns
- Dependency injection ready
- Type-safe throughout (100% TypeScript)

---

## 🔧 Supported Operators

### Comparison Operators
```
eq, ne, lt, lte, gt, gte, between
```

### Text Operators
```
contains, notContains, startsWith, endsWith, regex
```

### Array Operators
```
in, notIn
```

### Existence Operators
```
isEmpty, isNotEmpty
```

### Date Operators
```
dateIsBefore, dateIsAfter, dateIsBetween, isRelativeToToday
```

---

## 🎓 Quick Start Examples

### Example 1: Simple Equality Filter
```typescript
const result = await productRepo.find({
  filter: {
    field: "status",
    operator: "eq",
    value: "active",
  },
});
```

### Example 2: Price Range
```typescript
const result = await productRepo.find({
  filter: {
    field: "price",
    operator: "between",
    value: [100, 500],
  },
  sort: [{ field: "price", order: "asc" }],
});
```

### Example 3: Complex Nested Query
```typescript
const result = await productRepo.find({
  filter: {
    logic: "and",
    conditions: [
      { field: "category", operator: "eq", value: "electronics" },
      { field: "price", operator: "gte", value: 100 },
      {
        logic: "or",
        conditions: [
          { field: "stock", operator: "lt", value: 5 },
          { field: "status", operator: "eq", value: "discontinued" },
        ],
      },
    ],
  },
  pagination: { page: 1, limit: 20 },
});
```

### Example 4: Search + Filter + Sort + Pagination
```typescript
const result = await productRepo.find({
  filter: {
    logic: "and",
    conditions: [
      { field: "status", operator: "eq", value: "active" },
      { field: "stock", operator: "gt", value: 0 },
    ],
  },
  search: "gaming laptop",
  searchFields: ["name", "description"],
  sort: [
    { field: "createdAt", order: "desc" },
    { field: "price", order: "asc" },
  ],
  pagination: { page: 1, limit: 20 },
  fields: ["_id", "sku", "name", "price", "stock"],
});
```

---

## 🏗️ Architecture Layers

```
HTTP Request
    ↓
Security Middleware
    (Injects tenantId, userId, permissions, etc.)
    ↓
Controller
    (Thin - just maps HTTP to repository)
    ↓
Repository
    (Domain logic - uses query engine)
    ↓
Query Engine
    ├─ Validator (checks filters, sorts, fields)
    ├─ Filter Builder (converts to MongoDB)
    ├─ Query Builder (handles sorting, pagination, fields)
    └─ Operator Registry (manages operators)
    ↓
MongoDB Query
    └─ Mongoose Document
    ↓
HTTP Response
```

---

## 🔒 Security Features

### Multi-Tenancy
Automatic tenant isolation via middleware:
```typescript
const result = await repo.find({
  tenantId: req.context.tenantId, // Injected automatically
  filter: {...},
});
```

### Field Whitelisting
```typescript
export const productFieldSchema: FieldMetadata[] = [
  {
    name: "price",
    filterable: true,  // Can be used in filters
    searchable: true,  // Can be searched
    sortable: true,    // Can be sorted
    selectable: true,  // Can be selected in response
  },
  {
    name: "cost",
    filterable: true,
    selectable: false, // Hidden from API responses
    requiredPermission: "financial:view", // Requires permission
  },
];
```

### RBAC (Role-Based Access Control)
```typescript
// Field-level access
{
  name: "internalNotes",
  requiredPermission: "admin:all",
}

// Route-level access
app.post("/api/products", requirePermission("products:write"), handler);
```

### Soft Deletes
```typescript
// Automatically excludes deletedAt != null
const result = await repo.find({...});

// Include deleted records (admin only)
const result = await repo.find({
  includeSoftDeleted: true,
  tenantId: "...",
});
```

### Query Complexity Protection
```typescript
// Prevents expensive queries
if (complexity > maxComplexity) {
  throw new QueryComplexityException(complexity, maxComplexity);
}
```

---

## 📚 Documentation

### Full Documentation
See [QUERY_ENGINE_DOCUMENTATION.md](./QUERY_ENGINE_DOCUMENTATION.md) for:
- Detailed architecture
- All operators with examples
- Advanced features (search, sorting, pagination)
- Security & multi-tenancy
- Performance optimization
- Best practices
- Testing examples

### Integration Guide
See [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md) for:
- Step-by-step setup
- Database configuration
- Custom operators
- Domain-specific repositories
- Common patterns & recipes
- Migration from old system

### API Examples
See [requestExamples.ts](./examples/requestExamples.ts) for:
- 14 detailed request/response examples
- Complex nested filters
- Full-text search
- Date filtering
- Real-world scenarios
- Curl commands
- Error cases

---

## 🎬 Getting Started

### 1. Install Dependencies
```bash
npm install express mongoose typescript @types/express @types/node
```

### 2. Setup Model
```typescript
import { Schema, model } from "mongoose";

const productSchema = new Schema<IProduct>({
  tenantId: { type: String, required: true, index: true },
  name: { type: String, required: true, index: true },
  price: { type: Number, required: true, index: true },
  status: { type: String, enum: ["active", "inactive"], index: true },
  deletedAt: { type: Date, default: null, index: true },
});

export const Product = model<IProduct>("Product", productSchema);
```

### 3. Create Repository
```typescript
import { BaseRepository } from "@/repositories/BaseRepository";

export class ProductRepository extends BaseRepository<IProduct> {
  constructor() {
    super(Product);
  }
}
```

### 4. Create Controller
```typescript
export class ProductController {
  constructor(private repo: ProductRepository) {}

  async getProducts(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await this.repo.find({
        filter: req.body.filter,
        pagination: { page: req.query.page, limit: req.query.limit },
        tenantId: req.context.tenantId,
      });
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
}
```

### 5. Setup Routes
```typescript
import { createApp } from "@/app";

const app = createApp();
app.listen(3000);
```

---

## 💾 Database Schema Example

```typescript
const productSchema = new Schema<IProduct>({
  // Multi-tenancy
  tenantId: { type: String, required: true, index: true },

  // Core fields
  sku: { type: String, required: true, unique: true },
  name: { type: String, required: true, index: true },
  description: String,
  category: { type: String, required: true, index: true },

  // Pricing
  price: { type: Number, required: true, index: true },
  cost: Number,

  // Inventory
  stock: { type: Number, required: true, index: true },
  status: {
    type: String,
    enum: ["active", "inactive", "discontinued"],
    default: "active",
    index: true,
  },

  // Metadata
  tags: [String],
  images: [{ url: String, alt: String }],

  // Soft delete
  deletedAt: { type: Date, default: null, index: true },

  // Timestamps
  createdAt: { type: Date, default: Date.now, index: true },
  updatedAt: { type: Date, default: Date.now, index: true },
});

// Compound indexes for common queries
productSchema.index({ tenantId: 1, status: 1, createdAt: -1 });
productSchema.index({ tenantId: 1, category: 1, price: 1 });
```

---

## 🧪 Testing

### Repository Test
```typescript
describe("ProductRepository", () => {
  it("should find products by price range", async () => {
    const result = await repo.find({
      filter: {
        field: "price",
        operator: "between",
        value: [100, 500],
      },
    });
    expect(result.data).toBeDefined();
    expect(result.pagination.total).toBeGreaterThan(0);
  });

  it("should validate unsupported operators", async () => {
    expect(() =>
      repo.find({
        filter: {
          field: "price",
          operator: "invalidOp",
          value: 100,
        },
      })
    ).rejects.toThrow();
  });
});
```

---

## 📊 Performance Considerations

### Indexing Strategy
```typescript
// Add these indexes for optimal performance:
db.products.createIndex({ tenantId: 1 });
db.products.createIndex({ status: 1 });
db.products.createIndex({ price: 1 });
db.products.createIndex({ createdAt: -1 });
db.products.createIndex({ tenantId: 1, status: 1, createdAt: -1 });
db.products.createIndex({ tenantId: 1, category: 1 });
```

### Query Complexity Estimation
```typescript
// The engine estimates query complexity to prevent DOS
const complexity = validator.estimateComplexity(options);
if (complexity > maxComplexity) {
  throw new QueryComplexityException(complexity, maxComplexity);
}
```

### Pagination Limits
```typescript
// Always enforce maximum limits
pagination: {
  page: 1,
  limit: Math.min(req.query.limit, 1000), // Max 1000
  maxLimit: 1000,
}
```

---

## 🛠️ Extending the System

### Add Custom Operator
```typescript
import { getOperatorRegistry, FilterOperator } from "@/core";

const registry = getOperatorRegistry();

registry.register({
  name: "customOp" as FilterOperator,
  handler: (field, value) => ({
    [field]: { $customMongo: value },
  }),
  description: "Custom operator",
});

// Now use:
{ field: "metadata", operator: "customOp", value: "something" }
```

### Create Domain-Specific Repository
```typescript
export class OrderRepository extends BaseRepository<IOrder> {
  async findByCustomer(customerId: string) {
    return this.find({
      filter: {
        field: "customerId",
        operator: "eq",
        value: customerId,
      },
    });
  }

  async findPending() {
    return this.find({
      filter: {
        field: "status",
        operator: "eq",
        value: "pending",
      },
    });
  }
}
```

---

## 🚨 Error Handling

All errors are automatically converted to appropriate HTTP status codes:

```typescript
400 Bad Request  - ValidationException, FilterValidationException
401 Unauthorized - UnauthorizedException
403 Forbidden    - ForbiddenException, PermissionDeniedException
404 Not Found    - NotFoundException
409 Conflict     - ConflictException, DuplicateKeyException
429 Too Many     - QueryComplexityException, RateLimitException
500 Server Error - AppException, DatabaseException
```

---

## 📈 Monitoring

Enable query logging in development:
```typescript
const queryEngine = createQueryEngine(true, true); // enableQueryLogging = true

// Logs:
// [Query q_1707571200000_a1b2c3d4e5] Built query: {...}
// [Query q_1707571200000_a1b2c3d4e5] Executed in 45ms. Results: 20/5000
```

---

## 🎯 Production Checklist

- [ ] Add MongoDB indexes for all filterable fields
- [ ] Configure multi-tenancy middleware
- [ ] Setup JWT authentication
- [ ] Enable RBAC with field-level permissions
- [ ] Configure soft delete strategy
- [ ] Set query complexity limits
- [ ] Enable error handling middleware
- [ ] Setup query logging in development
- [ ] Document field schema for all models
- [ ] Add rate limiting
- [ ] Setup monitoring/alerting for slow queries
- [ ] Configure CORS if serving external clients
- [ ] Setup database backups
- [ ] Test error scenarios
- [ ] Load test with realistic query patterns

---

## 📝 License

This system is designed for enterprise applications. Use freely in your projects.

---

## 🤝 Contributing

To extend with new operators, validators, or features:

1. Add to appropriate core module
2. Update TypeScript types
3. Add unit tests
4. Document in QUERY_ENGINE_DOCUMENTATION.md
5. Add example in requestExamples.ts

---

## 📞 Support

For detailed documentation, see:
- [QUERY_ENGINE_DOCUMENTATION.md](./QUERY_ENGINE_DOCUMENTATION.md) - Full reference
- [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md) - Setup & patterns
- [requestExamples.ts](./examples/requestExamples.ts) - Real examples

---

## ✨ Summary

This enterprise query engine provides:
- ✅ **Type-safe** - Full TypeScript support
- ✅ **Modular** - Easy to extend
- ✅ **Secure** - Multi-tenancy, RBAC, field whitelisting
- ✅ **Scalable** - Query complexity protection, pagination limits
- ✅ **Production-ready** - Error handling, validation, soft deletes
- ✅ **Well-documented** - Comprehensive guides and examples

Perfect for SaaS platforms, enterprise applications, and high-scale systems.
