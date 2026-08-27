const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { optionalToken } = require('../middleware/authMiddleware');

// Public endpoints
router.get('/product/:productId', optionalToken, reviewController.getProductReviews);

// Customer actions
router.post('/', optionalToken, reviewController.submitReview);
router.post('/:id/helpful', optionalToken, reviewController.voteHelpful);
router.post('/:id/report', reviewController.reportReview);

// Admin endpoints
router.get('/admin', reviewController.getAdminReviews);
router.put('/admin/:id/status', reviewController.updateReviewStatus);
router.delete('/admin/:id', reviewController.deleteReview);

module.exports = router;
