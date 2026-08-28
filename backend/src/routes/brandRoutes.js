const express = require('express');
const router = express.Router();
const brandController = require('../controllers/brandController');
const { optionalToken } = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/adminMiddleware');

router.get('/', brandController.getAllBrands);
router.get('/:id', brandController.getBrandById);
router.post('/', optionalToken, requireAdmin, brandController.createBrand);
router.put('/:id', optionalToken, requireAdmin, brandController.updateBrand);
router.delete('/all', optionalToken, requireAdmin, brandController.deleteAllBrands);
router.post('/delete-all', optionalToken, requireAdmin, brandController.deleteAllBrands);
router.delete('/:id', optionalToken, requireAdmin, brandController.deleteBrand);

module.exports = router;
