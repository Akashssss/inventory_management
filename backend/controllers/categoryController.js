const Category = require('../models/Category');
const Product = require('../models/Product');

// @desc    Get all categories with pagination and filtering
// @route   GET /api/categories
const getCategories = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 100,
      search = '',
      sortBy = 'name',
      sortOrder = 'asc',
      hasSmallProducts
    } = req.query;

    const query = {};

    // Search by name
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    // Filter by hasSmallProducts
    if (hasSmallProducts !== undefined) {
      query.hasSmallProducts = hasSmallProducts === 'true';
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const skip = (Number(page) - 1) * Number(limit);

    const [categories, total] = await Promise.all([
      Category.find(query)
        .sort(sort)
        .skip(skip)
        .limit(Number(limit)),
      Category.countDocuments(query)
    ]);

    return res.json({
      categories,
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

// @desc    Get categories with small products (optimized for billing)
// @route   GET /api/categories/small-items
const getSmallItemCategories = async (req, res, next) => {
  try {
    const categories = await Category.find({ hasSmallProducts: true, smallProductCount: { $gt: 0 } });
    return res.json(categories);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// @desc    Create a category
// @route   POST /api/categories
const createCategory = async (req, res, next) => {
  const { name, description } = req.body;
  try {
    const categoryExists = await Category.findOne({ name });
    if (categoryExists) {
      return res.status(400).json({ message: 'Category already exists' });
    }
    const category = await Category.create({ name, description });
    return res.status(201).json(category);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// @desc    Update category
// @route   PUT /api/categories/:id
const updateCategory = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);
    if (category) {
      category.name = req.body.name || category.name;
      category.description = req.body.description || category.description;
      
      // Update small product settings if provided
      if (req.body.smallProductThreshold !== undefined) {
        category.smallProductThreshold = req.body.smallProductThreshold;
      }
      
      if (req.body.smallProductPriceTags !== undefined) {
        // Validate price tags
        const priceTags = req.body.smallProductPriceTags || [];
        
        // Check max 10 tags
        if (priceTags.length > 10) {
          return res.status(400).json({ message: 'Maximum 10 price tags allowed' });
        }
        
        // Check for duplicates
        const prices = priceTags.map(tag => tag.price);
        if (new Set(prices).size !== prices.length) {
          return res.status(400).json({ message: 'Duplicate price tags are not allowed' });
        }
        
        // Check all prices are less than threshold
        const threshold = req.body.smallProductThreshold || category.smallProductThreshold;
        for (const tag of priceTags) {
          if (tag.price >= threshold) {
            return res.status(400).json({ 
              message: `Price tag ${tag.price} must be less than threshold ${threshold}` 
            });
          }
        }
        
        category.smallProductPriceTags = priceTags;
      }
      
      const updatedCategory = await category.save();
      return res.json(updatedCategory);
    } else {
      return res.status(404).json({ message: 'Category not found' });
    }
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// @desc    Delete category
// @route   DELETE /api/categories/:id
const deleteCategory = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);
    if (category) {
      await category.deleteOne();
      return res.json({ message: 'Category removed' });
    } else {
      return res.status(404).json({ message: 'Category not found' });
    }
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// Helper function to update category small product flags
const updateCategorySmallProductFlags = async () => {
  try {
    const categories = await Category.find({});
    for (const category of categories) {
      const smallProductCount = await Product.countDocuments({
        categories: category._id,
        isSmallProduct: true,
        stock: { $gt: 0 }
      });
      
      category.hasSmallProducts = smallProductCount > 0;
      category.smallProductCount = smallProductCount;
      await category.save();
    }
  } catch (error) {
    console.error('Error updating category flags:', error);
  }
};

module.exports = {
  getCategories,
  getSmallItemCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  updateCategorySmallProductFlags,
};
