const express = require('express');
const router = express.Router();
const controller = require('../controllers/rightSidebarPromoCardController');

router.get('/', controller.getPromoCard);
router.put('/', controller.updatePromoCard);

module.exports = router;
