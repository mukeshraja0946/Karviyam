const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { optionalToken } = require('../middleware/authMiddleware');

const adminController = require('../controllers/adminController');
const { requireAdmin } = require('../middleware/adminMiddleware');

router.get('/', optionalToken, productController.getProducts);
router.get('/featured', productController.getFeaturedProducts);
router.get('/search', productController.searchProducts);
router.get('/:id', optionalToken, productController.getProductById);
router.post('/bulk-import', optionalToken, requireAdmin, productController.bulkImportProducts);

router.post('/', optionalToken, requireAdmin, adminController.createProduct);
router.put('/:id', optionalToken, requireAdmin, adminController.updateProduct);
router.post('/:id', optionalToken, requireAdmin, adminController.updateProduct);
router.delete('/:id', optionalToken, requireAdmin, adminController.deleteProduct);

module.exports = router;
