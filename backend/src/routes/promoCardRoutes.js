const express = require('express');
const router = express.Router();
const promoCardController = require('../controllers/promoCardController');

// Public customer endpoint
router.get('/', promoCardController.getPromoCards);

// Admin endpoints
router.get('/admin', promoCardController.getAllPromoCardsAdmin);
router.post('/', promoCardController.createPromoCard);
router.put('/reorder', promoCardController.reorderPromoCards);
router.put('/:id', promoCardController.updatePromoCard);
router.delete('/:id', promoCardController.deletePromoCard);

module.exports = router;
