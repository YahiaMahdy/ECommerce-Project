require('dotenv').config();

const express = require('express');
const mongoSanitize = require('express-mongo-sanitize');
const connectDB = require('./db/connect');
const productsRouter = require('./routes/products.routes');
const ordersRouter = require('./routes/orders.routes');
const cartRouter = require('./routes/cart.routes');
const errorHandler = require('./middleware/errorHandler');
const AppError = require('./utils/AppError');

const app = express();

app.use(express.json());
app.use(mongoSanitize());

app.use('/api/products', productsRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/cart', cartRouter);

app.use((req, res, next) => {
    next(new AppError(`Can't find ${req.originalUrl}`, 404));
});

app.use(errorHandler);

const start = async () => {
    await connectDB();
    app.listen(process.env.PORT || 3000, () => {
        console.log(`Server running on port ${process.env.PORT}`);
    });
};

start();