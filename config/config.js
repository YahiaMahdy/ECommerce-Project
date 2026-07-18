require("dotenv").config();

const config = {
    port: process.env.PORT || 3000,
    nodeEnv: process.env.NODE_ENV || "development",
    mongoUri: process.env.MONGO_URI,
    jwtSecret: process.env.JWT_SECRET,
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || "1h",
    isDev: process.env.NODE_ENV === "development",
    isProd: process.env.NODE_ENV === "production",
};

if (!config.mongoUri) {
    throw new Error("FATAL: MONGO_URI is missing from .env");
}

if (!config.jwtSecret) {
    throw new Error("FATAL: JWT_SECRET is missing from .env");
}

module.exports = config;
