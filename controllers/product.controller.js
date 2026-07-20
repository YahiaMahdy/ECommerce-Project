const Product = require('../models/product.model');
const Category = require('../models/category.model');
const asyncHandler = require('../middleware/asyncHandler');
const AppError = require('../utils/AppError');

const ok = (res, data, msg = 'Success', code = 200) =>
    res.status(code).json({
        status: 'success',
        message: msg,
        data,
    });

exports.getProducts = asyncHandler(async (req, res) => {
    const { category, minPrice, maxPrice, inStock,
        page: pageQ, limit: limitQ,
        sortBy, order, search, fields } = req.query;

    const filter = {};
    if (category) filter.category = category;
    if (minPrice || maxPrice) {
        filter.price = {};
        if (minPrice) filter.price.$gte = Number(minPrice);
        if (maxPrice) filter.price.$lte = Number(maxPrice);
    }
    if (inStock !== undefined) filter.inStock = inStock === 'true';
    if (search) filter.name = { $regex: search, $options: 'i' };

    const page = Math.max(1, parseInt(pageQ) || 1);
    const limit = Math.min(50, parseInt(limitQ) || 10);
    const skip = (page - 1) * limit;

    const allowedSortFields = ['price', 'name', 'createdAt', 'stock'];
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
    const sortOrder = order === 'asc' ? 1 : -1;

    const allowedFields = ['name', 'category', 'price', 'stock', 'inStock'];
    let selectStr = '-__v';
    if (fields) {
        const requested = fields.split(',').filter(f => allowedFields.includes(f.trim()));
        if (requested.length > 0) selectStr = requested.join(' ');
    }

    const [products, total] = await Promise.all([
        Product
            .find(filter)
            .sort({ [sortField]: sortOrder })
            .skip(skip)
            .limit(limit)
            .select(selectStr)
            .lean(),
        Product.countDocuments(filter),
    ]);

    ok(res, {
        products,
        pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        },
    }, 'Products fetched successfully');
});

exports.getProductById = asyncHandler(async (req, res, next) => {
    const product = await Product.findById(req.params.id)
        .populate('category', 'name description')
        .select('-__v');

    if (!product) {
        return next(new AppError('Product not found', 404));
    }

    ok(res, product, 'Product fetched successfully');
});

exports.createProduct = asyncHandler(async (req, res, next) => {
    const { category } = req.body;

    if (!category) {
        return next(new AppError('Category is required', 400));
    }

    const categoryExists = await Category.findById(category);

    if (!categoryExists) {
        return next(new AppError('Category not found', 404));
    }

    const product = await Product.create(req.body);

    ok(res, product, 'Product created successfully', 201);
});

exports.replaceProduct = asyncHandler(async (req, res, next) => {
    const { name, category, price, stock } = req.body;

    if (
        !name ||
        !category ||
        price === undefined ||
        stock === undefined
    ) {
        return next(new AppError('All fields required for PUT', 400));
    }

    const product = await Product.findByIdAndUpdate(
        req.params.id,
        {
            name,
            category,
            price,
            stock,
        },
        {
            new: true,
            runValidators: true,
        }
    );

    if (!product) {
        return next(new AppError('Product not found', 404));
    }

    ok(res, product, 'Product replaced successfully');
});

exports.updateProduct = asyncHandler(async (req, res, next) => {
    const product = await Product.findByIdAndUpdate(
        req.params.id,
        {
            $set: req.body,
        },
        {
            new: true,
            runValidators: true,
        }
    );

    if (!product) {
        return next(new AppError('Product not found', 404));
    }

    ok(res, product, 'Product updated successfully');
});

exports.deleteProduct = asyncHandler(async (req, res, next) => {
    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
        return next(new AppError('Product not found', 404));
    }

    ok(res, product, 'Product deleted successfully');
});