const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
    {
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: [true, 'Product is required'] },
        quantity: { type: Number, required: [true, 'Quantity is required'], min: [1, 'Quantity must be at least 1'] },
        totalPrice: { type: Number, required: [true, 'Total price is required'], min: [0, 'Total price cannot be negative'] },
        status: { type: String, enum: ['pending', 'confirmed', 'delivered'], default: 'pending' },
        customerName: { type: String, required: [true, 'Customer name is required'], trim: true },
    },
    { timestamps: true }
);

const Order = mongoose.model('Order', orderSchema);
module.exports = Order;