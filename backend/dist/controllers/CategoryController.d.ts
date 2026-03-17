import { Request, Response, NextFunction } from "express";
import { CategoryRepository } from "@/repositories/CategoryRepository";
export declare class CategoryController {
    private repository;
    constructor(repository: CategoryRepository);
    getCategories(req: Request, res: Response, next: NextFunction): Promise<void>;
    createCategory(req: Request, res: Response, next: NextFunction): Promise<void>;
    updateCategory(req: Request, res: Response, next: NextFunction): Promise<void>;
    deleteCategory(req: Request, res: Response, next: NextFunction): Promise<void>;
}
export declare function createCategoryController(repository: CategoryRepository): CategoryController;
//# sourceMappingURL=CategoryController.d.ts.map