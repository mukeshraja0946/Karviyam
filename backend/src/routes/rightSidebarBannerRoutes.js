const express = require('express');
const router = express.Router();
const controller = require('../controllers/rightSidebarBannerController');

// Public - Get Active Banners
router.get('/', controller.getActiveBanners);

// Admin - Get All Banners
router.get('/admin', controller.getAllBannersAdmin);

// Admin - Create Banner
router.post('/', controller.createBanner);

// Admin - Update Banner
router.put('/:id', controller.updateBanner);

// Admin - Delete Banner
router.delete('/:id', controller.deleteBanner);

// Admin - Toggle Status
router.patch('/:id/toggle', controller.toggleBannerStatus);

module.exports = router;
