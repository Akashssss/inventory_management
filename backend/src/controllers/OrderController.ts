import { Request, Response, NextFunction } from "express";
import { Order } from "@/models/Order";
import { StockTransaction } from "@/models/StockTransaction";
import { Product } from "@/models/Product";
import { Order as OrderModelType } from "@/models/Order";

export class OrderController {
  async createOrder(req: Request & { context?: any }, res: Response, next: NextFunction) {
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
      const orderItems = [] as any[];

      for (const it of items) {
        const product = await Product.findById(it.productId).exec();
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
        await Product.updateOne({ _id: it.productId }, { $inc: { stock: change } }).exec();
        await StockTransaction.create({ tenantId, productId: it.productId, changeType: "sale", quantityChange: change, unit: it.unit || "piece", reason: "sale" });
      }

      const taxes = 0;
      const discounts = 0;
      const total = subtotal + taxes - discounts;

      const orderNumber = `ORD-${Date.now()}`;

      const order = await Order.create({ orderNumber, tenantId, sellerId, items: orderItems, subtotal, taxes, discounts, total, paymentMethod, status: "completed" });

      res.status(201).json({ success: true, data: order });
    } catch (err) {
      next(err);
    }
  }

  async getOrders(req: Request & { context?: any }, res: Response, next: NextFunction) {
    try {
      const tenantId = req.context?.tenantId;
      const { page = 1, limit = 20, sort, filter } = req.query as any;
      const q: any = { tenantId };
      // basic filtering can be expanded later
      const orders = await Order.find(q).sort({ createdAt: -1 }).skip((Number(page) - 1) * Number(limit)).limit(Number(limit)).exec();
      const total = await Order.countDocuments(q).exec();
      res.status(200).json({ success: true, data: orders, pagination: { page: Number(page), limit: Number(limit), total } });
    } catch (err) {
      next(err);
    }
  }

  async getOrderById(req: Request & { context?: any }, res: Response, next: NextFunction) {
    try {
      const { id } = req.params as { id: string };
      const order = await Order.findById(id).exec();
      if (!order) {
        res.status(404).json({ success: false, error: { message: "Order not found" } });
        return;
      }
      res.status(200).json({ success: true, data: order });
    } catch (err) {
      next(err);
    }
  }
}

export function createOrderController() {
  return new OrderController();
}
