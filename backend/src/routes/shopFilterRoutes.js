const express = require('express');
const router = express.Router();
const shopFilterController = require('../controllers/shopFilterController');
const { optionalToken } = require('../middleware/authMiddleware');

// Public customer route
router.get('/filter-config', optionalToken, shopFilterController.getShopFilterConfig);

// Admin routes
router.get('/admin-config', shopFilterController.getAdminFilterConfig);
router.put('/sections', shopFilterController.updateFilterSections);
router.post('/options', shopFilterController.createFilterOption);
router.put('/options/:id', shopFilterController.updateFilterOption);
router.delete('/options/:id', shopFilterController.deleteFilterOption);
router.put('/reorder-options', shopFilterController.reorderFilterOptions);

module.exports = router;
