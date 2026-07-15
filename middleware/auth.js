const jwt = require('jsonwebtoken');
const config = require('../config/config');
const AppError = require('../utils/AppError');
const asyncHandler = require('./asyncHandler');
const User = require('../models/user.model');

const protect = asyncHandler(async (req, res, next) => {
    let token;
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
    }

    if (!token) {
        return next(new AppError('Not authorized, no token provided', 401));
    }

    let decoded;
    try {
        decoded = jwt.verify(token, config.jwtSecret);
    } catch (err) {
        return next(
            new AppError('Not authorized, invalid or expired token', 401)
        );
    }

    const user = await User.findById(decoded.id);

    if (!user) {
        return next(new AppError('Not authorized, user no longer exists', 401));
    }

    req.user = user;
    next();
});

module.exports = protect;
