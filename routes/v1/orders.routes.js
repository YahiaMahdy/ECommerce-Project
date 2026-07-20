const express = require('express');
const router = express.Router();

const orderController = require('../controllers/order.controller');
const protect = require('../middleware/auth');
const { adminOnly } = require('../middleware/role');

router.use(protect);

router.get('/', orderController.getOrders);
router.get('/:id', orderController.getOrderById);
router.post('/', orderController.createOrder);

router.patch('/:id/status', adminOnly, orderController.updateOrderStatus);

module.exports = router;
