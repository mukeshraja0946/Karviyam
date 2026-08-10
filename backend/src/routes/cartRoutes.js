const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const { authenticateToken } = require('../middleware/authMiddleware');

router.get('/', authenticateToken, cartController.getCart);
router.post('/add', authenticateToken, cartController.addToCart);

router.put('/update/:itemId', authenticateToken, cartController.updateQuantity);
router.put('/items/:itemId', authenticateToken, cartController.updateQuantity);

router.delete('/remove/:itemId', authenticateToken, cartController.removeItem);
router.delete('/items/:itemId', authenticateToken, cartController.removeItem);

router.delete('/clear', authenticateToken, cartController.clearCart);

module.exports = router;
