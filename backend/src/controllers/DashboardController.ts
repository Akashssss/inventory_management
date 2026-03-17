import { Request, Response, NextFunction } from "express";
import { Transaction } from "@/models/Transaction";
import { Product } from "@/models/Product";
import { User } from "@/models/User";

// Native date helpers (no date-fns dependency)
const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
const endOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
const subDays = (d: Date, n: number) => new Date(d.getTime() - n * 86400000);
const startOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
const endOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
const subMonths = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth() - n, d.getDate());
const toDateStr = (d: Date) => d.toISOString().split("T")[0];
const toWeekday = (d: Date) => d.toLocaleDateString("en-IN", { weekday: "short" });

export class DashboardController {
  // Admin comprehensive stats
  async getAdminStats(req: Request & { context?: any }, res: Response, next: NextFunction) {
    try {
      const tenantId = req.context?.tenantId || "default";
      const now = new Date();
      const todayStart = startOfDay(now);
      const todayEnd = endOfDay(now);
      const yesterdayStart = startOfDay(subDays(now, 1));
      const yesterdayEnd = endOfDay(subDays(now, 1));
      const thisMonthStart = startOfMonth(now);
      const lastMonthStart = startOfMonth(subMonths(now, 1));
      const lastMonthEnd = endOfMonth(subMonths(now, 1));

      const [
        todayTxs, yesterdayTxs, thisMonthTxs, lastMonthTxs, allTimeTxs,
        recentTxs, dailySales7Days, topProductsRaw, lowStockProducts, allProducts, allUsers,
      ] = await Promise.all([
        Transaction.aggregate([{ $match: { tenantId, createdAt: { $gte: todayStart, $lte: todayEnd } } }, { $group: { _id: null, total: { $sum: "$total" }, count: { $sum: 1 } } }]),
        Transaction.aggregate([{ $match: { tenantId, createdAt: { $gte: yesterdayStart, $lte: yesterdayEnd } } }, { $group: { _id: null, total: { $sum: "$total" }, count: { $sum: 1 } } }]),
        Transaction.aggregate([{ $match: { tenantId, createdAt: { $gte: thisMonthStart, $lte: now } } }, { $group: { _id: null, total: { $sum: "$total" }, count: { $sum: 1 } } }]),
        Transaction.aggregate([{ $match: { tenantId, createdAt: { $gte: lastMonthStart, $lte: lastMonthEnd } } }, { $group: { _id: null, total: { $sum: "$total" }, count: { $sum: 1 } } }]),
        Transaction.aggregate([{ $match: { tenantId } }, { $group: { _id: null, total: { $sum: "$total" }, count: { $sum: 1 } } }]),
        Transaction.find({ tenantId }).sort({ createdAt: -1 }).limit(10).lean().exec(),
        Transaction.aggregate([
          { $match: { tenantId, createdAt: { $gte: subDays(now, 6) } } },
          { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, total: { $sum: "$total" }, count: { $sum: 1 } } },
          { $sort: { _id: 1 } }
        ]),
        Transaction.aggregate([
          { $match: { tenantId } }, { $unwind: "$items" },
          { $match: { "items.isQuickAdd": { $ne: true } } },
          { $group: { _id: "$items.productId", name: { $first: "$items.name" }, totalSold: { $sum: "$items.quantity" }, revenue: { $sum: { $multiply: ["$items.sellingPrice", "$items.quantity"] } } } },
          { $sort: { totalSold: -1 } }, { $limit: 5 }
        ]),
        Product.find({ tenantId, status: "active", $expr: { $lte: ["$stock", "$lowStockThreshold"] } })
          .select("name stock lowStockThreshold images sellingPrice").sort({ stock: 1 }).limit(20).lean().exec(),
        Product.countDocuments({ tenantId, status: "active" }),
        User.countDocuments({ tenantId }),
      ]);

      // Build 7-day chart with all days filled
      const chartData = Array.from({ length: 7 }, (_, i) => {
        const date = subDays(now, 6 - i);
        const dateStr = toDateStr(date);
        const found = dailySales7Days.find((d: any) => d._id === dateStr);
        return { date: dateStr, day: toWeekday(date), total: found?.total || 0, count: found?.count || 0 };
      });

      const todayRevenue = todayTxs[0]?.total || 0;
      const yesterdayRevenue = yesterdayTxs[0]?.total || 0;
      const thisMonthRevenue = thisMonthTxs[0]?.total || 0;
      const lastMonthRevenue = lastMonthTxs[0]?.total || 0;

      res.status(200).json({
        success: true,
        data: {
          revenue: {
            today: todayRevenue, yesterday: yesterdayRevenue,
            todayChange: yesterdayRevenue > 0 ? Math.round(((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100) : 0,
            thisMonth: thisMonthRevenue, lastMonth: lastMonthRevenue,
            monthChange: lastMonthRevenue > 0 ? Math.round(((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100) : 0,
            allTime: allTimeTxs[0]?.total || 0,
          },
          transactions: { todayCount: todayTxs[0]?.count || 0, yesterdayCount: yesterdayTxs[0]?.count || 0, allTime: allTimeTxs[0]?.count || 0 },
          products: { total: allProducts, lowStock: lowStockProducts.length, lowStockList: lowStockProducts },
          users: { total: allUsers },
          charts: { dailySales: chartData, topProducts: topProductsRaw },
          recentTransactions: recentTxs,
        }
      });
    } catch (err) { next(err); }
  }

  // Seller-specific stats
  async getSellerStats(req: Request & { context?: any }, res: Response, next: NextFunction) {
    try {
      const tenantId = req.context?.tenantId || "default";
      const sellerId = req.context?.user?._id?.toString();
      const sellerName = req.context?.user?.name;
      const now = new Date();
      const todayStart = startOfDay(now);
      const todayEnd = endOfDay(now);
      const weekStart = subDays(now, 6);

      const matchSeller: any = { tenantId };
      if (sellerId) {
        matchSeller.$or = [{ sellerId }, { sellerName }];
      }

      const [todayTxs, allTimeSeller, dailySales7Days, topSoldItems, lowStockProducts, pendingReconciliation, recentTxs] = await Promise.all([
        Transaction.aggregate([{ $match: { ...matchSeller, createdAt: { $gte: todayStart, $lte: todayEnd } } }, { $group: { _id: null, total: { $sum: "$total" }, count: { $sum: 1 } } }]),
        Transaction.aggregate([{ $match: matchSeller }, { $group: { _id: null, total: { $sum: "$total" }, count: { $sum: 1 } } }]),
        Transaction.aggregate([
          { $match: { ...matchSeller, createdAt: { $gte: weekStart } } },
          { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, total: { $sum: "$total" }, count: { $sum: 1 } } },
          { $sort: { _id: 1 } }
        ]),
        Transaction.aggregate([
          { $match: matchSeller }, { $unwind: "$items" },
          { $match: { "items.isQuickAdd": { $ne: true } } },
          { $group: { _id: "$items.name", count: { $sum: "$items.quantity" }, revenue: { $sum: { $multiply: ["$items.sellingPrice", "$items.quantity"] } } } },
          { $sort: { count: -1 } }, { $limit: 5 }
        ]),
        Product.find({ tenantId, status: "active", $expr: { $lte: ["$stock", "$lowStockThreshold"] } })
          .select("name stock lowStockThreshold images sellingPrice").sort({ stock: 1 }).limit(10).lean().exec(),
        Transaction.aggregate([
          { $match: { tenantId } }, { $unwind: "$items" },
          { $match: { "items.isQuickAdd": true, $expr: { $lt: [{ $ifNull: ["$items.resolvedQuantity", 0] }, "$items.quantity"] } } },
          { $count: "total" }
        ]),
        Transaction.find(matchSeller).sort({ createdAt: -1 }).limit(5).lean().exec(),
      ]);

      const chartData = Array.from({ length: 7 }, (_, i) => {
        const date = subDays(now, 6 - i);
        const dateStr = toDateStr(date);
        const found = dailySales7Days.find((d: any) => d._id === dateStr);
        return { date: dateStr, day: toWeekday(date), total: found?.total || 0, count: found?.count || 0 };
      });

      res.status(200).json({
        success: true,
        data: {
          seller: { name: sellerName },
          today: { revenue: todayTxs[0]?.total || 0, count: todayTxs[0]?.count || 0 },
          allTime: { revenue: allTimeSeller[0]?.total || 0, count: allTimeSeller[0]?.count || 0 },
          charts: { dailySales: chartData, topItems: topSoldItems },
          lowStock: { count: lowStockProducts.length, list: lowStockProducts },
          pendingReconciliation: pendingReconciliation[0]?.total || 0,
          recentTransactions: recentTxs,
        }
      });
    } catch (err) { next(err); }
  }
}

export function createDashboardController(): DashboardController {
  return new DashboardController();
}
