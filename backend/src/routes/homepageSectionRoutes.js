const express = require('express');
const router = express.Router();
const homepageSectionController = require('../controllers/homepageSectionController');

// Public Storefront Route (For Desktop & Mobile)
router.get('/', homepageSectionController.getPublicHomepageSections);
router.get('/public', homepageSectionController.getPublicHomepageSections);

// Admin Management Routes
router.get('/admin', homepageSectionController.getAdminHomepageSections);
router.put('/admin', homepageSectionController.updateAdminHomepageSections);
router.post('/admin', homepageSectionController.updateAdminHomepageSections);

// Aliases for when router is mounted at /api/admin/homepage-sections
router.put('/', homepageSectionController.updateAdminHomepageSections);
router.post('/', homepageSectionController.updateAdminHomepageSections);

module.exports = router;
