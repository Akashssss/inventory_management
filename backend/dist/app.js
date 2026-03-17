"use strict";
/**
 * EXPRESS APP SETUP
 * Complete initialization of the query engine system
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApp = createApp;
exports.startServer = startServer;
// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference types="node" />
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const core_1 = require("@/core");
const securityMiddleware_1 = require("@/middleware/securityMiddleware");
const AppException_1 = require("@/exceptions/AppException");
const ProductRepository_1 = require("@/repositories/ProductRepository");
const ProductController_1 = require("@/controllers/ProductController");
const CategoryRepository_1 = require("@/repositories/CategoryRepository");
const CategoryController_1 = require("@/controllers/CategoryController");
const SettingRepository_1 = require("@/repositories/SettingRepository");
const SettingController_1 = require("@/controllers/SettingController");
const TransactionRepository_1 = require("@/repositories/TransactionRepository");
const TransactionController_1 = require("@/controllers/TransactionController");
const uploadMiddleware_1 = require("@/middleware/uploadMiddleware");
const authRoutes_1 = __importDefault(require("@/routes/authRoutes"));
const orderRoutes_1 = __importDefault(require("@/routes/orderRoutes"));
const quickAddRoutes_1 = __importDefault(require("@/routes/quickAddRoutes"));
const userRoutes_1 = __importDefault(require("@/routes/userRoutes"));
const authMiddleware_1 = require("@/middleware/authMiddleware");
const DashboardController_1 = require("@/controllers/DashboardController");
/**
 * Initialize and configure Express app with query engine
 */
