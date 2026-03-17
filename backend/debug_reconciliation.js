const mongoose = require('mongoose');

async function debugPending() {
    await mongoose.connect('mongodb://localhost:27017/inventory');
    console.log('Connected to MongoDB');

    const Transaction = mongoose.model('Transaction', new mongoose.Schema({}, { strict: false }), 'transactions');

    const pendingItems = await Transaction.aggregate([
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
                }
            }
        }
    ]);

    console.log('Pending Items:', JSON.stringify(pendingItems, null, 2));

    const Product = mongoose.model('Product', new mongoose.Schema({}, { strict: false }), 'products');
    const smallProducts = await Product.find({ isSmallProduct: true, status: 'active' }).limit(5);
    console.log('Sample Small Products:', JSON.stringify(smallProducts.map(p => ({
        name: p.name,
        sellingPrice: p.sellingPrice,
        category: p.category,
        categoryId: p.categoryId
    })), null, 2));

    await mongoose.disconnect();
}

debugPending().catch(console.error);
