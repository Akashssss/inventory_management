"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuickAddController = void 0;
exports.createQuickAddController = createQuickAddController;
const QuickAddLog_1 = require("@/models/QuickAddLog");
const Product_1 = require("@/models/Product");
const StockTransaction_1 = require("@/models/StockTransaction");
class QuickAddController {
    async quickAdd(req, res, next) {
        try {
            const tenantId = req.context?.tenantId;
            const sellerId = req.context?.user?._id?.toString();
            const { category, priceTag, quantity, autoResolve } = req.body;
            if (!category || quantity === undefined || quantity <= 0) {
                res.status(400).json({ success: false, error: { message: "category and positive quantity required" } });
                return;
            }
            // Find matching small products by category and price (priceTag) - advanced filtering can be used
            const products = await Product_1.Product.find({ categories: category, sellingPrice: Number(priceTag) }).limit(10).exec();
            const items = products.slice(0, quantity).map(p => ({ productId: p._id.toString(), name: p.name }));
            // Create QuickAdd log
            const log = await QuickAddLog_1.QuickAddLog.create({ tenantId, sellerId, category, priceTag, quantity, items, resolved: Boolean(autoResolve) });
            // If autoResolve then decrement stock and create stock transactions
            if (autoResolve) {
                for (const it of items) {
                    await Product_1.Product.updateOne({ _id: it.productId }, { $inc: { stock: -1 } }).exec();
                    await StockTransaction_1.StockTransaction.create({ tenantId, productId: it.productId, changeType: "quick_add", quantityChange: -1, unit: "piece", reason: "quick_add" });
                }
            }
            res.status(201).json({ success: true, data: log });
        }
        catch (err) {
            next(err);
        }
    }
    // Admin-only: reconcile quick-add logs with multiple products adjustments
    async reconcile(req, res, next) {
        try {
            // Expect body: { logId, adjustments: [{ productId, quantityChange, reason }], resolvedBy }
            const { logId, adjustments } = req.body;
            if (!logId || !Array.isArray(adjustments)) {
                res.status(400).json({ success: false, error: { message: "logId and adjustments are required" } });
                return;
            }
            const log = await QuickAddLog_1.QuickAddLog.findById(logId).exec();
            if (!log) {
                res.status(404).json({ success: false, error: { message: "QuickAdd log not found" } });
                return;
            }
            // Apply adjustments and create stock transactions
            for (const adj of adjustments) {
                await Product_1.Product.updateOne({ _id: adj.productId }, { $inc: { stock: adj.quantityChange } }).exec();
                await StockTransaction_1.StockTransaction.create({ tenantId: log.tenantId, productId: adj.productId, changeType: "reconciliation", quantityChange: adj.quantityChange, reason: adj.reason || "reconciliation" });
            }
            log.resolved = true;
            await log.save();
            res.status(200).json({ success: true, data: log });
        }
        catch (err) {
            next(err);
        }
    }
    // Get quick-add logs (unresolved by default)
    async getLogs(req, res, next) {
        try {
            const tenantId = req.context?.tenantId;
            const { resolved } = req.query;
            const filter = { tenantId };
            if (resolved !== undefined) {
                filter.resolved = resolved === 'true';
            }
            const logs = await QuickAddLog_1.QuickAddLog.find(filter).sort({ createdAt: -1 }).limit(100).exec();
            res.status(200).json({ success: true, data: logs });
        }
        catch (err) {
            next(err);
        }
    }
}
exports.QuickAddController = QuickAddController;
function createQuickAddController() {
    return new QuickAddController();
}
//# sourceMappingURL=QuickAddController.js.map