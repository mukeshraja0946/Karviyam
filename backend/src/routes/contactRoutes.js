const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contactController');
const { optionalToken } = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/adminMiddleware');

// Customer Submission
router.post('/', contactController.submitContact);

// Admin Messages & Thread Management
router.get('/', optionalToken, requireAdmin, contactController.getContactMessages);
router.get('/messages', optionalToken, requireAdmin, contactController.getContactMessages);
router.get('/messages/:id', optionalToken, requireAdmin, contactController.getConversationById);
router.post('/messages/:id/reply', optionalToken, requireAdmin, contactController.replyToConversation);
router.put('/messages/:id/reply', optionalToken, requireAdmin, contactController.replyToConversation);
router.put('/messages/:id/status', optionalToken, requireAdmin, contactController.updateMessageStatus);
router.post('/messages/:id/status', optionalToken, requireAdmin, contactController.updateMessageStatus);
router.delete('/messages/:id', optionalToken, requireAdmin, contactController.deleteMessage);
router.post('/messages/:id/delete', optionalToken, requireAdmin, contactController.deleteMessage);

module.exports = router;
