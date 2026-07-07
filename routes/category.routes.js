const express = require('express');
const router = express.Router();

const categoryController = require('../controllers/category.controller');
const protect = require('../middleware/auth');
const { adminOnly } = require('../middleware/role');

router.get('/', categoryController.getCategories);
router.get('/:id', categoryController.getCategoryById);

router.post('/', protect, adminOnly, categoryController.createCategory);
router.patch('/:id', protect, adminOnly, categoryController.updateCategory);
router.delete('/:id', protect, adminOnly, categoryController.deleteCategory);

module.exports = router;
