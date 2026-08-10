const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/uploadController');
const upload = require('../middleware/uploadMiddleware');

router.post('/', upload.single('file'), uploadController.uploadFile);
router.post('/multiple', upload.array('files', 10), uploadController.uploadFile);

module.exports = router;
