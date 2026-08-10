const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { authenticateToken } = require('../middleware/authMiddleware');

router.post('/checkout', authenticateToken, orderController.checkout);
router.get('/my-orders', authenticateToken, orderController.getMyOrders);
router.get('/:id', authenticateToken, orderController.getOrderById);
router.put('/:id/cancel', authenticateToken, orderController.cancelOrder);
router.get('/:id/invoice', orderController.getInvoice);

module.exports = router;
