const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contactController');
const { optionalToken } = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/adminMiddleware');

router.post('/', contactController.submitContact);
router.get('/', optionalToken, requireAdmin, contactController.getContactMessages);
router.get('/messages', optionalToken, requireAdmin, contactController.getContactMessages);
router.put('/messages/:id/status', optionalToken, requireAdmin, contactController.updateMessageStatus);
router.post('/messages/:id/status', optionalToken, requireAdmin, contactController.updateMessageStatus);
router.delete('/messages/:id', optionalToken, requireAdmin, contactController.deleteMessage);
router.post('/messages/:id/delete', optionalToken, requireAdmin, contactController.deleteMessage);

module.exports = router;
