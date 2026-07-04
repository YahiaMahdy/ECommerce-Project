const mongoose = require('mongoose');
const config = require("../config/config");

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(config.mongoUri);
        console.log(`MongoDB connected: ${conn.connection.host}`);

        mongoose.connection.on('error', (err) => {
            console.error('MongoDB runtime error:', err.message);
        });
    } catch (err) {
        console.error('MongoDB connection failed:', err.message);
        process.exit(1);
    }
};

module.exports = connectDB;