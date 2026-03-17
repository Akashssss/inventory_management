/**
 * EXPRESS APP SETUP
 * Complete initialization of the query engine system
 */

// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference types="node" />

import express, { Express, Request, Response, NextFunction } from "express";
import path from "path";
import { createQueryEngine } from "@/core";
import { applySecurityMiddleware, applyAuthMiddleware } from "@/middleware/securityMiddleware";
import { errorHandler } from "@/exceptions/AppException";
import { ProductRepository, productFieldSchema } from "@/repositories/ProductRepository";
import { ProductController } from "@/controllers/ProductController";
import { CategoryRepository } from "@/repositories/CategoryRepository";
import { createCategoryController } from "@/controllers/CategoryController";
import { SettingRepository } from "@/repositories/SettingRepository";
import { createSettingController } from "@/controllers/SettingController";
import { TransactionRepository } from "@/repositories/TransactionRepository";
import { createTransactionController } from "@/controllers/TransactionController";
import { upload } from "@/middleware/uploadMiddleware";

import authRoutes from "@/routes/authRoutes";
import orderRoutes from "@/routes/orderRoutes";
import quickAddRoutes from "@/routes/quickAddRoutes";
import userRoutes from "@/routes/userRoutes";
import { jwtAuth } from "@/middleware/authMiddleware";
import { createDashboardController } from "@/controllers/DashboardController";

/**
 * Initialize and configure Express app with query engine
 */
