const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { optionalToken } = require('../middleware/authMiddleware');

router.post('/', optionalToken, reviewController.submitReview);
router.get('/product/:productId', reviewController.getProductReviews);

module.exports = router;
