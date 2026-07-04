require("dotenv").config();

const config = {
    port: process.env.PORT || 3000,
    nodeEnv: process.env.NODE_ENV || "development",
    mongoUri: process.env.MONGO_URI,
    isDev: process.env.NODE_ENV === "development",
    isProd: process.env.NODE_ENV === "production",
};

if (!config.mongoUri) {
    throw new Error("FATAL: MONGO_URI is missing from .env");
}

module.exports = config;