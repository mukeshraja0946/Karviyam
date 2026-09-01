const express = require('express');
const router = express.Router();
const homepageSectionController = require('../controllers/homepageSectionController');

// Public Storefront Route (For Desktop & Mobile)
router.get('/', homepageSectionController.getPublicHomepageSections);

// Admin Management Routes
router.get('/admin', homepageSectionController.getAdminHomepageSections);
router.put('/admin', homepageSectionController.updateAdminHomepageSections);

module.exports = router;
