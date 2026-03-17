import { Request, Response, NextFunction } from "express";
export declare class DashboardController {
    getAdminStats(req: Request & {
        context?: any;
    }, res: Response, next: NextFunction): Promise<void>;
    getSellerStats(req: Request & {
        context?: any;
    }, res: Response, next: NextFunction): Promise<void>;
}
export declare function createDashboardController(): DashboardController;
//# sourceMappingURL=DashboardController.d.ts.map