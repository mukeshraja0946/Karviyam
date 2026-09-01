const express = require('express');
const router = express.Router();
const recommendationController = require('../controllers/recommendationController');
const { optionalToken } = require('../middleware/authMiddleware');

router.get('/recommendations', optionalToken, recommendationController.getPersonalizedRecommendations);
router.get('/trending', optionalToken, recommendationController.getTrendingProducts);
router.get('/most-loved', optionalToken, recommendationController.getMostLovedProducts);
router.get('/starting-price', optionalToken, recommendationController.getStartingPriceProducts);

module.exports = router;
