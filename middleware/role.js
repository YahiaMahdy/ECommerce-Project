const AppError = require('../utils/AppError');

const restrictTo = (...roles) => (req, res, next) => {
    if (!req.user) {
        return next(new AppError('Not authorized, please log in', 401));
    }

    if (!roles.includes(req.user.role)) {
        return next(
            new AppError(
                'Forbidden: you do not have permission to perform this action',
                403
            )
        );
    }

    next();
};

const adminOnly = restrictTo('admin');

module.exports = { restrictTo, adminOnly };
