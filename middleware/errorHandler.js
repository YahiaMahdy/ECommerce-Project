const config = require("../config/config");

const errorHandler = (err, req, res, next) => {
    let statusCode = err.statusCode || 500;
    let message = err.message || "Internal Server Error";

    if (err.name === "ValidationError") {
        statusCode = 400;
        const firstMsg = Object.values(err.errors)[0].message;
        message = `Validation failed: ${firstMsg}`;
    }

    if (err.name === "CastError") {
        statusCode = 400;
        message = `Invalid _id: ${err.value}`;
    }

    if (err.code === 11000) {
        statusCode = 409;
        const field = Object.keys(err.keyValue)[0];
        message = `${field} already exists`;
    }

    const response = {
        status: statusCode < 500 ? "fail" : "error",
        statusCode,
        message,
    };

    if (config.isDev) {
        response.stack = err.stack;
    }

    res.status(statusCode).json(response);
};

module.exports = errorHandler;