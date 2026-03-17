const mongoose = require('mongoose');

async function debug() {
    await mongoose.connect('mongodb://localhost:27017/inventory');

    const db = mongoose.connection.db;

    const smallProducts = await db.collection('products').find({
        isSmallProduct: true,
        stock: { $gt: 0 }
    }).project({ name: 1, categories: 1 }).toArray();

    console.log(`Found ${smallProducts.length} small products in stock.`);

    const categoryIds = new Set();
    const prodToCat = [];
    smallProducts.forEach(p => {
        const cats = Array.isArray(p.categories) ? p.categories : (p.categories ? [p.categories] : []);
        cats.forEach(c => categoryIds.add(c.toString()));
        prodToCat.push({ name: p.name, cats });
    });

    const ids = Array.from(categoryIds);
    console.log('\n--- Unique Category IDs/Names found in these products ---');
    console.log(ids);

    const resolvedCategories = await db.collection('categories').find({
        $or: [
            {
                _id: {
                    $in: ids.map(id => {
                        try { return new mongoose.Types.ObjectId(id); } catch (e) { return null; }
                    }).filter(id => id)
                }
            },
            { name: { $in: ids } }
        ]
    }).project({ name: 1 }).toArray();

    console.log('\n--- Resolved Category Names (What shows in UI) ---');
    console.log(resolvedCategories.map(c => c.name));

    console.log('\n--- Product-Category Mappings (Sample) ---');
    prodToCat.slice(0, 10).forEach(pc => {
        console.log(`${pc.name} -> ${pc.cats.join(', ')}`);
    });

    process.exit(0);
}

debug().catch(err => {
    console.error(err);
    process.exit(1);
});
