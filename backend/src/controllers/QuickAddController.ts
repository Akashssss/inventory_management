import { Request, Response, NextFunction } from "express";
import { QuickAddLog } from "@/models/QuickAddLog";
import { Product } from "@/models/Product";
import { StockTransaction } from "@/models/StockTransaction";

export class QuickAddController {
  async quickAdd(req: Request & { context?: any }, res: Response, next: NextFunction) {
    try {
      const tenantId = req.context?.tenantId;
      const sellerId = req.context?.user?._id?.toString();
      const { category, priceTag, quantity, autoResolve } = req.body;

      if (!category || quantity === undefined || quantity <= 0) {
        res.status(400).json({ success: false, error: { message: "category and positive quantity required" } });
        return;
      }

      // Find matching small products by category and price (priceTag) - advanced filtering can be used
      const products = await Product.find({ categories: category, sellingPrice: Number(priceTag) }).limit(10).exec();

      const items = products.slice(0, quantity).map(p => ({ productId: p._id.toString(), name: p.name }));

      // Create QuickAdd log
      const log = await QuickAddLog.create({ tenantId, sellerId, category, priceTag, quantity, items, resolved: Boolean(autoResolve) });

      // If autoResolve then decrement stock and create stock transactions
      if (autoResolve) {
        for (const it of items) {
          await Product.updateOne({ _id: it.productId }, { $inc: { stock: -1 } }).exec();
          await StockTransaction.create({ tenantId, productId: it.productId, changeType: "quick_add", quantityChange: -1, unit: "piece", reason: "quick_add" });
        }
      }

      res.status(201).json({ success: true, data: log });
    } catch (err) {
      next(err);
    }
  }

  // Admin-only: reconcile quick-add logs with multiple products adjustments
  async reconcile(req: Request & { context?: any }, res: Response, next: NextFunction) {
    try {
      // Expect body: { logId, adjustments: [{ productId, quantityChange, reason }], resolvedBy }
      const { logId, adjustments } = req.body;
      if (!logId || !Array.isArray(adjustments)) {
        res.status(400).json({ success: false, error: { message: "logId and adjustments are required" } });
        return;
      }

      const log = await QuickAddLog.findById(logId).exec();
      if (!log) {
        res.status(404).json({ success: false, error: { message: "QuickAdd log not found" } });
        return;
      }

      // Apply adjustments and create stock transactions
      for (const adj of adjustments) {
        await Product.updateOne({ _id: adj.productId }, { $inc: { stock: adj.quantityChange } }).exec();
        await StockTransaction.create({ tenantId: log.tenantId, productId: adj.productId, changeType: "reconciliation", quantityChange: adj.quantityChange, reason: adj.reason || "reconciliation" });
      }

      log.resolved = true;
      await log.save();

      res.status(200).json({ success: true, data: log });
    } catch (err) {
      next(err);
    }
  }

  // Get quick-add logs (unresolved by default)
  async getLogs(req: Request & { context?: any }, res: Response, next: NextFunction) {
    try {
      const tenantId = req.context?.tenantId;
      const { resolved } = req.query;

      const filter: any = { tenantId };
      if (resolved !== undefined) {
        filter.resolved = resolved === 'true';
      }

      const logs = await QuickAddLog.find(filter).sort({ createdAt: -1 }).limit(100).exec();

      res.status(200).json({ success: true, data: logs });
    } catch (err) {
      next(err);
    }
  }
}

export function createQuickAddController() {
  return new QuickAddController();
}
