const Order = require('../models/order.model');
const Product = require('../models/product.model');
const asyncHandler = require('../middleware/asyncHandler');
const AppError = require('../utils/AppError');

const ok = (res, data, msg = 'Success', code = 200) =>
    res.status(code).json({
        status: 'success',
        message: msg,
        data,
    });

exports.getOrders = asyncHandler(async (req, res) => {
    const orders = await Order.find()
        .populate('items.product', 'name price')
        .sort({ createdAt: -1 });

    ok(res, orders, 'Orders fetched successfully');
});

exports.getOrderById = asyncHandler(async (req, res, next) => {
    const order = await Order.findById(req.params.id)
        .populate('items.product', 'name category price stock');

    if (!order) {
        return next(new AppError('Order not found', 404));
    }

    ok(res, order, 'Order fetched successfully');
});

exports.createOrder = asyncHandler(async (req, res, next) => {
    const { customerName, items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
        return next(new AppError('Order must contain at least one item', 400));
    }

    const productIds = items.map((item) => item.product);
    const products = await Product.find({ _id: { $in: productIds } });

    if (products.length !== productIds.length) {
        return next(new AppError('One or more products not found', 404));
    }

    const productMap = new Map(products.map((product) => [String(product._id), product]));

    const orderItems = items.map((item) => {
        const product = productMap.get(String(item.product));

        if (!product) {
            throw new AppError('One or more products not found', 404);
        }

        if (item.quantity > product.stock) {
            throw new AppError(
                `Only ${product.stock} items in stock for ${product.name}`,
                400
            );
        }

        return {
            product: product._id,
            quantity: item.quantity,
            unitPrice: product.price,
        };
    });

    const totalPrice = orderItems.reduce(
        (sum, item) => sum + item.quantity * item.unitPrice,
        0
    );

    const order = await Order.create({
        customerName,
        items: orderItems,
        totalPrice,
    });

    ok(res, order, 'Order created successfully', 201);
});

exports.updateOrderStatus = asyncHandler(async (req, res, next) => {
    const order = await Order.findByIdAndUpdate(
        req.params.id,
        { $set: { status: req.body.status } },
        { new: true, runValidators: true }
    ).populate('items.product', 'name price');

    if (!order) {
        return next(new AppError('Order not found', 404));
    }

    ok(res, order, 'Order status updated successfully');
});