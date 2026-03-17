import { Request, Response, NextFunction } from "express";
export declare class OrderController {
    createOrder(req: Request & {
        context?: any;
    }, res: Response, next: NextFunction): Promise<void>;
    getOrders(req: Request & {
        context?: any;
    }, res: Response, next: NextFunction): Promise<void>;
    getOrderById(req: Request & {
        context?: any;
    }, res: Response, next: NextFunction): Promise<void>;
}
export declare function createOrderController(): OrderController;
//# sourceMappingURL=OrderController.d.ts.map