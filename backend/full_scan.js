const mongoose = require('mongoose');

async function debug() {
    await mongoose.connect('mongodb://localhost:27017/inventory');
    const db = mongoose.connection.db;

    const allCats = await db.collection('categories').find({}).toArray();
    const catMap = {};
    allCats.forEach(c => {
        catMap[c._id.toString()] = c.name;
        catMap[c.name] = c.name; // map name to itself too
    });

    const products = await db.collection('products').find({ stock: { $gt: 0 } }).toArray();

    console.log(`--- SCANNING ${products.length} PRODUCTS IN STOCK ---`);

    const categoryStats = {};

    products.forEach(p => {
        const cats = Array.isArray(p.categories) ? p.categories : (p.categories ? [p.categories] : []);
        cats.forEach(c => {
            const catIdOrName = c.toString();
            const catName = catMap[catIdOrName] || `Unknown(${catIdOrName})`;

            if (!categoryStats[catName]) {
                categoryStats[catName] = { small: [], large: [] };
            }

            if (p.isSmallProduct) {
                categoryStats[catName].small.push(p.name);
            } else {
                categoryStats[catName].large.push(p.name);
            }
        });
    });

    console.log('\n--- Category Breakdown (In-Stock Products) ---');
    Object.keys(categoryStats).forEach(catName => {
        const stats = categoryStats[catName];
        console.log(`\n[${catName}]`);
        console.log(`  Small Products (${stats.small.length}): ${stats.small.join(', ') || 'None'}`);
        console.log(`  Large Products (${stats.large.length}): ${stats.large.join(', ') || 'None'}`);
    });

    process.exit(0);
}

debug().catch(console.error);
