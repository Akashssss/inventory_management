/**
 * PRODUCT REPOSITORY
 * Domain-specific repository for Product operations
 */
import { QueryOptions, QueryResult, FieldMetadata } from "../types/query.types";
import { BaseRepository } from "./BaseRepository";
import { IProduct } from "../models/Product";
import { MongoQueryEngine } from "../core";
/**
 * Product field schema
 * Used for validation and field whitelisting
 */
export declare const productFieldSchema: FieldMetadata[];
/**
 * Product Repository
 * Extends BaseRepository with Product-specific methods
 */
export declare class ProductRepository extends BaseRepository<IProduct> {
    constructor(queryEngine?: MongoQueryEngine);
    /**
     * Find products by category
     */
    findByCategory(category: string, options?: Partial<QueryOptions>): Promise<QueryResult<IProduct>>;
    /**
     * Find low stock products
     */
    findLowStock(threshold?: number, options?: Partial<QueryOptions>): Promise<QueryResult<IProduct>>;
    /**
     * Find products within price range
     */
    findByPriceRange(minPrice: number, maxPrice: number, options?: Partial<QueryOptions>): Promise<QueryResult<IProduct>>;
    /**
     * Search products by name and description
     */
    search(query: string, options?: Partial<QueryOptions>): Promise<QueryResult<IProduct>>;
    /**
     * Find active products only
     */
    findActive(options?: Partial<QueryOptions>): Promise<QueryResult<IProduct>>;
    /**
     * Find products by multiple criteria (complex query)
     */
    findByAdvancedCriteria(category: string, minPrice: number, maxPrice: number, minStock?: number, options?: Partial<QueryOptions>): Promise<QueryResult<IProduct>>;
    getSmallProductCategories(tenantId?: string): Promise<string[]>;
    getSmallProductPrices(categoryName: string, tenantId?: string): Promise<number[]>;
}
/**
 * FACTORY FUNCTION
 */
export declare function createProductRepository(queryEngine?: MongoQueryEngine): ProductRepository;
export declare function getProductRepository(): ProductRepository;
export declare function resetProductRepository(): void;
//# sourceMappingURL=ProductRepository.d.ts.map