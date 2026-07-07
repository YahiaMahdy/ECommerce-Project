const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema(
    {
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: [true, 'Product is required'],
        },
        name: {
            type: String,
            required: [true, 'name is required'],
        },
        quantity: {
            type: Number,
            required: [true, 'Quantity is required'],
            min: [1, 'Quantity must be at least 1'],
        },
        price: {
            type: Number,
            required: [true, 'price is required'],
            min: [0, 'price cannot be negative'],
        },
    },
    { _id: false }
);

const orderSchema = new mongoose.Schema(
    {
        orderNumber: {
            type: String,
            unique: true,
        },

        customerName: {
            type: String,
            required: [true, 'customerName is required'],
            trim: true,
        },

        shippingAddress: {
            type: String,
            required: [true, 'shippingAddress is required'],
            trim: true,
        },

        items: {
            type: [orderItemSchema],
            required: [true, 'Items are required'],
            validate: {
                validator: (items) => items.length > 0,
                message: 'Order must contain at least one item.',
            },
        },

        totalPrice: {
            type: Number,
            required: [true, 'Total price is required'],
            min: [0, 'Total price cannot be negative'],
        },

        status: {
            type: String,
            enum: ['pending', 'confirmed', 'delivered'],
            default: 'pending',
        },
    },
    { timestamps: true }
);
orderSchema.pre('validate', function generateOrderNumber() {
    if (!this.orderNumber) {
        const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const randomPart = Math.floor(1000 + Math.random() * 9000);
        this.orderNumber = `ORD-${datePart}-${randomPart}`;
    }
});

module.exports = mongoose.model('Order', orderSchema);