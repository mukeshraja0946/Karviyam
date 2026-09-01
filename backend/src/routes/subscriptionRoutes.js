const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscriptionController');

// Public Storefront Routes
router.get('/settings', subscriptionController.getPublicSettings);
router.post('/subscribe', subscriptionController.initiateSubscription);
router.get('/detail/:id', subscriptionController.getSubscriptionById);
router.post('/create-payment', subscriptionController.createSubscriptionPayment);
router.post('/verify-payment', subscriptionController.verifySubscriptionPayment);

// Admin Control Center Routes
router.get('/admin/subscribers', subscriptionController.getAdminSubscribers);
router.put('/admin/settings', subscriptionController.updateAdminSettings);
router.delete('/admin/subscribers/:id', subscriptionController.deleteSubscriber);

module.exports = router;
