import { Request, Response, NextFunction } from "express";
export declare class UserController {
    listUsers(req: Request & {
        context?: any;
    }, res: Response, next: NextFunction): Promise<void>;
    searchUsers(req: Request & {
        context?: any;
    }, res: Response, next: NextFunction): Promise<void>;
    createUser(req: Request & {
        context?: any;
    }, res: Response, next: NextFunction): Promise<void>;
    getUser(req: Request & {
        context?: any;
    }, res: Response, next: NextFunction): Promise<void>;
    updateUser(req: Request & {
        context?: any;
    }, res: Response, next: NextFunction): Promise<void>;
    deleteUser(req: Request & {
        context?: any;
    }, res: Response, next: NextFunction): Promise<void>;
    updateProfile(req: Request & {
        context?: any;
    }, res: Response, next: NextFunction): Promise<void>;
    changePassword(req: Request & {
        context?: any;
    }, res: Response, next: NextFunction): Promise<void>;
}
export declare function createUserController(): UserController;
//# sourceMappingURL=UserController.d.ts.map