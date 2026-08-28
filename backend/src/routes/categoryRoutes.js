const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { optionalToken } = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/adminMiddleware');

router.get('/', categoryController.getAllCategories);
router.get('/tree', categoryController.getCategoryTree);
router.get('/:id', categoryController.getCategoryById);

router.post('/bulk-import', optionalToken, requireAdmin, categoryController.bulkImportCategories);
router.post('/reorder', optionalToken, requireAdmin, categoryController.reorderCategories);

router.put('/:id/toggle-status', optionalToken, requireAdmin, categoryController.toggleStatus);
router.post('/:id/toggle-status', optionalToken, requireAdmin, categoryController.toggleStatus);

router.delete('/all', optionalToken, requireAdmin, categoryController.deleteAllCategories);
router.post('/delete-all', optionalToken, requireAdmin, categoryController.deleteAllCategories);
router.post('/delete-batch', optionalToken, requireAdmin, categoryController.deleteSelectedCategories);
router.delete('/delete-batch', optionalToken, requireAdmin, categoryController.deleteSelectedCategories);

router.delete('/:id', optionalToken, requireAdmin, categoryController.deleteCategory);
router.post('/:id/delete', optionalToken, requireAdmin, categoryController.deleteCategory);

router.post('/', optionalToken, requireAdmin, categoryController.createCategory);
router.put('/:id', optionalToken, requireAdmin, categoryController.updateCategory);
router.post('/:id', optionalToken, requireAdmin, categoryController.updateCategory);

module.exports = router;
