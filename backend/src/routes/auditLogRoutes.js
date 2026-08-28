const express = require('express');
const router = express.Router();
const auditLogController = require('../controllers/auditLogController');
const { optionalToken } = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/adminMiddleware');

router.get('/', optionalToken, requireAdmin, auditLogController.getAuditLogs);
router.delete('/all', optionalToken, requireAdmin, auditLogController.deleteAllAuditLogs);
router.post('/delete-all', optionalToken, requireAdmin, auditLogController.deleteAllAuditLogs);

module.exports = router;
