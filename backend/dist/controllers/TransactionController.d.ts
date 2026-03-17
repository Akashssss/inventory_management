import { Request, Response, NextFunction } from "express";
import { TransactionRepository } from "@/repositories/TransactionRepository";
export declare class TransactionController {
    private repository;
    constructor(repository: TransactionRepository);
    getTransactions(req: Request, res: Response, next: NextFunction): Promise<void>;
    createTransaction(req: Request, res: Response, next: NextFunction): Promise<void>;
    getTransactionStats(req: Request, res: Response, next: NextFunction): Promise<void>;
    getPendingQuickAdds(req: Request, res: Response, next: NextFunction): Promise<void>;
    resolveQuickAdd(req: Request, res: Response, next: NextFunction): Promise<void>;
}
export declare function createTransactionController(repository: TransactionRepository): TransactionController;
//# sourceMappingURL=TransactionController.d.ts.map