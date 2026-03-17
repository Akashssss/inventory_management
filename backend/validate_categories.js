const mongoose = require('mongoose');

async function check() {
    await mongoose.connect('mongodb://localhost:27017/inventory');
    const db = mongoose.connection.db;

    const tenantId = "default";

    // 1. Get categories returned by repository logic
    const categoryValues = await db.collection('products').distinct('categories', {
        isSmallProduct: true,
        stock: { $gt: 0 },
        tenantId: tenantId
    });

    const ids = categoryValues.filter(v => /^[0-9a-fA-F]{24}$/.test(v));
    const names = categoryValues.filter(v => !/^[0-9a-fA-F]{24}$/.test(v));

    const resolved = await db.collection('categories').find({
        $or: [
            { _id: { $in: ids.map(id => new mongoose.Types.ObjectId(id)) } },
            { name: { $in: categoryValues } }
        ],
        tenantId: tenantId
    }).project({ name: 1, _id: 1 }).toArray();

    console.log('Categories currently shown in UI:', resolved.map(c => c.name));

    // 2. For each resolved category, check if it has ANY small product in stock
    for (const cat of resolved) {
        const hasSmall = await db.collection('products').findOne({
            isSmallProduct: true,
            stock: { $gt: 0 },
            tenantId: tenantId,
            $or: [
                { categories: cat._id.toString() },
                { categories: cat._id },
                { categories: cat.name }
            ]
        });

        if (!hasSmall) {
            console.log(`[ALARM] Category "${cat.name}" has NO small products in stock but is being SHOWN!`);
        } else {
            console.log(`[OK] Category "${cat.name}" has small product: ${hasSmall.name}`);
        }
    }

    process.exit(0);
}

check();
