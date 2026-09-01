const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { optionalToken } = require('../middleware/authMiddleware');

router.post('/event', optionalToken, analyticsController.trackEvent);

module.exports = router;
