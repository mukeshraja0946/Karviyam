const express = require('express');
const router = express.Router();
const emailMarketingController = require('../controllers/emailMarketingController');

// Admin Email Marketing Routes
router.get('/campaigns', emailMarketingController.getCampaigns);
router.post('/send', emailMarketingController.sendCampaign);
router.post('/test', emailMarketingController.sendTestMail);

module.exports = router;
