const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
    {
        name: { type: String, required: [true, 'Product name is required'], trim: true, unique: true },
        category: { type: String, required: [true, 'Category is required'], enum: ['electronics', 'furniture', 'stationery', 'kitchen'] },
        price: { type: Number, required: [true, 'Price is required'], min: [0, 'Price cannot be negative'] },
        stock: { type: Number, required: [true, 'Stock is required'], min: [0, 'Stock cannot be negative'], default: 0 },
        inStock: { type: Boolean, default: true },
    },
    { timestamps: true }
);

const Product = mongoose.model('Product', productSchema);
module.exports = Product;