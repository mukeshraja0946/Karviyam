const express = require('express');
const router = express.Router();
const bannerController = require('../controllers/bannerController');
const { optionalToken } = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/adminMiddleware');

router.get('/', bannerController.getActiveBanners);
router.get('/all', bannerController.getAllBanners);
router.post('/settings', optionalToken, requireAdmin, bannerController.updateBannerSettings);
router.post('/', optionalToken, requireAdmin, bannerController.saveBanner);
router.put('/:id', optionalToken, requireAdmin, bannerController.saveBanner);
router.delete('/all', optionalToken, requireAdmin, bannerController.deleteAllBanners);
router.post('/delete-all', optionalToken, requireAdmin, bannerController.deleteAllBanners);
router.delete('/:id', optionalToken, requireAdmin, bannerController.deleteBanner);

module.exports = router;
