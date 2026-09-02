const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/authMiddleware');

router.post('/check-account', authController.checkAccount);
router.post('/login', authController.login);
router.post('/send-admin-otp', authController.sendAdminOTP);
router.post('/verify-admin-otp', authController.verifyAdminOTP);
router.post('/google', authController.googleAuth);
router.post('/register', authController.register);
router.get('/me', authenticateToken, authController.getCurrentUser);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

module.exports = router;
