import { Request, Response, NextFunction } from "express";
import { QueryOptions } from "@/types/query.types";
import { CategoryRepository } from "@/repositories/CategoryRepository";

export class CategoryController {
  private repository: CategoryRepository;

  constructor(repository: CategoryRepository) {
    this.repository = repository;
  }

  async getCategories(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page, limit, search, fields } = req.query;
      const { filter, sort } = req.body || {};

      const options: QueryOptions = {
        filter,
        search: search as string | undefined,
        searchFields: ["name", "description"],
        sort: typeof sort === "string" ? JSON.parse(sort) : (sort as any),
        pagination: {
          page: page ? Number(page) : 1,
          limit: limit ? Number(limit) : 20,
          maxLimit: 1000,
        },
        fields: typeof fields === "string" ? JSON.parse(fields) : (fields as any),
        tenantId: req.context?.tenantId || "default",
        includeSoftDeleted: req.context?.includeSoftDeleted || false,
      };

      const result = await this.repository.find(options);

      res.status(200).json({
        success: true,
        data: result.data,
        pagination: result.pagination,
        meta: result.meta,
      });
    } catch (error) {
      next(error);
    }
  }

  async createCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name } = req.body;
      if (!name) {
        res.status(400).json({ success: false, error: { message: "Name is required" } });
        return;
      }

      const category = await this.repository.create({
        ...req.body,
        tenantId: req.context?.tenantId || "default",
      });

      res.status(201).json({ success: true, data: category });
    } catch (error) {
      next(error);
    }
  }

  async updateCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const category = await this.repository.update(id, req.body);
      res.status(200).json({ success: true, data: category });
    } catch (error) {
      next(error);
    }
  }

  async deleteCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      await this.repository.softDelete(id);
      res.status(200).json({ success: true, message: "Category deleted" });
    } catch (error) {
      next(error);
    }
  }
}

export function createCategoryController(repository: CategoryRepository): CategoryController {
  return new CategoryController(repository);
}
