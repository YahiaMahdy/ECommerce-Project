const User = require('../models/user.model');
const asyncHandler = require('../middleware/asyncHandler');
const AppError = require('../utils/AppError');
const generateToken = require('../utils/generateToken');

const ok = (res, data, msg = 'Success', code = 200) =>
    res.status(code).json({
        status: 'success',
        message: msg,
        data,
    });

const toSafeUser = (user) => ({
    id: user._id,
    name: user.name,
    email: user.email,
    address: user.address,
    role: user.role,
});

exports.register = asyncHandler(async (req, res, next) => {
    const { name, email, password, address } = req.body;

    if (!name || !email || !password || !address) {
        return next(
            new AppError('Name, email, password and address are required', 400)
        );
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
        return next(new AppError('Email is already registered', 409));
    }

    const user = await User.create({ name, email, password, address });

    const token = generateToken(user._id);

    ok(
        res,
        { token, user: toSafeUser(user) },
        'User registered successfully',
        201
    );
});

exports.login = asyncHandler(async (req, res, next) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return next(new AppError('Email and password are required', 400));
    }

    const user = await User.findOne({ email }).select('+password');

    if (!user) {
        return next(new AppError('Invalid Credentials', 401));
    }

    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
        return next(new AppError('Invalid Credentials', 401));
    }

    const token = generateToken(user._id);

    ok(res, { token, user: toSafeUser(user) }, 'Login successful');
});
