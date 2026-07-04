require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./db/connect');
const Product = require('./models/product.model');
const Order = require('./models/order.model');

const products = [
    { name: 'Laptop', category: 'electronics', price: 999, stock: 15 },
    { name: 'Headphones', category: 'electronics', price: 149, stock: 42 },
    { name: 'Desk Chair', category: 'furniture', price: 299, stock: 8 },
    { name: 'Notebook', category: 'stationery', price: 5, stock: 200 },
    { name: 'Coffee Mug', category: 'kitchen', price: 12, stock: 75 },
];

const seed = async () => {
    try {
        await connectDB();
        await Order.deleteMany();
        await Product.deleteMany();
        const created = await Product.insertMany(products);
        console.log(`Seeded ${created.length} products successfully`);
    } catch (err) {
        console.error('Seed failed:', err.message);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
};

seed();