const express = require('express');
const router = express.Router();
const bankAccountController = require('../controllers/bankAccountController');

// Public Endpoint (For Checkout Screens)
router.get('/public', bankAccountController.getPublicBankAccount);

// Admin Management Endpoints
router.get('/admin', bankAccountController.getAdminBankAccount);
router.put('/admin', bankAccountController.updateAdminBankAccount);

module.exports = router;
