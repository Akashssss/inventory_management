const Order = require('../models/Order');
const Product = require('../models/Product');
const PendingAdjustment = require('../models/PendingAdjustment');

// @desc    Create new order
// @route   POST /api/orders
const createOrder = async (req, res) => {
  const { items, totalAmount, totalCost, profit, paymentMethod, seller } = req.body;

  if (items && items.length === 0) {
    return res.status(400).json({ message: 'No order items' });
  }

  try {
    const order = new Order({
      seller,
      items,
      totalAmount,
      totalCost,
      profit,
      paymentMethod,
    });

    const createdOrder = await order.save();

    // Update stock for each item
    for (const item of items) {
      if (item.isQuickAdd) {
        // Create pending adjustment for Quick Mode items
        await PendingAdjustment.create({
          order: createdOrder._id,
          category: item.category,
          price: item.price,
          quantity: item.quantity,
          seller: seller,
        });
      } else if (item.product) {
        const product = await Product.findById(item.product);
        if (product) {
          product.stock -= item.quantity;
          product.salesCount += item.quantity;
          product.lastSoldAt = Date.now();
          await product.save();
        }
      }
    }

    res.status(201).json(createdOrder);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all orders (history)
// @route   GET /api/orders
const getOrders = async (req, res) => {
  try {
    const orders = await Order.find({}).populate('seller', 'name email').sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get analytics
// @route   GET /api/orders/analytics
const getAnalytics = async (req, res) => {
  try {
    const totalSales = await Order.aggregate([
      { $group: { _id: null, total: { $sum: '$totalAmount' }, profit: { $sum: '$profit' } } }
    ]);

    const salesByDay = await Order.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          total: { $sum: "$totalAmount" },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const bestSellingProducts = await Order.aggregate([
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.name",
          totalQty: { $sum: "$items.quantity" },
          totalSales: { $sum: { $multiply: ["$items.quantity", "$items.price"] } }
        }
      },
      { $sort: { totalQty: -1 } },
      { $limit: 10 }
    ]);

    const salesByCategory = await Order.aggregate([
      { $unwind: "$items" },
      {
        $lookup: {
          from: "categories",
          localField: "items.category",
          foreignField: "_id",
          as: "categoryInfo"
        }
      },
      {
        $group: {
          _id: { $arrayElemAt: ["$categoryInfo.name", 0] },
          totalSales: { $sum: { $multiply: ["$items.quantity", "$items.price"] } },
          count: { $sum: 1 }
        }
      },
      { $sort: { totalSales: -1 } }
    ]);

    const salesBySeller = await Order.aggregate([
      {
        $lookup: {
          from: "users",
          localField: "seller",
          foreignField: "_id",
          as: "sellerInfo"
        }
      },
      {
        $group: {
          _id: { $arrayElemAt: ["$sellerInfo.name", 0] },
          totalSales: { $sum: "$totalAmount" },
          count: { $sum: 1 }
        }
      },
      { $sort: { totalSales: -1 } }
    ]);

    const pendingAdjustmentsCount = await PendingAdjustment.countDocuments({ status: 'pending' });

    res.json({
      totalSales: totalSales[0]?.total || 0,
      totalProfit: totalSales[0]?.profit || 0,
      salesByDay,
      bestSellingProducts,
      salesByCategory,
      salesBySeller,
      pendingAdjustmentsCount
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createOrder,
  getOrders,
  getAnalytics,
};
