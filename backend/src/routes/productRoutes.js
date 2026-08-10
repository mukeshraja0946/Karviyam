const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { optionalToken } = require('../middleware/authMiddleware');

router.get('/', optionalToken, productController.getProducts);
router.get('/featured', productController.getFeaturedProducts);
router.get('/search', productController.searchProducts);
router.get('/:id', optionalToken, productController.getProductById);
router.post('/bulk-import', productController.bulkImportProducts);

module.exports = router;
