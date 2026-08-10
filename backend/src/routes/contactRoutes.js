const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contactController');
const { optionalToken } = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/adminMiddleware');

router.post('/', contactController.submitContact);
router.get('/', optionalToken, requireAdmin, contactController.getContactMessages);

module.exports = router;
