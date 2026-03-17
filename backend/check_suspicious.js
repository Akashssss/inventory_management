const mongoose = require('mongoose');

async function debug() {
    await mongoose.connect('mongodb://localhost:27017/inventory');
    const db = mongoose.connection.db;

    const suspicious = await db.collection('products').find({
        isSmallProduct: true,
        sellingPrice: { $gt: 10 }
    }).project({ name: 1, sellingPrice: 1 }).toArray();

    console.log(`Suspicious Small Products (Price > 10): ${suspicious.length}`);
    suspicious.forEach(p => console.log(`- ${p.name}: ₹${p.sellingPrice}`));

    const cheapNotSmall = await db.collection('products').find({
        isSmallProduct: false,
        sellingPrice: { $lte: 10 },
        type: 'non-measurable'
    }).project({ name: 1, sellingPrice: 1 }).toArray();

    console.log(`\nCheap Products (<= 10) NOT marked Small: ${cheapNotSmall.length}`);
    cheapNotSmall.forEach(p => console.log(`- ${p.name}: ₹${p.sellingPrice}`));

    process.exit(0);
}

debug();
