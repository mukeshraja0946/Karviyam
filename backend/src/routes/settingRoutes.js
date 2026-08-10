const express = require('express');
const router = express.Router();
const settingController = require('../controllers/settingController');
const { optionalToken } = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/adminMiddleware');

// General key-value settings
router.get('/', settingController.getSettings);
router.get('/maintenance-status', settingController.getSettings);
router.post('/', optionalToken, requireAdmin, settingController.updateSettings);
router.put('/', optionalToken, requireAdmin, settingController.updateSettings);

// Payment settings
router.get('/payment', settingController.getPaymentSettings);
router.post('/payment', optionalToken, requireAdmin, settingController.updatePaymentSettings);
router.put('/payment', optionalToken, requireAdmin, settingController.updatePaymentSettings);

// Company settings
router.get('/company', settingController.getCompanySettings);
router.post('/company', optionalToken, requireAdmin, settingController.updateCompanySettings);
router.put('/company', optionalToken, requireAdmin, settingController.updateCompanySettings);

module.exports = router;
