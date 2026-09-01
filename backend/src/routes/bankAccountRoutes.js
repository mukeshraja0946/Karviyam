const express = require('express');
const router = express.Router();
const bankAccountController = require('../controllers/bankAccountController');

// Public Storefront Endpoints
router.get('/public', bankAccountController.getPublicBankAccount);

// Admin & General Endpoints (Supports both GET and PUT/POST on /, /admin, /settings)
router.get('/', bankAccountController.getAdminBankAccount);
router.get('/admin', bankAccountController.getAdminBankAccount);
router.get('/settings', bankAccountController.getAdminBankAccount);

router.put('/', bankAccountController.updateAdminBankAccount);
router.post('/', bankAccountController.updateAdminBankAccount);

router.put('/admin', bankAccountController.updateAdminBankAccount);
router.post('/admin', bankAccountController.updateAdminBankAccount);

router.put('/settings', bankAccountController.updateAdminBankAccount);
router.post('/settings', bankAccountController.updateAdminBankAccount);

module.exports = router;
