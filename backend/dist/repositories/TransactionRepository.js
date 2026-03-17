"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionRepository = exports.transactionFieldSchema = void 0;
exports.getTransactionRepository = getTransactionRepository;
const BaseRepository_1 = require("./BaseRepository");
const Transaction_1 = require("../models/Transaction");
exports.transactionFieldSchema = [
    { name: "tenantId", type: "string", filterable: true, selectable: true },
    { name: "sellerName", type: "string", filterable: true, searchable: true, sortable: true, selectable: true },
    { name: "total", type: "number", filterable: true, sortable: true, selectable: true },
    { name: "status", type: "string", filterable: true, sortable: true, selectable: true },
    { name: "paymentMethod", type: "string", filterable: true, sortable: true, selectable: true },
    { name: "createdAt", type: "date", filterable: true, sortable: true, selectable: true },
];
class TransactionRepository extends BaseRepository_1.BaseRepository {
    constructor(queryEngine) {
        super(Transaction_1.Transaction, queryEngine);
        this.queryEngine.registerFieldSchema("transactions", exports.transactionFieldSchema);
    }
}
exports.TransactionRepository = TransactionRepository;
function getTransactionRepository(queryEngine) {
    return new TransactionRepository(queryEngine);
}
//# sourceMappingURL=TransactionRepository.js.map