const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const productController = require('../controllers/productController');
const categoryController = require('../controllers/categoryController');
const pincodeController = require('../controllers/pincodeController');
const settingController = require('../controllers/settingController');
const contactController = require('../controllers/contactController');
const orderController = require('../controllers/orderController');
const { optionalToken } = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/adminMiddleware');

// All admin routes use auth guard
router.use(optionalToken, requireAdmin);

// Dashboard
router.get('/dashboard/stats', adminController.getDashboardStats);

// Orders
router.get('/orders', adminController.getAllOrders);
router.put('/orders/:id/status', adminController.updateOrderStatus);
router.post('/orders/:id/status', adminController.updateOrderStatus);
router.put('/orders/:id', orderController.updateOrder);
router.post('/orders/:id', orderController.updateOrder);
router.post('/orders/:id/update', orderController.updateOrder);
router.delete('/orders/all', adminController.deleteAllOrders);
router.post('/orders/delete-all', adminController.deleteAllOrders);
router.delete('/orders/:id', orderController.deleteOrder);
router.post('/orders/:id/delete', orderController.deleteOrder);

// Categories
router.delete('/categories/all', categoryController.deleteAllCategories);
router.post('/categories/delete-all', categoryController.deleteAllCategories);

// Products
router.get('/products', adminController.getAdminProducts);
router.post('/products', adminController.createProduct);
router.post('/products/bulk-import', productController.bulkImportProducts);
router.put('/products/:id', adminController.updateProduct);
router.post('/products/:id', adminController.updateProduct);
router.delete('/products/all', productController.deleteAllProducts);
router.post('/products/delete-all', productController.deleteAllProducts);
router.post('/products/delete-batch', productController.deleteSelectedProducts);
router.delete('/products/delete-batch', productController.deleteSelectedProducts);
router.delete('/products/:id', adminController.deleteProduct);
router.delete('/inventory/all', adminController.deleteAllInventory);
router.post('/inventory/delete-all', adminController.deleteAllInventory);

// Coupons
router.get('/coupons', adminController.getCoupons);
router.post('/coupons', adminController.createCoupon);
router.put('/coupons/:id', adminController.updateCoupon);
router.post('/coupons/:id', adminController.updateCoupon);
router.post('/coupons/:id/update', adminController.updateCoupon);
router.delete('/coupons/all', adminController.deleteAllCoupons);
router.post('/coupons/delete-all', adminController.deleteAllCoupons);
router.delete('/coupons/:id', adminController.deleteCoupon);
router.post('/coupons/:id/delete', adminController.deleteCoupon);

// Reviews
router.get('/reviews', adminController.getReviews);
router.put('/reviews/:id/status', adminController.updateReviewStatus);
router.delete('/reviews/all', adminController.deleteAllReviews);
router.post('/reviews/delete-all', adminController.deleteAllReviews);

const userController = require('../controllers/userController');

// Users & Customers
router.get('/users', adminController.getUsers);
router.get('/customers', adminController.getCustomers);
router.put('/customers/:id', adminController.updateCustomer);
router.post('/customers/:id', adminController.updateCustomer);
router.post('/customers/:id/update', adminController.updateCustomer);
router.delete('/customers/all', adminController.deleteAllCustomers);
router.post('/customers/delete-all', adminController.deleteAllCustomers);
router.delete('/customers/:id', adminController.deleteCustomer);
router.post('/customers/:id/delete', adminController.deleteCustomer);
router.put('/users/:id/role', userController.updateUserRole);
router.post('/users/:id/role', userController.updateUserRole);
router.delete('/users/:id', userController.deleteUser);
router.post('/users/:id/delete', userController.deleteUser);
router.post('/users/:id', userController.deleteUser);

// Pincodes
router.get('/pincodes', pincodeController.getAllPincodes);
router.post('/pincodes', pincodeController.createPincode);
router.put('/pincodes/:id', pincodeController.updatePincode);
router.delete('/pincodes/all', pincodeController.deleteAllPincodes);
router.post('/pincodes/delete-all', pincodeController.deleteAllPincodes);
router.delete('/pincodes/:id', pincodeController.deletePincode);
router.put('/pincodes/:id/toggle-status', pincodeController.togglePincodeStatus);
router.post('/pincodes/bulk-import', pincodeController.bulkImportPincodes);

// Admin Help & Contact Messages
router.get('/contact-messages', contactController.getContactMessages);
router.get('/contact-messages/:id', contactController.getConversationById);
router.post('/contact-messages/:id/reply', contactController.replyToConversation);
router.put('/contact-messages/:id/reply', contactController.replyToConversation);
router.put('/contact-messages/:id/status', contactController.updateMessageStatus);
router.post('/contact-messages/:id/status', contactController.updateMessageStatus);
router.delete('/contact-messages/:id', contactController.deleteMessage);
router.post('/contact-messages/:id/delete', contactController.deleteMessage);

router.post('/help', contactController.submitAdminHelp);
router.get('/company-settings', settingController.getCompanySettings);
router.post('/company-settings', settingController.updateCompanySettings);
router.put('/company-settings', settingController.updateCompanySettings);
router.get('/settings', settingController.getSettings);
router.post('/settings', settingController.updateSettings);
router.put('/settings', settingController.updateSettings);

module.exports = router;
