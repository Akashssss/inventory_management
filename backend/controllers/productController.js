const Product = require('../models/Product');
const Settings = require('../models/Settings');
const { updateCategorySmallProductFlags } = require('./categoryController');

// @desc    Get all products with pagination, filtering, and sorting
// @route   GET /api/products
const getProducts = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 100,
      search = '',
      sortBy = 'createdAt',
      sortOrder = 'desc',
      category,
      minPrice,
      maxPrice,
      minStock,
      maxStock,
      unitType,
      isSmallProduct,
      isBoxBased,
      isLowStock
    } = req.query;

    const query = {};

    // Search by name
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    // Filter by category
    if (category) {
      query.categories = category;
    }

    // Filter by price range
    if (minPrice || maxPrice) {
      query.sellingPrice = {};
      if (minPrice) query.sellingPrice.$gte = Number(minPrice);
      if (maxPrice) query.sellingPrice.$lte = Number(maxPrice);
    }

    // Filter by stock range
    if (minStock || maxStock) {
      query.stock = {};
      if (minStock) query.stock.$gte = Number(minStock);
      if (maxStock) query.stock.$lte = Number(maxStock);
    }

    // Filter by unit type
    if (unitType) {
      query.unitType = unitType;
    }

    // Filter by small product
    if (isSmallProduct !== undefined) {
      query.isSmallProduct = isSmallProduct === 'true';
    }

    // Filter by box-based
    if (isBoxBased !== undefined) {
      query.isBoxBased = isBoxBased === 'true';
    }

    // Filter by low stock
    if (isLowStock === 'true') {
      query.$expr = { $lte: ['$stock', '$lowStockAlert'] };
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const skip = (Number(page) - 1) * Number(limit);

    const [products, total] = await Promise.all([
      Product.find(query)
        .populate('categories')
        .sort(sort)
        .skip(skip)
        .limit(Number(limit)),
      Product.countDocuments(query)
    ]);

    return res.json({
      products,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// @desc    Create a product
// @route   POST /api/products
const createProduct = async (req, res, next) => {
  try {
    const settings = await Settings.findOne() || { smallProductThreshold: 10 };
    const { name, image, categories, costPrice, sellingPrice, unitType, isMeasurable, stock, isBoxBased, piecesPerBox, boxCount, forceSmallProduct, description } = req.body;

    // Logic for small product
    let isSmallProduct = sellingPrice < settings.smallProductThreshold;
    if (forceSmallProduct !== undefined) {
      isSmallProduct = forceSmallProduct;
    }

    const product = new Product({
      name, 
      image, 
      categories, 
      costPrice: costPrice || 0, 
      sellingPrice, 
      unitType, 
      isMeasurable, 
      stock, 
      isBoxBased, 
      piecesPerBox, 
      boxCount, 
      isSmallProduct, 
      forceSmallProduct, 
      description
    });

    const createdProduct = await product.save();

    // Update category flags for small product optimization
    updateCategorySmallProductFlags().catch(err => console.error(err));

    return res.status(201).json(createdProduct);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// @desc    Update product
// @route   PUT /api/products/:id
const updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    const settings = await Settings.findOne() || { smallProductThreshold: 10 };

    if (product) {
      product.name = req.body.name || product.name;
      product.image = req.body.image || product.image;
      product.categories = req.body.categories || product.categories;
      product.costPrice = req.body.costPrice ?? product.costPrice;
      product.sellingPrice = req.body.sellingPrice ?? product.sellingPrice;
      product.unitType = req.body.unitType || product.unitType;
      product.isMeasurable = req.body.isMeasurable ?? product.isMeasurable;
      product.stock = req.body.stock ?? product.stock;
      product.isBoxBased = req.body.isBoxBased ?? product.isBoxBased;
      product.piecesPerBox = req.body.piecesPerBox ?? product.piecesPerBox;
      product.boxCount = req.body.boxCount ?? product.boxCount;
      product.forceSmallProduct = req.body.forceSmallProduct ?? product.forceSmallProduct;
      product.description = req.body.description || product.description;
      product.isActive = req.body.isActive ?? product.isActive;

      // Re-calculate isSmallProduct
      if (req.body.forceSmallProduct !== undefined) {
        product.isSmallProduct = req.body.forceSmallProduct;
      } else {
        product.isSmallProduct = product.sellingPrice < settings.smallProductThreshold;
      }

      const updatedProduct = await product.save();
      
      // Update category flags for small product optimization
      updateCategorySmallProductFlags().catch(err => console.error(err));
      
      return res.json(updatedProduct);
    } else {
      return res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// @desc    Delete product
// @route   DELETE /api/products/:id
const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (product) {
      await product.deleteOne();
      
      // Update category flags for small product optimization
      updateCategorySmallProductFlags().catch(err => console.error(err));
      
      return res.json({ message: 'Product removed' });
    } else {
      return res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
};