function createApp() {
    const app = (0, express_1.default)();
    // ========================================================================
    // MIDDLEWARE SETUP
    // ========================================================================
    // Body parser
    app.use(express_1.default.json({ limit: "10mb" }));
    app.use(express_1.default.urlencoded({ limit: "10mb", extended: true }));
    // CORS middleware (allow all origins for development)
    app.use((req, res, next) => {
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
        res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Access-Token");
        if (req.method === "OPTIONS")
            res.sendStatus(200);
        else
            next();
    });
    // Security & tenant/auth middleware
    (0, securityMiddleware_1.applySecurityMiddleware)(app);
    // ========================================================================
    // QUERY ENGINE INITIALIZATION
    // ========================================================================
    const queryEngine = (0, core_1.createQueryEngine)(true, // enableValidation
    process.env.NODE_ENV === "development" // enableQueryLogging
    );
    // Register field schemas
    queryEngine.registerFieldSchema("products", ProductRepository_1.productFieldSchema);
    // Optional: Customize query engine
    if (process.env.MAX_QUERY_COMPLEXITY) {
        queryEngine.setMaxQueryComplexity(Number(process.env.MAX_QUERY_COMPLEXITY));
    }
    // ========================================================================
    // REPOSITORIES
    // ========================================================================
    const productRepository = new ProductRepository_1.ProductRepository(queryEngine);
    const categoryRepository = new CategoryRepository_1.CategoryRepository(queryEngine);
    const settingRepository = new SettingRepository_1.SettingRepository(queryEngine);
    const transactionRepository = new TransactionRepository_1.TransactionRepository(queryEngine);
    // ========================================================================
    // CONTROLLERS
    // ========================================================================
    const productController = new ProductController_1.ProductController(productRepository);
    const categoryController = (0, CategoryController_1.createCategoryController)(categoryRepository);
    const settingController = (0, SettingController_1.createSettingController)(settingRepository);
    const transactionController = (0, TransactionController_1.createTransactionController)(transactionRepository);
    const dashboardController = (0, DashboardController_1.createDashboardController)();
    // ========================================================================
    // ROUTES - PRODUCTS
    // ========================================================================
    const productsRouter = express_1.default.Router();
    // Special routes first (must come before /:id routes)
    // GET /api/products/low-stock - Low stock
    productsRouter.get("/low-stock", (req, res, next) => productController.getLowStock(req, res, next));
    // GET /api/products/search - Search
    productsRouter.get("/search", (req, res, next) => productController.searchProducts(req, res, next));
    // POST /api/products/advanced-search - Advanced search
    productsRouter.post("/advanced-search", (req, res, next) => productController.advancedSearch(req, res, next));
    // GET /api/products/small-product-categories
    productsRouter.get("/small-product-categories", (req, res, next) => productController.getSmallProductCategories(req, res, next));
    // GET /api/products/small-product-prices
    productsRouter.get("/small-product-prices", (req, res, next) => productController.getSmallProductPrices(req, res, next));
    // GET /api/products/category/:category - By category
    productsRouter.get("/category/:category", (req, res, next) => productController.getByCategory(req, res, next));
    // Root routes
    // POST /api/products/search - Advanced Search with POST body
    productsRouter.post("/search", (req, res, next) => productController.searchProducts(req, res, next));
    // GET /api/products - List with advanced filtering
    productsRouter.get("/", (req, res, next) => productController.getProducts(req, res, next));
    // POST /api/products - Create a new product (handles image upload)
    productsRouter.post("/", uploadMiddleware_1.upload.single("image"), (req, res, next) => {
        productController.createProduct(req, res, next);
    });
    // ID-based routes
    // GET /api/products/:id - Get by ID
    productsRouter.get("/:id", (req, res, next) => productController.getProductById(req, res, next));
    // PUT /api/products/:id - Update product completely (handles image upload)
    productsRouter.put("/:id", uploadMiddleware_1.upload.single("image"), (req, res, next) => {
        productController.updateProduct(req, res, next);
    });
    // DELETE /api/products/:id - Soft delete
    productsRouter.delete("/:id", (req, res, next) => productController.deleteProduct(req, res, next));
    // POST /api/products/:id/restore - Restore
    productsRouter.post("/:id/restore", (req, res, next) => productController.restoreProduct(req, res, next));
    app.use("/api/products", securityMiddleware_1.applyAuthMiddleware, productsRouter);
    // ========================================================================
    // ROUTES - CATEGORIES
    // ========================================================================
    const categoriesRouter = express_1.default.Router();
    categoriesRouter.get("/", (req, res, next) => categoryController.getCategories(req, res, next));
    categoriesRouter.post("/", (req, res, next) => categoryController.createCategory(req, res, next));
    categoriesRouter.put("/:id", (req, res, next) => categoryController.updateCategory(req, res, next));
    categoriesRouter.delete("/:id", (req, res, next) => categoryController.deleteCategory(req, res, next));
    app.use("/api/categories", securityMiddleware_1.applyAuthMiddleware, categoriesRouter);
    // ========================================================================
    // ROUTES - SETTINGS
    // ========================================================================
    const settingsRouter = express_1.default.Router();
    settingsRouter.get("/", (req, res, next) => settingController.getSetting(req, res, next));
    settingsRouter.put("/", (req, res, next) => settingController.updateSetting(req, res, next));
    app.use("/api/settings", securityMiddleware_1.applyAuthMiddleware, settingsRouter);
    // ========================================================================
    // ROUTES - TRANSACTIONS
    // ========================================================================
    const transactionsRouter = express_1.default.Router();
    transactionsRouter.get("/pending-quick-adds", (req, res, next) => transactionController.getPendingQuickAdds(req, res, next));
    transactionsRouter.post("/resolve-quick-add", (req, res, next) => transactionController.resolveQuickAdd(req, res, next));
    transactionsRouter.get("/", (req, res, next) => transactionController.getTransactions(req, res, next));
    transactionsRouter.post("/search", (req, res, next) => transactionController.getTransactions(req, res, next));
    transactionsRouter.get("/stats", (req, res, next) => transactionController.getTransactionStats(req, res, next));
    transactionsRouter.post("/", (req, res, next) => transactionController.createTransaction(req, res, next));
    app.use("/api/transactions", authMiddleware_1.jwtAuth, transactionsRouter);
    // AUTH ROUTES (NO AUTH REQUIRED - signup/login endpoints)
    app.use("/api/auth", authRoutes_1.default);
    // ORDERS (REQUIRES AUTH)
    app.use("/api/orders", securityMiddleware_1.applyAuthMiddleware, orderRoutes_1.default);
    // QUICK ADD / RECONCILIATION (REQUIRES AUTH)
    app.use("/api/quick", securityMiddleware_1.applyAuthMiddleware, quickAddRoutes_1.default);
    // USERS (REQUIRES AUTH)
    app.use("/api/users", securityMiddleware_1.applyAuthMiddleware, userRoutes_1.default);
    // DASHBOARD STATS (REQUIRES AUTH)
    app.get("/api/dashboard/admin", authMiddleware_1.jwtAuth, (req, res, next) => dashboardController.getAdminStats(req, res, next));
    app.get("/api/dashboard/seller", authMiddleware_1.jwtAuth, (req, res, next) => dashboardController.getSellerStats(req, res, next));
    // ========================================================================
    // HEALTH CHECK
    // ========================================================================
    app.get("/health", (req, res) => {
        res.status(200).json({
            status: "ok",
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV,
        });
    });
    // ========================================================================
    // STATIC FILES
    // ========================================================================
    app.use("/uploads", express_1.default.static(path_1.default.join(process.cwd(), "uploads")));
    // ========================================================================
    // 404 HANDLER
    // ========================================================================
    app.use((req, res) => {
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
    app.use((error, req, res, next) => {
        (0, AppException_1.errorHandler)(error, req, res, next);
    });
    return app;
}
/**
 * Start server
 */
function startServer(port = 3000) {
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
//# sourceMappingURL=app.js.map