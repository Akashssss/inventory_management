import { Request, Response, NextFunction } from "express";
export interface RequestContext {
    user?: any;
    tenantId?: string;
}
export declare function jwtAuth(req: Request & {
    context?: RequestContext;
}, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
export declare function requireRole(role: string): (req: Request & {
    context?: RequestContext;
}, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
//# sourceMappingURL=authMiddleware.d.ts.map