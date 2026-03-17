import { BaseRepository } from "./BaseRepository";
import { Transaction, ITransaction } from "../models/Transaction";
import { MongoQueryEngine } from "../core";
import { FieldMetadata } from "../types/query.types";

export const transactionFieldSchema: FieldMetadata[] = [
  { name: "tenantId", type: "string", filterable: true, selectable: true },
  { name: "sellerName", type: "string", filterable: true, searchable: true, sortable: true, selectable: true },
  { name: "total", type: "number", filterable: true, sortable: true, selectable: true },
  { name: "status", type: "string", filterable: true, sortable: true, selectable: true },
  { name: "paymentMethod", type: "string", filterable: true, sortable: true, selectable: true },
  { name: "createdAt", type: "date", filterable: true, sortable: true, selectable: true },
];

export class TransactionRepository extends BaseRepository<ITransaction> {
  constructor(queryEngine?: MongoQueryEngine) {
    super(Transaction, queryEngine);
    this.queryEngine.registerFieldSchema("transactions", transactionFieldSchema);
  }
}

export function getTransactionRepository(queryEngine?: MongoQueryEngine): TransactionRepository {
  return new TransactionRepository(queryEngine);
}
