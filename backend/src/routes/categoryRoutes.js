const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { optionalToken } = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/adminMiddleware');

router.get('/', categoryController.getAllCategories);
router.get('/tree', categoryController.getCategoryTree);
router.get('/:id', categoryController.getCategoryById);

router.post('/', optionalToken, requireAdmin, categoryController.createCategory);
router.post('/bulk-import', optionalToken, requireAdmin, categoryController.bulkImportCategories);
router.put('/:id', optionalToken, requireAdmin, categoryController.updateCategory);
router.delete('/:id', optionalToken, requireAdmin, categoryController.deleteCategory);
router.post('/reorder', optionalToken, requireAdmin, categoryController.reorderCategories);
router.put('/:id/toggle-status', optionalToken, requireAdmin, categoryController.toggleStatus);

module.exports = router;
