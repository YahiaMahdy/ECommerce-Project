const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Category name is required'],
            trim: true,
            unique: true,
        },
        description: {
            type: String,
            trim: true,
            default: '',
        },
        slug: {
            type: String,
            trim: true,
            unique: true,
            default: '',
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Category', categorySchema);