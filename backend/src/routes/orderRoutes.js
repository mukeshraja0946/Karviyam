const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { optionalToken, authenticateToken } = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/adminMiddleware');

router.post('/checkout', optionalToken, orderController.checkout);
router.post('/', optionalToken, orderController.checkout);
router.get('/my-orders', authenticateToken, orderController.getMyOrders);
router.get('/:id', optionalToken, orderController.getOrderById);
router.put('/:id/cancel', optionalToken, orderController.cancelOrder);
router.get('/:id/invoice', orderController.getInvoice);

router.put('/:id', optionalToken, requireAdmin, orderController.updateOrder);
router.delete('/:id', optionalToken, requireAdmin, orderController.deleteOrder);

module.exports = router;
