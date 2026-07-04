const express = require('express');
const router = express.Router();
const Order = require('../models/order.model');
const Product = require('../models/product.model');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');

const ok = (res, data, msg = 'Success', code = 200) =>
    res.status(code).json({ status: 'success', message: msg, data });

router.get('/', asyncHandler(async (req, res) => {
    const orders = await Order
        .find()
        .populate('product', 'name price')
        .sort({ createdAt: -1 });
    ok(res, orders, 'Orders fetched successfully');
}));

router.get('/:id', asyncHandler(async (req, res, next) => {
    const order = await Order
        .findById(req.params.id)
        .populate('product', 'name category price stock');
    if (!order) return next(new AppError('Order not found', 404));
    ok(res, order, 'Order fetched successfully');
}));

router.post('/', asyncHandler(async (req, res, next) => {
    const { productId, quantity, customerName } = req.body;

    const product = await Product.findById(productId);
    if (!product) return next(new AppError('Product not found', 404));

    if (quantity > product.stock)
        return next(new AppError(`Only ${product.stock} items in stock`, 400));

    const totalPrice = product.price * quantity;

    const order = await Order.create({
        product: productId,
        quantity,
        totalPrice,
        customerName,
    });

    ok(res, order, 'Order created successfully', 201);
}));

router.patch('/:id/status', asyncHandler(async (req, res, next) => {
    const order = await Order.findByIdAndUpdate(
        req.params.id,
        { $set: { status: req.body.status } },
        { new: true, runValidators: true }
    ).populate('product', 'name price');
    if (!order) return next(new AppError('Order not found', 404));
    ok(res, order, 'Order status updated successfully');
}));

module.exports = router;