const express = require('express');
const router = express.Router();
const couponController = require('../controllers/couponController');

router.get('/validate', couponController.validateCoupon);
router.post('/validate', couponController.validateCoupon);

module.exports = router;
