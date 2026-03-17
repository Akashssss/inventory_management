import mongoose from 'mongoose';
import { Product } from './src/models/Product';
import { Category } from './src/models/Category';

async function debug() {
  await mongoose.connect('mongodb://localhost:27017/inventory');
  
  const smallProducts = await Product.find({ isSmallProduct: true, stock: { $gt: 0 } }).select('name categories').exec();
  console.log('--- Small Products (in stock) ---');
  console.log(JSON.stringify(smallProducts, null, 2));

  const categoryIds = new Set();
  smallProducts.forEach(p => p.categories.forEach(c => categoryIds.add(c.toString())));
  console.log('\n--- Unique Category IDs/Names from Small Products ---');
  console.log(Array.from(categoryIds));

  const resolvedCategories = await Category.find({ 
    $or: [
      { _id: { $in: Array.from(categoryIds) } },
      { name: { $in: Array.from(categoryIds) } }
    ]
  }).select('name').exec();
  
  console.log('\n--- Resolved Category Names (Should be what Quick Mode shows) ---');
  console.log(resolvedCategories.map(c => c.name));

  const allCategories = await Category.find({}).select('name').exec();
  console.log('\n--- All Categories in System ---');
  console.log(allCategories.map(c => c.name));

  process.exit(0);
}

debug();
