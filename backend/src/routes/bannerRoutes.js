const express = require('express');
const router = express.Router();
const bannerController = require('../controllers/bannerController');
const { optionalToken } = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/adminMiddleware');

router.get('/', bannerController.getActiveBanners);
router.get('/all', bannerController.getAllBanners);
router.post('/', optionalToken, requireAdmin, bannerController.saveBanner);
router.put('/:id', optionalToken, requireAdmin, bannerController.saveBanner);
router.delete('/:id', optionalToken, requireAdmin, bannerController.deleteBanner);

module.exports = router;
