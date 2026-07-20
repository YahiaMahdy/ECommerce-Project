const config = require("./config/config");
const express = require('express');
const mongoSanitize = require('express-mongo-sanitize');
const connectDB = require('./db/connect');
const errorHandler = require('./middleware/errorHandler');
const AppError = require('./utils/AppError');
const { authLimiter, generalLimiter } = require('./middleware/rateLimiter');
const productsRouter = require(`./routes/v1/products.routes`);
const ordersRouter = require(`./routes/v1/orders.routes`);
const cartRouter = require(`./routes/v1/cart.routes`);
const categoryRouter = require(`./routes/v1/category.routes`);
const authRouter = require(`./routes/v1/auth.routes`);

const app = express();

app.use(express.json());
app.use(mongoSanitize());
app.use(generalLimiter);

app.use(`/api/v1/auth`, authLimiter, authRouter);
app.use(`/api/v1/categories`, categoryRouter);
app.use(`/api/v1/products`, productsRouter);
app.use(`/api/v1/orders`, ordersRouter);
app.use(`/api/v1/cart`, cartRouter);

app.use((req, res, next) => {
    next(new AppError(`Can't find ${req.originalUrl}`, 404));
});

app.use(errorHandler);

const start = async () => {
    await connectDB();
    app.listen(config.port || 3000, () => {
        console.log(`Server running on port ${config.port}`);
    });
};

start();
