import { BaseRepository } from "./BaseRepository";
import { ITransaction } from "../models/Transaction";
import { MongoQueryEngine } from "../core";
import { FieldMetadata } from "../types/query.types";
export declare const transactionFieldSchema: FieldMetadata[];
export declare class TransactionRepository extends BaseRepository<ITransaction> {
    constructor(queryEngine?: MongoQueryEngine);
}
export declare function getTransactionRepository(queryEngine?: MongoQueryEngine): TransactionRepository;
//# sourceMappingURL=TransactionRepository.d.ts.map