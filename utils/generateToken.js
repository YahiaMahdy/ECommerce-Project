const jwt = require('jsonwebtoken');
const config = require('../config/config');

const generateToken = (userId) =>
    jwt.sign({ id: userId }, config.jwtSecret, {
        expiresIn: config.jwtExpiresIn,
    });

module.exports = generateToken;
