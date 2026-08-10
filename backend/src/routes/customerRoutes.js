const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');
const { optionalToken, authenticateToken } = require('../middleware/authMiddleware');

router.get('/settings', optionalToken, customerController.getSettings);
router.put('/settings', optionalToken, customerController.updateSettings);
router.get('/addresses', optionalToken, customerController.getAddresses);
router.post('/addresses', optionalToken, customerController.createAddress);
router.put('/addresses/:id', optionalToken, customerController.updateAddress);
router.put('/addresses/:id/default', optionalToken, customerController.setDefaultAddress);
router.delete('/addresses/:id', optionalToken, customerController.deleteAddress);
router.post('/change-password', optionalToken, customerController.changePassword);

module.exports = router;
