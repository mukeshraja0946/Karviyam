const express = require('express');
const router = express.Router();
const parentCategoryController = require('../controllers/parentCategoryController');

// Public customer endpoint
router.get('/', parentCategoryController.getParentCategories);

// Admin endpoints
router.get('/admin', parentCategoryController.getAllParentCategoriesAdmin);
router.post('/', parentCategoryController.createParentCategory);
router.put('/reorder', parentCategoryController.reorderParentCategories);
router.put('/:id', parentCategoryController.updateParentCategory);
router.delete('/all', parentCategoryController.deleteAllParentCategories);
router.post('/delete-all', parentCategoryController.deleteAllParentCategories);
router.delete('/:id', parentCategoryController.deleteParentCategory);

module.exports = router;