export function createApp(): Express {
  const app = express();

  // ========================================================================
  // MIDDLEWARE SETUP
  // ========================================================================

  // Body parser
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ limit: "10mb", extended: true }));

  // CORS middleware (allow all origins for development)
  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Access-Token");
    if (req.method === "OPTIONS") res.sendStatus(200);
    else next();
  });

  // Security & tenant/auth middleware
  applySecurityMiddleware(app);

  // ========================================================================
  // QUERY ENGINE INITIALIZATION
  // ========================================================================

  const queryEngine = createQueryEngine(
    true, // enableValidation
    process.env.NODE_ENV === "development" // enableQueryLogging
  );

  // Register field schemas
  queryEngine.registerFieldSchema("products", productFieldSchema);

  // Optional: Customize query engine
  if (process.env.MAX_QUERY_COMPLEXITY) {
    queryEngine.setMaxQueryComplexity(
      Number(process.env.MAX_QUERY_COMPLEXITY)
    );
  }

  // ========================================================================
  // REPOSITORIES
  // ========================================================================

  const productRepository = new ProductRepository(queryEngine);
  const categoryRepository = new CategoryRepository(queryEngine);
  const settingRepository = new SettingRepository(queryEngine);
  const transactionRepository = new TransactionRepository(queryEngine);

  // ========================================================================
  // CONTROLLERS
  // ========================================================================

  const productController = new ProductController(productRepository);
  const categoryController = createCategoryController(categoryRepository);
  const settingController = createSettingController(settingRepository);
  const transactionController = createTransactionController(transactionRepository);
  const dashboardController = createDashboardController();

  // ========================================================================
  // ROUTES - PRODUCTS
  // ========================================================================

  const productsRouter = express.Router();

  // Special routes first (must come before /:id routes)
  // GET /api/products/low-stock - Low stock
  productsRouter.get("/low-stock", (req, res, next) =>
    productController.getLowStock(req, res, next)
  );

  // GET /api/products/search - Search
  productsRouter.get("/search", (req, res, next) =>
    productController.searchProducts(req, res, next)
  );

  // POST /api/products/advanced-search - Advanced search
  productsRouter.post("/advanced-search", (req, res, next) =>
    productController.advancedSearch(req, res, next)
  );

  // GET /api/products/small-product-categories
  productsRouter.get("/small-product-categories", (req, res, next) =>
    productController.getSmallProductCategories(req, res, next)
  );

  // GET /api/products/small-product-prices
  productsRouter.get("/small-product-prices", (req, res, next) =>
    productController.getSmallProductPrices(req, res, next)
  );

  // GET /api/products/category/:category - By category
  productsRouter.get("/category/:category", (req, res, next) =>
    productController.getByCategory(req, res, next)
  );

  // Root routes
  // POST /api/products/search - Advanced Search with POST body
  productsRouter.post("/search", (req, res, next) =>
    productController.searchProducts(req, res, next)
  );

  // GET /api/products - List with advanced filtering
  productsRouter.get("/", (req, res, next) =>
    productController.getProducts(req, res, next)
  );

  // POST /api/products - Create a new product (handles image upload)
  productsRouter.post("/", upload.single("image"), (req, res, next) => {
    productController.createProduct(req, res, next);
  });

  // ID-based routes
  // GET /api/products/:id - Get by ID
  productsRouter.get("/:id", (req, res, next) =>
    productController.getProductById(req, res, next)
  );

  // PUT /api/products/:id - Update product completely (handles image upload)
  productsRouter.put("/:id", upload.single("image"), (req, res, next) => {
    productController.updateProduct(req, res, next);
  });

  // DELETE /api/products/:id - Soft delete
  productsRouter.delete("/:id", (req, res, next) =>
    productController.deleteProduct(req, res, next)
  );

  // POST /api/products/:id/restore - Restore
  productsRouter.post("/:id/restore", (req, res, next) =>
    productController.restoreProduct(req, res, next)
  );
  
  app.use("/api/products", applyAuthMiddleware, productsRouter);

  // ========================================================================
  // ROUTES - CATEGORIES
  // ========================================================================
  const categoriesRouter = express.Router();
  
  categoriesRouter.get("/", (req, res, next) => categoryController.getCategories(req, res, next));
  categoriesRouter.post("/", (req, res, next) => categoryController.createCategory(req, res, next));
  categoriesRouter.put("/:id", (req, res, next) => categoryController.updateCategory(req, res, next));
  categoriesRouter.delete("/:id", (req, res, next) => categoryController.deleteCategory(req, res, next));
  
  app.use("/api/categories", applyAuthMiddleware, categoriesRouter);

  // ========================================================================
  // ROUTES - SETTINGS
  // ========================================================================
  const settingsRouter = express.Router();
  
  settingsRouter.get("/", (req, res, next) => settingController.getSetting(req, res, next));
  settingsRouter.put("/", (req, res, next) => settingController.updateSetting(req, res, next));

  app.use("/api/settings", applyAuthMiddleware, settingsRouter);

  // ========================================================================
  // ROUTES - TRANSACTIONS
  // ========================================================================
  const transactionsRouter = express.Router();
  
  transactionsRouter.get("/pending-quick-adds", (req, res, next) => transactionController.getPendingQuickAdds(req, res, next));
  transactionsRouter.post("/resolve-quick-add", (req, res, next) => transactionController.resolveQuickAdd(req, res, next));
  
  transactionsRouter.get("/", (req, res, next) => transactionController.getTransactions(req, res, next));
  transactionsRouter.post("/search", (req, res, next) => transactionController.getTransactions(req, res, next));
  transactionsRouter.get("/stats", (req, res, next) => transactionController.getTransactionStats(req, res, next));
  transactionsRouter.post("/", (req, res, next) => transactionController.createTransaction(req, res, next));

  app.use("/api/transactions", jwtAuth, transactionsRouter);

  // AUTH ROUTES (NO AUTH REQUIRED - signup/login endpoints)
  app.use("/api/auth", authRoutes);

  // ORDERS (REQUIRES AUTH)
  app.use("/api/orders", applyAuthMiddleware, orderRoutes);

  // QUICK ADD / RECONCILIATION (REQUIRES AUTH)
  app.use("/api/quick", applyAuthMiddleware, quickAddRoutes);

  // USERS (REQUIRES AUTH)
  app.use("/api/users", applyAuthMiddleware, userRoutes);

  // DASHBOARD STATS (REQUIRES AUTH)
  app.get("/api/dashboard/admin", jwtAuth, (req, res, next) => dashboardController.getAdminStats(req, res, next));
  app.get("/api/dashboard/seller", jwtAuth, (req, res, next) => dashboardController.getSellerStats(req, res, next));

  // ========================================================================
  // HEALTH CHECK
  // ========================================================================

  app.get("/health", (req: Request, res: Response) => {
    res.status(200).json({
      status: "ok",
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
    });
  });

  // ========================================================================
  // STATIC FILES
  // ========================================================================
  app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

  // ========================================================================
  // 404 HANDLER
  // ========================================================================

  app.use((req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      error: {
        code: "NOT_FOUND",
        message: `Route ${req.method} ${req.path} not found`,
      },
    });
  });

  // ========================================================================
  // ERROR HANDLER (MUST BE LAST)
  // ========================================================================

  app.use((error: any, req: Request, res: Response, next: NextFunction) => {
    errorHandler(error, req, res, next);
  });

  return app;
}

/**
 * Start server
 */
export function startServer(port: number = 3000): void {
  const app = createApp();

  app.listen(port, () => {
    console.log(`✅ Server running on http://localhost:${port}`);
    console.log(`📚 API Documentation: http://localhost:${port}/api-docs`);
    console.log(`🏥 Health check: http://localhost:${port}/health`);
  });
}

// ============================================================================
// USAGE IN MAIN.TS
// ============================================================================

/**
 * main.ts
 *
 * import { startServer } from '@/app';
 *
 * const PORT = process.env.PORT || 3000;
 * startServer(Number(PORT));
 */
