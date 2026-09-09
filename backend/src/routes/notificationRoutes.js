const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { authenticateToken } = require('../middleware/authMiddleware');

// Customer routes
router.get('/', authenticateToken, notificationController.getNotifications);

// Support both PATCH and PUT for marking read & mark all read
router.patch('/read-all', authenticateToken, notificationController.markAllAsRead);
router.put('/read-all', authenticateToken, notificationController.markAllAsRead);

router.patch('/:id/read', authenticateToken, notificationController.markAsRead);
router.put('/:id/read', authenticateToken, notificationController.markAsRead);

// Admin promotional broadcast routes
router.get('/admin/broadcasts', notificationController.getAdminBroadcasts);
router.post('/admin/broadcast', notificationController.createAdminBroadcast);
router.put('/admin/broadcasts/:id/toggle', notificationController.toggleAdminBroadcast);

module.exports = router;
