const Category = require('../models/category.model');
const Product = require('../models/product.model');
const asyncHandler = require('../middleware/asyncHandler');
const AppError = require('../utils/AppError');

const ok = (res, data, msg = 'Success', code = 200) =>
    res.status(code).json({
        status: 'success',
        message: msg,
        data,
    });

exports.getCategories = asyncHandler(async (req, res) => {
    const categories = await Category.find().sort({ createdAt: -1 });
    ok(res, categories, 'Categories fetched successfully');
});

exports.getCategoryById = asyncHandler(async (req, res, next) => {
    const category = await Category.findById(req.params.id);

    if (!category) {
        return next(new AppError('Category not found', 404));
    }

    ok(res, category, 'Category fetched successfully');
});

exports.createCategory = asyncHandler(async (req, res) => {
    const category = await Category.create(req.body);
    ok(res, category, 'Category created successfully', 201);
});

exports.updateCategory = asyncHandler(async (req, res, next) => {
    const category = await Category.findByIdAndUpdate(
        req.params.id,
        { $set: req.body },
        { new: true, runValidators: true }
    );

    if (!category) {
        return next(new AppError('Category not found', 404));
    }

    ok(res, category, 'Category updated successfully');
});

exports.deleteCategory = asyncHandler(async (req, res, next) => {
    const category = await Category.findById(req.params.id);

    if (!category) {
        return next(new AppError('Category not found', 404));
    }

    const productsUsingCategory = await Product.exists({ category: req.params.id });

    if (productsUsingCategory) {
        return next(
            new AppError('Cannot delete category because products are using it', 400)
        );
    }

    await Category.findByIdAndDelete(req.params.id);

    ok(res, category, 'Category deleted successfully');
});