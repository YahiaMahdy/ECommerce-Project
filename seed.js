require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./db/connect');

const Category = require('./models/category.model');
const Product = require('./models/product.model');
const Order = require('./models/order.model');
const Cart = require('./models/cart.model');
const User = require('./models/user.model');

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

const users = [
    {
        name: 'Admin User',
        email: 'admin@example.com',
        password: 'AdminPass123',
        address: '1 Admin Way, Cairo, EG',
        role: 'admin',
    },
    {
        name: 'Jane Customer',
        email: 'jane@example.com',
        password: 'CustomerPass123',
        address: '456 Customer St, Cairo, EG',
        role: 'customer',
    },
];

const seed = async () => {
    let categoryCount = 0;
    let productCount = 0;
    let userCount = 0;

    try {
        await connectDB();
        await Order.deleteMany();
        await Cart.deleteMany();
        await Product.deleteMany();
        await Category.deleteMany();
        await User.deleteMany();

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

        // Uses create() (not insertMany) so the password-hashing pre('save')
        // hook on the User model actually runs for each one.
        const createdUsers = await User.create(users);

        categoryCount = createdCategories.length;
        productCount = createdProducts.length;
        userCount = createdUsers.length;
    } catch (err) {
        console.error('Seed failed:', err);
    } finally {
        console.log(`Seeded ${categoryCount} categories.`);
        console.log(`Seeded ${productCount} products.`);
        console.log(`Seeded ${userCount} users.`);
        console.log('  admin@example.com / AdminPass123 (role: admin)');
        console.log('  jane@example.com / CustomerPass123 (role: customer)');
        await mongoose.disconnect();
        process.exit(0);
    }
};

seed();
