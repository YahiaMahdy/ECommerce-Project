const errorHandler = (err, req, res, next) => {
    console.error(`[${new Date().toISOString()}] ERROR:`, {
        message: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method,
    });

    const statusCode = err.statusCode || 500;
    const status = err.status || 'error';
    const clientMessage = err.isOperational
        ? err.message
        : 'Something went wrong. Please try again.';

    const body = { status, statusCode, message: clientMessage, data: null };

    if (process.env.NODE_ENV === 'development') body.stack = err.stack;

    res.status(statusCode).json(body);
};

module.exports = errorHandler;