const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');

// 1. Create UPI Payment Request
router.post('/create-upi-request', paymentController.createUpiPaymentRequest);
router.post('/upi/create-request', paymentController.createUpiPaymentRequest);

// 2. Get Payment Status (Polling & Verification)
router.get('/status', paymentController.getPaymentStatus);
router.get('/:paymentId/status', paymentController.getPaymentStatus);

// 3. Payment Gateway Webhook Handlers
router.post('/webhook', paymentController.handlePaymentWebhook);
router.post('/razorpay/webhook', paymentController.handlePaymentWebhook);

// 4. Sandbox Server Verification
router.post('/verify-sandbox', paymentController.verifyPaymentSandbox);
router.post('/verify-status', paymentController.verifyPaymentSandbox);

// Legacy Compatibility Endpoints
router.post('/razorpay/create-order', paymentController.createUpiPaymentRequest);
router.post('/razorpay/verify', paymentController.getPaymentStatus);
router.post('/stripe/create-intent', paymentController.createUpiPaymentRequest);

module.exports = router;
