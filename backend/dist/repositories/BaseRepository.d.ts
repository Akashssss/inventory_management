/**
 * BASE REPOSITORY
 * Generic CRUD + advanced query operations
 * All domain repositories inherit from this
 */
import { Model } from "mongoose";
import { BaseEntity, IRepository, QueryOptions, QueryResult, FilterNode } from "../types/query.types";
import { MongoQueryEngine } from "../core";
/**
 * Generic repository for CRUD + advanced queries
 */
export declare class BaseRepository<T extends BaseEntity> implements IRepository<T> {
    protected model: Model<T>;
    protected queryEngine: MongoQueryEngine;
    constructor(model: Model<T>, queryEngine?: MongoQueryEngine);
    /**
     * Find with advanced query options
     * Supports filtering, searching, sorting, pagination, field selection
     */
    find(options: QueryOptions): Promise<QueryResult<T>>;
    /**
     * Find by ID
     */
    findById(id: string): Promise<T | null>;
    /**
     * Create a new document
     */
    create(data: Partial<T>): Promise<T>;
    /**
     * Update document by ID
     */
    update(id: string, data: Partial<T>): Promise<T>;
    /**
     * Hard delete document by ID
     * CAUTION: This is permanent deletion
     */
    delete(id: string): Promise<void>;
    /**
     * Soft delete document by ID
     * Sets deletedAt timestamp instead of removing
     */
    softDelete(id: string): Promise<void>;
    /**
     * Restore a soft-deleted document
     */
    restore(id: string): Promise<void>;
    /**
     * Bulk write operations
     * For advanced bulk operations not covered by CRUD
     */
    bulkWrite(operations: any[]): Promise<any>;
    /**
     * Count documents matching filter
     */
    count(filter?: FilterNode): Promise<number>;
    /**
     * Check if document exists
     */
    exists(id: string): Promise<boolean>;
    /**
     * Create index on field(s)
     * Useful for performance optimization
     */
    createIndex(spec: Record<string, 1 | -1>, options?: any): Promise<void>;
    /**
     * Get list of all indexes
     */
    getIndexes(): Promise<any>;
    /**
     * Drop an index
     */
    dropIndex(indexName: string): Promise<any>;
    /**
     * Get model instance
     */
    getModel(): Model<T>;
    /**
     * Get query engine
     */
    getQueryEngine(): MongoQueryEngine;
}
/**
 * FACTORY FUNCTION
 */
export declare function createRepository<T extends BaseEntity>(model: Model<T>, queryEngine?: MongoQueryEngine): BaseRepository<T>;
//# sourceMappingURL=BaseRepository.d.ts.map