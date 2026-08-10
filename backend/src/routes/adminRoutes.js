const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const productController = require('../controllers/productController');
const categoryController = require('../controllers/categoryController');
const pincodeController = require('../controllers/pincodeController');
const settingController = require('../controllers/settingController');
const { optionalToken } = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/adminMiddleware');

// All admin routes use auth guard
router.use(optionalToken, requireAdmin);

// Dashboard
router.get('/dashboard/stats', adminController.getDashboardStats);

// Orders
router.get('/orders', adminController.getAllOrders);
router.put('/orders/:id/status', adminController.updateOrderStatus);

// Products
router.get('/products', adminController.getAdminProducts);
router.post('/products', adminController.createProduct);
router.post('/products/bulk-import', productController.bulkImportProducts);
router.put('/products/:id', adminController.updateProduct);
router.delete('/products/:id', adminController.deleteProduct);

// Coupons
router.get('/coupons', adminController.getCoupons);
router.post('/coupons', adminController.createCoupon);
router.put('/coupons/:id', adminController.updateCoupon);
router.delete('/coupons/:id', adminController.deleteCoupon);

// Reviews
router.get('/reviews', adminController.getReviews);
router.put('/reviews/:id/status', adminController.updateReviewStatus);

const userController = require('../controllers/userController');

// Users & Customers
router.get('/users', adminController.getUsers);
router.get('/customers', adminController.getCustomers);
router.put('/customers/:id', adminController.updateCustomer);
router.delete('/customers/:id', adminController.deleteCustomer);
router.put('/users/:id/role', userController.updateUserRole);
router.delete('/users/:id', userController.deleteUser);

// Pincodes
router.get('/pincodes', pincodeController.getAllPincodes);
router.post('/pincodes', pincodeController.createPincode);
router.put('/pincodes/:id', pincodeController.updatePincode);
router.delete('/pincodes/:id', pincodeController.deletePincode);
router.put('/pincodes/:id/toggle-status', pincodeController.togglePincodeStatus);
router.post('/pincodes/bulk-import', pincodeController.bulkImportPincodes);

// Company settings & General settings
router.get('/company-settings', settingController.getCompanySettings);
router.post('/company-settings', settingController.updateCompanySettings);
router.put('/company-settings', settingController.updateCompanySettings);
router.get('/settings', settingController.getSettings);
router.post('/settings', settingController.updateSettings);
router.put('/settings', settingController.updateSettings);

module.exports = router;
