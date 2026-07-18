const express = require('express');
const router = express.Router();

const productController = require('../controllers/product.controller');
const protect = require('../middleware/auth');
const { adminOnly } = require('../middleware/role');

router.get('/', productController.getProducts);

router.get('/:id', productController.getProductById);

router.post('/', protect, adminOnly, productController.createProduct);

router.put('/:id', protect, adminOnly, productController.replaceProduct);

router.patch('/:id', protect, adminOnly, productController.updateProduct);

router.delete('/:id', protect, adminOnly, productController.deleteProduct);

module.exports = router;
