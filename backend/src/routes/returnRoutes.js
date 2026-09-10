const express = require('express');
const router = express.Router();
const returnController = require('../controllers/returnController');
const { optionalToken } = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/adminMiddleware');

// Customer Endpoints
router.post('/', optionalToken, returnController.createReturnRequest);
router.get('/my-requests', optionalToken, returnController.getCustomerReturnRequests);

// Admin Endpoints
router.get('/admin/list', optionalToken, requireAdmin, returnController.getAdminReturnRequests);
router.put('/admin/:id/status', optionalToken, requireAdmin, returnController.updateReturnStatus);
router.post('/admin/:id/status', optionalToken, requireAdmin, returnController.updateReturnStatus);

module.exports = router;
