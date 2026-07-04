require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./db/connect');

const Category = require('./models/category.model');
const Product = require('./models/product.model');
const Order = require('./models/order.model');
const Cart = require('./models/cart.model');

const categories = [
    {
        name: 'electronics',
        description: 'Electronic devices and accessories',
    },
    {
        name: 'furniture',
        description: 'Furniture for home and office',
    },
    {
        name: 'stationery',
        description: 'Office and school supplies',
    },
    {
        name: 'kitchen',
        description: 'Kitchen appliances and utensils',
    },
];

const products = [
    {
        name: 'Laptop',
        category: 'electronics',
        price: 999,
        stock: 15,
    },
    {
        name: 'Headphones',
        category: 'electronics',
        price: 149,
        stock: 42,
    },
    {
        name: 'Desk Chair',
        category: 'furniture',
        price: 299,
        stock: 8,
    },
    {
        name: 'Notebook',
        category: 'stationery',
        price: 5,
        stock: 200,
    },
    {
        name: 'Coffee Mug',
        category: 'kitchen',
        price: 12,
        stock: 75,
    },
    {
        name: 'Blender',
        category: 'kitchen',
        price: 89,
        stock: 20,
    },
    {
        name: 'Bookshelf',
        category: 'furniture',
        price: 179,
        stock: 10,
    },
];

const seed = async () => {
    let categoryCount = 0;
    let productCount = 0;

    try {
        await connectDB();
        await Order.deleteMany();
        await Cart.deleteMany();
        await Product.deleteMany();
        await Category.deleteMany();

        const createdCategories = await Category.insertMany(categories);
        const categoryMap = {};
        createdCategories.forEach((category) => {
            categoryMap[category.name] = category._id;
        });
        const productsWithCategoryIds = products.map((product) => ({
            ...product,
            category: categoryMap[product.category],
        }));

        const createdProducts = await Product.insertMany(productsWithCategoryIds);

        categoryCount = createdCategories.length;
        productCount = createdProducts.length;
    } catch (err) {
        console.error('Seed failed:', err);
    } finally {
        console.log(`Seeded ${categoryCount} categories.`);
        console.log(`Seeded ${productCount} products.`);
        await mongoose.disconnect();
        process.exit(0);
    }
};

seed();