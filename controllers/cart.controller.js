const Cart = require('../models/cart.model');
const Product = require('../models/product.model');
const Order = require('../models/order.model');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');

const ok = (res, data, msg = 'Success', code = 200) =>
    res.status(code).json({
        status: 'success',
        message: msg,
        data,
    });

const populateCart = (query) =>
    query.populate('items.product', 'name price stock category');

const recalculateTotal = (items) =>
    items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

exports.getCarts = asyncHandler(async (req, res) => {
    const carts = await populateCart(Cart.find().sort({ createdAt: -1 }));
    ok(res, carts, 'Carts fetched successfully');
});

exports.getCartById = asyncHandler(async (req, res, next) => {
    const cart = await populateCart(Cart.findById(req.params.id));

    if (!cart) {
        return next(new AppError('Cart not found', 404));
    }

    ok(res, cart, 'Cart fetched successfully');
});

exports.createCart = asyncHandler(async (req, res, next) => {
    const { customerName, items = [] } = req.body;

    if (!customerName) {
        return next(new AppError('customerName is required', 400));
    }

    const cartItems = [];

    if (items.length > 0) {
        for (const item of items) {
            const product = await Product.findById(item.product);

            if (!product) {
                return next(new AppError('One or more products not found', 404));
            }

            if (item.quantity < 1) {
                return next(new AppError('Quantity must be at least 1', 400));
            }

            cartItems.push({
                product: product._id,
                quantity: item.quantity,
                unitPrice: product.price,
            });
        }
    }

    const totalPrice = recalculateTotal(cartItems);

    const cart = await Cart.create({
        customerName,
        items: cartItems,
        totalPrice,
    });

    ok(res, cart, 'Cart created successfully', 201);
});

exports.addItemToCart = asyncHandler(async (req, res, next) => {
    const { productId, quantity = 1 } = req.body;

    if (!productId) {
        return next(new AppError('productId is required', 400));
    }

    if (quantity < 1) {
        return next(new AppError('Quantity must be at least 1', 400));
    }

    const cart = await Cart.findById(req.params.id);
    if (!cart) {
        return next(new AppError('Cart not found', 404));
    }

    if (cart.status !== 'active') {
        return next(new AppError('Only active carts can be modified', 400));
    }

    const product = await Product.findById(productId);
    if (!product) {
        return next(new AppError('Product not found', 404));
    }

    const existingItem = cart.items.find(
        (item) => String(item.product) === String(productId)
    );

    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        cart.items.push({
            product: product._id,
            quantity,
            unitPrice: product.price,
        });
    }

    cart.totalPrice = recalculateTotal(cart.items);
    await cart.save();

    const populatedCart = await populateCart(Cart.findById(cart._id));
    ok(res, populatedCart, 'Item added to cart successfully');
});

exports.updateCartItemQuantity = asyncHandler(async (req, res, next) => {
    const { quantity } = req.body;
    const { productId } = req.params;

    if (quantity === undefined) {
        return next(new AppError('quantity is required', 400));
    }

    if (quantity < 1) {
        return next(new AppError('Quantity must be at least 1', 400));
    }

    const cart = await Cart.findById(req.params.id);
    if (!cart) {
        return next(new AppError('Cart not found', 404));
    }

    if (cart.status !== 'active') {
        return next(new AppError('Only active carts can be modified', 400));
    }

    const item = cart.items.find(
        (i) => String(i.product) === String(productId)
    );

    if (!item) {
        return next(new AppError('Cart item not found', 404));
    }

    item.quantity = quantity;
    cart.totalPrice = recalculateTotal(cart.items);

    await cart.save();

    const populatedCart = await populateCart(Cart.findById(cart._id));
    ok(res, populatedCart, 'Cart item quantity updated successfully');
});

exports.removeCartItem = asyncHandler(async (req, res, next) => {
    const { productId } = req.params;

    const cart = await Cart.findById(req.params.id);
    if (!cart) {
        return next(new AppError('Cart not found', 404));
    }

    if (cart.status !== 'active') {
        return next(new AppError('Only active carts can be modified', 400));
    }

    const originalLength = cart.items.length;
    cart.items = cart.items.filter(
        (item) => String(item.product) !== String(productId)
    );

    if (cart.items.length === originalLength) {
        return next(new AppError('Cart item not found', 404));
    }

    cart.totalPrice = recalculateTotal(cart.items);
    await cart.save();

    const populatedCart = await populateCart(Cart.findById(cart._id));
    ok(res, populatedCart, 'Cart item removed successfully');
});

exports.clearCart = asyncHandler(async (req, res, next) => {
    const cart = await Cart.findById(req.params.id);
    if (!cart) {
        return next(new AppError('Cart not found', 404));
    }

    if (cart.status !== 'active') {
        return next(new AppError('Only active carts can be modified', 400));
    }

    cart.items = [];
    cart.totalPrice = 0;
    await cart.save();

    ok(res, cart, 'Cart cleared successfully');
});

exports.updateCartStatus = asyncHandler(async (req, res, next) => {
    const { status } = req.body;

    const cart = await Cart.findByIdAndUpdate(
        req.params.id,
        { $set: { status } },
        { new: true, runValidators: true }
    );

    if (!cart) {
        return next(new AppError('Cart not found', 404));
    }

    ok(res, cart, 'Cart status updated successfully');
});

exports.checkoutCart = asyncHandler(async (req, res, next) => {
    const cart = await populateCart(Cart.findById(req.params.id));

    if (!cart) {
        return next(new AppError('Cart not found', 404));
    }

    if (cart.items.length === 0) {
        return next(new AppError('Cart is empty', 400));
    }

    if (cart.status !== 'active') {
        return next(new AppError('Only active carts can be checked out', 400));
    }

    const orderItems = cart.items.map((item) => ({
        product: item.product._id,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
    }));

    const orderTotal = recalculateTotal(cart.items);

    const order = await Order.create({
        customerName: cart.customerName,
        items: orderItems,
        totalPrice: orderTotal,
        status: 'pending',
    });

    cart.status = 'checked_out';
    await cart.save();

    ok(res, order, 'Cart checked out successfully', 201);
});