const Order = require('../models/order.model');
const Product = require('../models/product.model');
const Cart = require('../models/cart.model');
const asyncHandler = require('../middleware/asyncHandler');
const AppError = require('../utils/AppError');

const ok = (res, data, msg = 'Success', code = 200) =>
    res.status(code).json({
        status: 'success',
        message: msg,
        data,
    });

const canAccessOrder = (order, user) =>
    user.role === 'admin' || String(order.user) === String(user._id);

exports.getOrders = asyncHandler(async (req, res) => {
    const filter = req.user.role === 'admin' ? {} : { user: req.user._id };

    const orders = await Order.find(filter)
        .populate('items.product', 'name price')
        .sort({ createdAt: -1 });

    ok(res, orders, 'Orders fetched successfully');
});

exports.getOrderById = asyncHandler(async (req, res, next) => {
    const order = await Order.findById(req.params.id).populate(
        'items.product',
        'name category price stock'
    );

    if (!order) {
        return next(new AppError('Order not found', 404));
    }

    if (!canAccessOrder(order, req.user)) {
        return next(
            new AppError('Forbidden: this order does not belong to you', 403)
        );
    }

    ok(res, order, 'Order fetched successfully');
});

exports.createOrder = asyncHandler(async (req, res, next) => {
    const { cartId } = req.body;

    const shippingAddress = req.body.shippingAddress || req.user.address;

    if (!cartId) {
        return next(new AppError('cartId is required', 400));
    }

    if (!shippingAddress) {
        return next(new AppError('shippingAddress is required', 400));
    }

    const cart = await Cart.findById(cartId).populate('items.product');

    if (!cart) {
        return next(new AppError('Cart not found', 404));
    }

    if (req.user.role !== 'admin' && String(cart.user) !== String(req.user._id)) {
        return next(
            new AppError('Forbidden: this cart does not belong to you', 403)
        );
    }

    if (cart.items.length === 0) {
        return next(new AppError('Cart is empty', 400));
    }

    if (cart.status !== 'active') {
        return next(new AppError('Only active carts can be checked out', 400));
    }

    const orderItems = [];

    for (const item of cart.items) {
        const product = item.product;

        if (!product) {
            return next(new AppError('One or more products no longer exist', 404));
        }

        if (item.quantity > product.stock) {
            return next(
                new AppError(`Only ${product.stock} left in stock for ${product.name}`, 400)
            );
        }

        orderItems.push({
            product: product._id,
            name: product.name,
            price: product.price,
            quantity: item.quantity,
        });
    }

    const totalPrice = orderItems.reduce(
        (sum, item) => sum + item.quantity * item.price,
        0
    );

    await Promise.all(
        orderItems.map((item) =>
            Product.findByIdAndUpdate(item.product, { $inc: { stock: -item.quantity } })
        )
    );

    const order = await Order.create({
        user: cart.user,
        customerName: cart.customerName,
        shippingAddress,
        items: orderItems,
        totalPrice,
    });

    cart.items = [];
    cart.totalPrice = 0;
    cart.status = 'checked_out';
    await cart.save();

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
