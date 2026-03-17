import { Request, Response, NextFunction } from "express";
export declare class QuickAddController {
    quickAdd(req: Request & {
        context?: any;
    }, res: Response, next: NextFunction): Promise<void>;
    reconcile(req: Request & {
        context?: any;
    }, res: Response, next: NextFunction): Promise<void>;
    getLogs(req: Request & {
        context?: any;
    }, res: Response, next: NextFunction): Promise<void>;
}
export declare function createQuickAddController(): QuickAddController;
//# sourceMappingURL=QuickAddController.d.ts.map