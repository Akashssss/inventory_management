/**
 * BASE REPOSITORY
 * Generic CRUD + advanced query operations
 * All domain repositories inherit from this
 */

import { Model } from "mongoose";
import { BaseEntity,  IRepository,
  QueryOptions,
  QueryResult,
  FilterNode, } from "../types/query.types";


import { getQueryEngine, MongoQueryEngine } from "../core";
import { NotFoundException ,DatabaseException } from "../exceptions/AppException";

/**
 * Generic repository for CRUD + advanced queries
 */
export class BaseRepository<T extends BaseEntity> implements IRepository<T> {
  protected model: Model<T>;
  protected queryEngine: MongoQueryEngine;

  constructor(model: Model<T>, queryEngine?: MongoQueryEngine) {
    this.model = model;
    this.queryEngine = queryEngine || getQueryEngine();
  }

  /**
   * Find with advanced query options
   * Supports filtering, searching, sorting, pagination, field selection
   */
  async find(options: QueryOptions): Promise<QueryResult<T>> {
    return this.queryEngine.execute(this.model, options);
  }

  /**
   * Find by ID
   */
  async findById(id: string): Promise<T | null> {
    try {
      return await this.model.findById(id).exec();
    } catch (error) {
      throw new DatabaseException(`Failed to find ${this.model.modelName} by ID`, error as Error);
    }
  }

  /**
   * Create a new document
   */
  async create(data: Partial<T>): Promise<T> {
    try {
      // Sanitize data - remove _id if it's an empty string or null to let MongoDB generate it
      const sanitizedData = { ...data } as any;
      if ('_id' in sanitizedData && (!sanitizedData._id || sanitizedData._id === "")) {
        delete sanitizedData._id;
      }
      delete sanitizedData.__v;

      const doc = new this.model(sanitizedData);
      return await doc.save();
    } catch (error) {
      throw new DatabaseException(`Failed to create ${this.model.modelName}`, error as Error);
    }
  }

  /**
   * Update document by ID
   */
  async update(id: string, data: Partial<T>): Promise<T> {
    try {
      // Sanitize data - do not allow updating _id
      const sanitizedData = { ...data } as any;
      delete sanitizedData._id;
      delete sanitizedData.__v;

      const doc = await this.model.findByIdAndUpdate(
        id,
        { ...sanitizedData, updatedAt: new Date() } as any,
        { new: true, runValidators: true }
      );

      if (!doc) {
        throw new NotFoundException(this.model.modelName, id);
      }

      return doc;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new DatabaseException(`Failed to update ${this.model.modelName}`, error as Error);
    }
  }

  /**
   * Hard delete document by ID
   * CAUTION: This is permanent deletion
   */
  async delete(id: string): Promise<void> {
    try {
      const result = await this.model.findByIdAndDelete(id);

      if (!result) {
        throw new NotFoundException(this.model.modelName, id);
      }
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new DatabaseException(`Failed to delete ${this.model.modelName}`, error as Error);
    }
  }

  /**
   * Soft delete document by ID
   * Sets deletedAt timestamp instead of removing
   */
  async softDelete(id: string): Promise<void> {
    try {
      const result = await this.model.findByIdAndUpdate(
        id,
        { deletedAt: new Date() } as any,
        { new: true }
      );

      if (!result) {
        throw new NotFoundException(this.model.modelName, id);
      }
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new DatabaseException(
        `Failed to soft delete ${this.model.modelName}`,
        error as Error
      );
    }
  }

  /**
   * Restore a soft-deleted document
   */
  async restore(id: string): Promise<void> {
    try {
      const result = await this.model.findByIdAndUpdate(
        id,
        { $unset: { deletedAt: 1 } } as any,
        { new: true }
      );

      if (!result) {
        throw new NotFoundException(this.model.modelName, id);
      }
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new DatabaseException(
        `Failed to restore ${this.model.modelName}`,
        error as Error
      );
    }
  }

  /**
   * Bulk write operations
   * For advanced bulk operations not covered by CRUD
   */
  async bulkWrite(operations: any[]): Promise<any> {
    try {
      return await (this.model.collection as any).bulkWrite(operations);
    } catch (error) {
      throw new DatabaseException(
        `Bulk write failed for ${this.model.modelName}`,
        error as Error
      );
    }
  }

  /**
   * Count documents matching filter
   */
  async count(filter?: FilterNode): Promise<number> {
    try {
      if (!filter) {
        return await this.model.countDocuments({
          $or: [{ deletedAt: null }, { deletedAt: undefined }],
        });
      }

      const options: QueryOptions = {
        filter,
        includeSoftDeleted: false,
      };

      const result = await this.find(options);
      return result.pagination.total;
    } catch (error) {
      throw new DatabaseException(
        `Failed to count ${this.model.modelName}`,
        error as Error
      );
    }
  }

  /**
   * Check if document exists
   */
  async exists(id: string): Promise<boolean> {
    try {
      const doc = await this.model.findById(id).select("_id").lean();
      return Boolean(doc);
    } catch (error) {
      throw new DatabaseException(
        `Failed to check existence of ${this.model.modelName}`,
        error as Error
      );
    }
  }

  /**
   * Create index on field(s)
   * Useful for performance optimization
   */
  async createIndex(spec: Record<string, 1 | -1>, options?: any): Promise<void> {
    try {
      await this.model.collection.createIndex(spec, options);
    } catch (error) {
      throw new DatabaseException(
        `Failed to create index on ${this.model.modelName}`,
        error as Error
      );
    }
  }

  /**
   * Get list of all indexes
   */
  async getIndexes(): Promise<any> {
    try {
      return await this.model.collection.getIndexes();
    } catch (error) {
      throw new DatabaseException(
        `Failed to get indexes for ${this.model.modelName}`,
        error as Error
      );
    }
  }

  /**
   * Drop an index
   */
  async dropIndex(indexName: string): Promise<any> {
    try {
      return await this.model.collection.dropIndex(indexName);
    } catch (error) {
      throw new DatabaseException(
        `Failed to drop index on ${this.model.modelName}`,
        error as Error
      );
    }
  }

  /**
   * Get model instance
   */
  getModel(): Model<T> {
    return this.model;
  }

  /**
   * Get query engine
   */
  getQueryEngine(): MongoQueryEngine {
    return this.queryEngine;
  }
}

/**
 * FACTORY FUNCTION
 */

export function createRepository<T extends BaseEntity>(
  model: Model<T>,
  queryEngine?: MongoQueryEngine
): BaseRepository<T> {
  return new BaseRepository(model, queryEngine);
}
