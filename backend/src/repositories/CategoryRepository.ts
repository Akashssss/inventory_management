import { BaseRepository } from "./BaseRepository";
import { Category, ICategory } from "../models/Category";
import { MongoQueryEngine } from "../core";
import { FieldMetadata } from "../types/query.types";

export const categoryFieldSchema: FieldMetadata[] = [
  { name: "name", type: "string", filterable: true, searchable: true, sortable: true, selectable: true },
  { name: "description", type: "string", filterable: true, searchable: true, sortable: true, selectable: true },
  { name: "isActive", type: "boolean", filterable: true, sortable: true, selectable: true },
  { name: "tenantId", type: "string", filterable: true, selectable: true },
  { name: "createdAt", type: "date", filterable: true, sortable: true, selectable: true },
];

export class CategoryRepository extends BaseRepository<ICategory> {
  constructor(queryEngine?: MongoQueryEngine) {
    super(Category, queryEngine);
    this.queryEngine.registerFieldSchema("categories", categoryFieldSchema);
  }
}

export function getCategoryRepository(queryEngine?: MongoQueryEngine): CategoryRepository {
  return new CategoryRepository(queryEngine);
}
