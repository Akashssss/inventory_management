const mongoose = require('mongoose');

async function check() {
    await mongoose.connect('mongodb://localhost:27017/inventory');
    const db = mongoose.connection.db;

    const tenantId = "default"; // Assuming default for now

    // 1. Get raw category values from small products in stock
    const categoryValues = await db.collection('products').distinct('categories', {
        isSmallProduct: true,
        stock: { $gt: 0 },
        tenantId: tenantId
    });

    console.log('Raw Category Values from matching products:', categoryValues);

    // 2. Resolve these names/IDs
    const ids = categoryValues.filter(v => /^[0-9a-fA-F]{24}$/.test(v));
    const names = categoryValues.filter(v => !/^[0-9a-fA-F]{24}$/.test(v));

    const resolved = await db.collection('categories').find({
        $or: [
            { _id: { $in: ids.map(id => new mongoose.Types.ObjectId(id)) } },
            { name: { $in: categoryValues } } // search by any value as name
        ],
        tenantId: tenantId
    }).project({ name: 1 }).toArray();

    const finalNames = Array.from(new Set(resolved.map(c => c.name)));
    console.log('Final Resolved Names:', finalNames);

    // 3. Find if any of these categories DON'T have a small product?
    // (By definition they should, because they came from distinct over small products)

    // Wait! What if there are multiple tenants?
    const allTenants = await db.collection('products').distinct('tenantId');
    console.log('All Tenant IDs:', allTenants);

    process.exit(0);
}

check();
