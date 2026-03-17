import { BaseRepository } from "./BaseRepository";
import { ICategory } from "../models/Category";
import { MongoQueryEngine } from "../core";
import { FieldMetadata } from "../types/query.types";
export declare const categoryFieldSchema: FieldMetadata[];
export declare class CategoryRepository extends BaseRepository<ICategory> {
    constructor(queryEngine?: MongoQueryEngine);
}
export declare function getCategoryRepository(queryEngine?: MongoQueryEngine): CategoryRepository;
//# sourceMappingURL=CategoryRepository.d.ts.map