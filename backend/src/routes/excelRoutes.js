const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
const excelController = require('../controllers/excelImportExportController');
const { optionalToken } = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/adminMiddleware');

// Product Excel Endpoints
router.get('/products/export', optionalToken, requireAdmin, excelController.exportProducts);
router.get('/products/template', optionalToken, requireAdmin, excelController.downloadProductTemplate);
router.post('/products/preview', optionalToken, requireAdmin, upload.single('file'), excelController.previewProductImport);
router.post('/products/import', optionalToken, requireAdmin, upload.single('file'), excelController.executeProductImport);
router.post('/error-report', optionalToken, requireAdmin, excelController.downloadErrorReport);

// Category Excel Endpoints
router.get('/categories/export', optionalToken, requireAdmin, excelController.exportCategories);
router.post('/categories/import', optionalToken, requireAdmin, upload.single('file'), excelController.importCategories);

// Parent Category Excel Endpoints
router.get('/parent-categories/export', optionalToken, requireAdmin, excelController.exportParentCategories);
router.post('/parent-categories/import', optionalToken, requireAdmin, upload.single('file'), excelController.importParentCategories);

// Banner Excel Endpoints
router.get('/banners/export', optionalToken, requireAdmin, excelController.exportBanners);
router.post('/banners/import', optionalToken, requireAdmin, upload.single('file'), excelController.importBanners);

// Brand Excel Endpoints
router.get('/brands/export', optionalToken, requireAdmin, excelController.exportBrands);
router.post('/brands/import', optionalToken, requireAdmin, upload.single('file'), excelController.importBrands);

// Promo Cards Excel Endpoints
router.get('/promo-cards/export', optionalToken, requireAdmin, excelController.exportPromoCards);
router.post('/promo-cards/import', optionalToken, requireAdmin, upload.single('file'), excelController.importPromoCards);

// Settings & Branding Excel Endpoints
router.get('/settings/export', optionalToken, requireAdmin, excelController.exportSettings);
router.post('/settings/import', optionalToken, requireAdmin, upload.single('file'), excelController.importSettings);

// Coupon Excel Endpoints
router.get('/coupons/export', optionalToken, requireAdmin, excelController.exportCoupons);
router.post('/coupons/import', optionalToken, requireAdmin, upload.single('file'), excelController.importCoupons);

// Customer & Order Excel Endpoints
router.get('/customers/export', optionalToken, requireAdmin, excelController.exportCustomers);
router.get('/orders/export', optionalToken, requireAdmin, excelController.exportOrders);

module.exports = router;
