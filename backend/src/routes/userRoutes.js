const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateToken } = require('../middleware/authMiddleware');

router.get('/profile', authenticateToken, userController.getProfile);
router.put('/profile', authenticateToken, userController.updateProfile);
router.get('/addresses', authenticateToken, userController.getAddresses);
router.post('/addresses', authenticateToken, userController.addAddress);
router.delete('/addresses/:id', authenticateToken, userController.deleteAddress);

module.exports = router;
