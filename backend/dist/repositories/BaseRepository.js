"use strict";
/**
 * BASE REPOSITORY
 * Generic CRUD + advanced query operations
 * All domain repositories inherit from this
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseRepository = void 0;
exports.createRepository = createRepository;
const core_1 = require("../core");
const AppException_1 = require("../exceptions/AppException");
/**
 * Generic repository for CRUD + advanced queries
 */
class BaseRepository {
    constructor(model, queryEngine) {
        this.model = model;
        this.queryEngine = queryEngine || (0, core_1.getQueryEngine)();
    }
    /**
     * Find with advanced query options
     * Supports filtering, searching, sorting, pagination, field selection
     */
    async find(options) {
        return this.queryEngine.execute(this.model, options);
    }
    /**
     * Find by ID
     */
    async findById(id) {
        try {
            return await this.model.findById(id).exec();
        }
        catch (error) {
            throw new AppException_1.DatabaseException(`Failed to find ${this.model.modelName} by ID`, error);
        }
    }
    /**
     * Create a new document
     */
    async create(data) {
        try {
            // Sanitize data - remove _id if it's an empty string or null to let MongoDB generate it
            const sanitizedData = { ...data };
            if ('_id' in sanitizedData && (!sanitizedData._id || sanitizedData._id === "")) {
                delete sanitizedData._id;
            }
            delete sanitizedData.__v;
            const doc = new this.model(sanitizedData);
            return await doc.save();
        }
        catch (error) {
            throw new AppException_1.DatabaseException(`Failed to create ${this.model.modelName}`, error);
        }
    }
    /**
     * Update document by ID
     */
    async update(id, data) {
        try {
            // Sanitize data - do not allow updating _id
            const sanitizedData = { ...data };
            delete sanitizedData._id;
            delete sanitizedData.__v;
            const doc = await this.model.findByIdAndUpdate(id, { ...sanitizedData, updatedAt: new Date() }, { new: true, runValidators: true });
            if (!doc) {
                throw new AppException_1.NotFoundException(this.model.modelName, id);
            }
            return doc;
        }
        catch (error) {
            if (error instanceof AppException_1.NotFoundException)
                throw error;
            throw new AppException_1.DatabaseException(`Failed to update ${this.model.modelName}`, error);
        }
    }
    /**
     * Hard delete document by ID
     * CAUTION: This is permanent deletion
     */
    async delete(id) {
        try {
            const result = await this.model.findByIdAndDelete(id);
            if (!result) {
                throw new AppException_1.NotFoundException(this.model.modelName, id);
            }
        }
        catch (error) {
            if (error instanceof AppException_1.NotFoundException)
                throw error;
            throw new AppException_1.DatabaseException(`Failed to delete ${this.model.modelName}`, error);
        }
    }
    /**
     * Soft delete document by ID
     * Sets deletedAt timestamp instead of removing
     */
    async softDelete(id) {
        try {
            const result = await this.model.findByIdAndUpdate(id, { deletedAt: new Date() }, { new: true });
            if (!result) {
                throw new AppException_1.NotFoundException(this.model.modelName, id);
            }
        }
        catch (error) {
            if (error instanceof AppException_1.NotFoundException)
                throw error;
            throw new AppException_1.DatabaseException(`Failed to soft delete ${this.model.modelName}`, error);
        }
    }
    /**
     * Restore a soft-deleted document
     */
    async restore(id) {
        try {
            const result = await this.model.findByIdAndUpdate(id, { $unset: { deletedAt: 1 } }, { new: true });
            if (!result) {
                throw new AppException_1.NotFoundException(this.model.modelName, id);
            }
        }
        catch (error) {
            if (error instanceof AppException_1.NotFoundException)
                throw error;
            throw new AppException_1.DatabaseException(`Failed to restore ${this.model.modelName}`, error);
        }
    }
    /**
     * Bulk write operations
     * For advanced bulk operations not covered by CRUD
     */
    async bulkWrite(operations) {
        try {
            return await this.model.collection.bulkWrite(operations);
        }
        catch (error) {
            throw new AppException_1.DatabaseException(`Bulk write failed for ${this.model.modelName}`, error);
        }
    }
    /**
     * Count documents matching filter
     */
    async count(filter) {
        try {
            if (!filter) {
                return await this.model.countDocuments({
                    $or: [{ deletedAt: null }, { deletedAt: undefined }],
                });
            }
            const options = {
                filter,
                includeSoftDeleted: false,
            };
            const result = await this.find(options);
            return result.pagination.total;
        }
        catch (error) {
            throw new AppException_1.DatabaseException(`Failed to count ${this.model.modelName}`, error);
        }
    }
    /**
     * Check if document exists
     */
    async exists(id) {
        try {
            const doc = await this.model.findById(id).select("_id").lean();
            return Boolean(doc);
        }
        catch (error) {
            throw new AppException_1.DatabaseException(`Failed to check existence of ${this.model.modelName}`, error);
        }
    }
    /**
     * Create index on field(s)
     * Useful for performance optimization
     */
    async createIndex(spec, options) {
        try {
            await this.model.collection.createIndex(spec, options);
        }
        catch (error) {
            throw new AppException_1.DatabaseException(`Failed to create index on ${this.model.modelName}`, error);
        }
    }
    /**
     * Get list of all indexes
     */
    async getIndexes() {
        try {
            return await this.model.collection.getIndexes();
        }
        catch (error) {
            throw new AppException_1.DatabaseException(`Failed to get indexes for ${this.model.modelName}`, error);
        }
    }
    /**
     * Drop an index
     */
    async dropIndex(indexName) {
        try {
            return await this.model.collection.dropIndex(indexName);
        }
        catch (error) {
            throw new AppException_1.DatabaseException(`Failed to drop index on ${this.model.modelName}`, error);
        }
    }
    /**
     * Get model instance
     */
    getModel() {
        return this.model;
    }
    /**
     * Get query engine
     */
    getQueryEngine() {
        return this.queryEngine;
    }
}
exports.BaseRepository = BaseRepository;
/**
 * FACTORY FUNCTION
 */
function createRepository(model, queryEngine) {
    return new BaseRepository(model, queryEngine);
}
//# sourceMappingURL=BaseRepository.js.map