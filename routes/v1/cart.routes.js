const express = require('express');
const router = express.Router();

const cartController = require('../../controllers/cart.controller');
const protect = require('../../middleware/auth');

router.use(protect);

router.get('/', cartController.getCarts);
router.get('/:id', cartController.getCartById);

router.post('/', cartController.createCart);

router.post('/:id/items', cartController.addItemToCart);
router.patch('/:id/items/:productId', cartController.updateCartItemQuantity);
router.delete('/:id/items/:productId', cartController.removeCartItem);

router.delete('/:id/items', cartController.clearCart);

router.patch('/:id/status', cartController.updateCartStatus);

module.exports = router;