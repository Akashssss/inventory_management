/**
 * PRODUCT CONTROLLER
 * Thin controller using repository pattern
 */
import { Request, Response, NextFunction } from "express";
import { ProductRepository } from "@/repositories/ProductRepository";
/**
 * Product Controller
 * Handles HTTP requests and delegates to repository
 */
export declare class ProductController {
    private repository;
    constructor(repository: ProductRepository);
    /**
     * GET /products
     * Advanced search with filtering, sorting, pagination
     *
     * Query parameters:
     * - page: number (default: 1)
     * - limit: number (default: 20)
     * - search: string (full-text search)
     * - sort: JSON array of { field, order }
     * - fields: JSON array of field names to select
     *
     * Request body (filter):
     * {
     *   "filter": {
     *     "logic": "and",
     *     "conditions": [...]
     *   }
     * }
     */
    getProducts(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * GET /products/:id
     * Get product by ID
     */
    getProductById(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * POST /products
     * Create new product
     */
    getSmallProductCategories(req: Request, res: Response, next: NextFunction): Promise<void>;
    getSmallProductPrices(req: Request, res: Response, next: NextFunction): Promise<void>;
    createProduct(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * PUT /products/:id
     * Update product
     */
    updateProduct(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * DELETE /products/:id
     * Soft delete product
     */
    deleteProduct(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * POST /products/:id/restore
     * Restore soft-deleted product
     */
    restoreProduct(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * GET /products/search
     * Simple search endpoint
     */
    searchProducts(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * GET /products/by-category/:category
     * Find products by category
     */
    getByCategory(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * GET /products/low-stock
     * Find low stock products
     */
    getLowStock(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * POST /products/advanced-search
     * Complex filtered search
     *
     * Request body:
     * {
     *   "category": "electronics",
     *   "minPrice": 100,
     *   "maxPrice": 1000,
     *   "minStock": 5
     * }
     */
    advancedSearch(req: Request, res: Response, next: NextFunction): Promise<void>;
}
/**
 * FACTORY FUNCTION
 */
export declare function createProductController(repository: ProductRepository): ProductController;
//# sourceMappingURL=ProductController.d.ts.map