const express = require('express');
const router = express.Router();
const Product = require('../models/product.model');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');

const ok = (res, data, msg = 'Success', code = 200) =>
    res.status(code).json({ status: 'success', message: msg, data });

router.get('/', asyncHandler(async (req, res) => {
    const { category, maxPrice } = req.query;
    const filter = {};
    if (category) filter.category = category;
    if (maxPrice) filter.price = { $lte: Number(maxPrice) };
    const products = await Product.find(filter).sort({ createdAt: -1 }).select('-__v');
    ok(res, products, 'Products fetched successfully');
}));

router.get('/:id', asyncHandler(async (req, res, next) => {
    const product = await Product.findById(req.params.id).select('-__v');
    if (!product) return next(new AppError('Product not found', 404));
    ok(res, product, 'Product fetched successfully');
}));

router.post('/', asyncHandler(async (req, res) => {
    const product = await Product.create(req.body);
    ok(res, product, 'Product created successfully', 201);
}));

router.put('/:id', asyncHandler(async (req, res, next) => {
    const { name, category, price, stock } = req.body;
    if (!name || !category || price === undefined || stock === undefined)
        return next(new AppError('All fields required for PUT', 400));
    const product = await Product.findByIdAndUpdate(
        req.params.id,
        { name, category, price, stock },
        { new: true, runValidators: true }
    );
    if (!product) return next(new AppError('Product not found', 404));
    ok(res, product, 'Product replaced successfully');
}));

router.patch('/:id', asyncHandler(async (req, res, next) => {
    const product = await Product.findByIdAndUpdate(
        req.params.id,
        { $set: req.body },
        { new: true, runValidators: true }
    );
    if (!product) return next(new AppError('Product not found', 404));
    ok(res, product, 'Product updated successfully');
}));

router.delete('/:id', asyncHandler(async (req, res, next) => {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return next(new AppError('Product not found', 404));
    ok(res, product, 'Product deleted successfully');
}));

module.exports = router;