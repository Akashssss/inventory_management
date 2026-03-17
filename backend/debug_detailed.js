const mongoose = require('mongoose');

async function debug() {
    await mongoose.connect('mongodb://localhost:27017/inventory');

    const db = mongoose.connection.db;

    const smallProducts = await db.collection('products').find({
        isSmallProduct: true,
        stock: { $gt: 0 }
    }).project({ name: 1, sellingPrice: 1, categories: 1 }).toArray();

    console.log(`Small Products Found in Stock: ${smallProducts.length}`);
    for (const p of smallProducts) {
        const cats = Array.isArray(p.categories) ? p.categories : [p.categories];
        const resolved = await db.collection('categories').find({
            $or: [
                {
                    _id: {
                        $in: cats.map(c => {
                            try { return new mongoose.Types.ObjectId(c); } catch (e) { return null; }
                        }).filter(id => id)
                    }
                },
                { name: { $in: cats } }
            ]
        }).project({ name: 1 }).toArray();
        console.log(`- ${p.name} (₹${p.sellingPrice}) -> Categories: ${resolved.map(c => c.name).join(', ')}`);
    }

    const allProducts = await db.collection('products').find({ stock: { $gt: 0 } }).project({ name: 1, sellingPrice: 1, isSmallProduct: 1 }).toArray();
    console.log(`\nTotal Products in Stock: ${allProducts.length}`);
    const misclassified = allProducts.filter(p => p.sellingPrice <= 10 && !p.isSmallProduct);
    if (misclassified.length > 0) {
        console.log(`\nWarning: ${misclassified.length} products <= ₹10 are NOT marked as small products.`);
    }

    process.exit(0);
}

debug();
