const express = require('express');
const router = express.Router();
const wishlistController = require('../controllers/wishlistController');
const { authenticateToken } = require('../middleware/authMiddleware');

router.get('/', authenticateToken, wishlistController.getWishlist);
router.post('/add/:productId', authenticateToken, wishlistController.addToWishlist);
router.post('/toggle/:productId', authenticateToken, wishlistController.toggleWishlist);
router.delete('/remove/:productId', authenticateToken, wishlistController.removeFromWishlist);
router.delete('/:productId', authenticateToken, wishlistController.removeFromWishlist);

module.exports = router;
