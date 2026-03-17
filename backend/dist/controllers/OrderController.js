"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderController = void 0;
exports.createOrderController = createOrderController;
const Order_1 = require("@/models/Order");
const StockTransaction_1 = require("@/models/StockTransaction");
const Product_1 = require("@/models/Product");
class OrderController {
    async createOrder(req, res, next) {
        try {
            const tenantId = req.context?.tenantId;
            const sellerId = req.context?.user?._id?.toString();
            const { items, paymentMethod } = req.body;
            if (!items || !Array.isArray(items) || items.length === 0) {
                res.status(400).json({ success: false, error: { message: "No items provided" } });
                return;
            }
            // Calculate totals and create order items
            let subtotal = 0;
            const orderItems = [];
            for (const it of items) {
                const product = await Product_1.Product.findById(it.productId).exec();
                const unitPrice = it.unitPrice ?? product?.sellingPrice ?? 0;
                const costPrice = product?.costPrice ?? null;
                const qty = Number(it.quantity || 0);
                const totalPrice = unitPrice * qty;
                subtotal += totalPrice;
                orderItems.push({
                    productId: it.productId,
                    productName: it.productName || product?.name || "",
                    unit: it.unit || "piece",
                    quantity: qty,
                    unitPrice,
                    costPrice,
                    totalPrice,
                });
                // reduce stock
                const change = -Math.abs(qty);
                await Product_1.Product.updateOne({ _id: it.productId }, { $inc: { stock: change } }).exec();
                await StockTransaction_1.StockTransaction.create({ tenantId, productId: it.productId, changeType: "sale", quantityChange: change, unit: it.unit || "piece", reason: "sale" });
            }
            const taxes = 0;
            const discounts = 0;
            const total = subtotal + taxes - discounts;
            const orderNumber = `ORD-${Date.now()}`;
            const order = await Order_1.Order.create({ orderNumber, tenantId, sellerId, items: orderItems, subtotal, taxes, discounts, total, paymentMethod, status: "completed" });
            res.status(201).json({ success: true, data: order });
        }
        catch (err) {
            next(err);
        }
    }
    async getOrders(req, res, next) {
        try {
            const tenantId = req.context?.tenantId;
            const { page = 1, limit = 20, sort, filter } = req.query;
            const q = { tenantId };
            // basic filtering can be expanded later
            const orders = await Order_1.Order.find(q).sort({ createdAt: -1 }).skip((Number(page) - 1) * Number(limit)).limit(Number(limit)).exec();
            const total = await Order_1.Order.countDocuments(q).exec();
            res.status(200).json({ success: true, data: orders, pagination: { page: Number(page), limit: Number(limit), total } });
        }
        catch (err) {
            next(err);
        }
    }
    async getOrderById(req, res, next) {
        try {
            const { id } = req.params;
            const order = await Order_1.Order.findById(id).exec();
            if (!order) {
                res.status(404).json({ success: false, error: { message: "Order not found" } });
                return;
            }
            res.status(200).json({ success: true, data: order });
        }
        catch (err) {
            next(err);
        }
    }
}
exports.OrderController = OrderController;
function createOrderController() {
    return new OrderController();
}
//# sourceMappingURL=OrderController.js.map