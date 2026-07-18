const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        status: 'fail',
        statusCode: 429,
        message: 'Too many login attempts. Please try again in 15 minutes.',
    },
});

module.exports = loginLimiter;
