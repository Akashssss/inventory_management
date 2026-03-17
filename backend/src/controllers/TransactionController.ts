import { Request, Response, NextFunction } from "express";
import { QueryOptions } from "@/types/query.types";
import { TransactionRepository } from "@/repositories/TransactionRepository";
import { Transaction } from "@/models/Transaction";
import { Product } from "@/models/Product";
import mongoose from "mongoose";

export class TransactionController {
  private repository: TransactionRepository;

  constructor(repository: TransactionRepository) {
    this.repository = repository;
  }

  async getTransactions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page, limit, search, fields, filter: queryFilter, sort: querySort } = req.query;
      const { filter: bodyFilter, sort: bodySort } = req.body || {};

      // Priority: Body > Query
      const rawFilter = bodyFilter || queryFilter;
      const rawSort = bodySort || querySort;

      const options: QueryOptions = {
        filter: typeof rawFilter === "string" ? JSON.parse(rawFilter) : rawFilter,
        search: search as string | undefined,
        searchFields: ["sellerName", "paymentMethod"],
        sort: typeof rawSort === "string" ? JSON.parse(rawSort) : rawSort,
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

  async createTransaction(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Create new transaction receipt mapping to items
      const user = req.context?.user;
      const transaction = await this.repository.create({
        ...req.body,
        tenantId: req.context?.tenantId || "default",
        sellerId: user?._id || new mongoose.Types.ObjectId(),
        sellerName: user?.name || "Unknown Seller",
      });

      // Decrement stock for each product
      if (req.body.items && Array.isArray(req.body.items)) {
        for (const item of req.body.items) {
          if (item.productId) {
            await Product.updateOne(
              { _id: item.productId, tenantId: req.context?.tenantId || "default" },
              { $inc: { stock: -item.quantity, availableStock: -item.quantity } }
            );
          }
        }
      }

      res.status(201).json({ success: true, data: transaction });
    } catch (error) {
      next(error);
    }
  }

  async getTransactionStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.context?.tenantId || "default";
      // Perform aggregation or sophisticated filtering to get dashboard stats
      // Simply counting transactions for now.
      const total = await this.repository.count({
        field: "tenantId", operator: "eq", value: tenantId
      });

      res.status(200).json({ success: true, data: { totalTransactions: total } });
    } catch (error) {
      next(error);
    }
  }

  // --- RECONCILIATION METHODS ---

  async getPendingQuickAdds(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.context?.tenantId || "default";

      // Aggregate all unresolved quick add items from transactions
      // Group by category, price, and track total unresolved quantity
      const pendingItems = await Transaction.aggregate([
        { $match: { tenantId } },
        { $unwind: "$items" },
        { 
          $match: { 
            "items.isQuickAdd": true,
            $expr: { $lt: [{ $ifNull: ["$items.resolvedQuantity", 0] }, "$items.quantity"] }
          }
        },
        {
          $group: {
            _id: { category: "$items.category", price: "$items.sellingPrice" },
            quantity: { 
              $sum: { $subtract: ["$items.quantity", { $ifNull: ["$items.resolvedQuantity", 0] }] } 
            },
            transactionIds: { $push: "$_id" }
          }
        },
        {
          $project: {
            id: { $concat: ["$_id.category", "-", { $toString: "$_id.price" }] },
            category: "$_id.category",
            price: "$_id.price",
            quantity: "$quantity",
            resolved: { $literal: 0 },
            transactionIds: 1,
            _id: 0
          }
        }
      ]);

      res.status(200).json({ success: true, data: pendingItems });
    } catch (error) {
      next(error);
    }
  }

  async resolveQuickAdd(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.context?.tenantId || "default";
      const { category, price, resolutions } = req.body;
      
      // validations
      if (!category || !resolutions || !Array.isArray(resolutions)) {
        res.status(400).json({ success: false, error: { message: "Invalid payload" } });
        return;
      }

      try {
        let remainingToResolve = resolutions.reduce((sum: number, r: any) => sum + r.quantity, 0);

        // 1. Adjust Stock on matching Products
        for (const resolution of resolutions) {
           await Product.updateOne(
             { _id: resolution.productId, tenantId },
             { $inc: { stock: -resolution.quantity, availableStock: -resolution.quantity } }
           );
        }

        // 2. Mark Transaction items as resolved incrementally
        const docsCursor = Transaction.find({
          tenantId,
          "items.isQuickAdd": true,
          "items.category": category,
          "items.sellingPrice": price
        }).cursor();

        for await (const doc of docsCursor) {
          if (remainingToResolve <= 0) break;

          let modified = false;
          for (let item of doc.items) {
            if (item.isQuickAdd && item.category === category && item.sellingPrice === price) {
              const unresolved = item.quantity - (item.resolvedQuantity || 0);
              if (unresolved > 0) {
                const toResolve = Math.min(unresolved, remainingToResolve);
                item.resolvedQuantity = (item.resolvedQuantity || 0) + toResolve;
                remainingToResolve -= toResolve;
                modified = true;
              }
            }
            if (remainingToResolve <= 0) break;
          }

          if (modified) {
            doc.markModified('items');
            await doc.save();
          }
        }

        res.status(200).json({ success: true });
      } catch (err) {
        throw err;
      }
    } catch (error) {
      next(error);
    }
  }
}

export function createTransactionController(repository: TransactionRepository): TransactionController {
  return new TransactionController(repository);
}
