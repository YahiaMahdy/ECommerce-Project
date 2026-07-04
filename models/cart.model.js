const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema(
    {
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: [true, 'Product is required'],
        },
        quantity: {
            type: Number,
            required: [true, 'Quantity is required'],
            min: [1, 'Quantity must be at least 1'],
            default: 1,
        },
        price: {
            type: Number,
            required: [true, 'price is required'],
            min: [0, 'price cannot be negative'],
        },
    },
    { _id: false }
);

const cartSchema = new mongoose.Schema(
    {
        customerName: {
            type: String,
            required: [true, 'customerName is required'],
            trim: true,
        },

        items: {
            type: [cartItemSchema],
            default: [],
            validate: {
                validator: (items) => items.length >= 0,
            },
        },

        totalPrice: {
            type: Number,
            default: 0,
            min: [0, 'Total price cannot be negative'],
        },

        status: {
            type: String,
            enum: ['active', 'checked_out', 'abandoned'],
            default: 'active',
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Cart', cartSchema);