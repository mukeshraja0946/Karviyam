const fs = require('fs');
const path = require('path');
const ApiResponse = require('../utils/apiResponse');
const { syncUploadFile } = require('../utils/fileSync');

exports.uploadFile = async (req, res, next) => {
  try {
    if (!req.file && (!req.files || req.files.length === 0)) {
      return res.status(400).json(ApiResponse.error('No file was uploaded'));
    }

    if (req.file) {
      syncUploadFile(req.file.filename);
      const fileUrl = `/uploads/${req.file.filename}`;
      const ext = path.extname(req.file.filename).toLowerCase();

      // Required Debug Log Output (Section 28)
      console.log('[DEVELOPER LOGO UPLOAD]', {
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        extension: ext,
        size: req.file.size,
        savedFile: req.file.filename,
        publicUrl: fileUrl
      });

      // Verify physical file existence in root upload folder
      const rootUploadDir = path.resolve(__dirname, '../../../uploads');
      const targetPath = path.join(rootUploadDir, req.file.filename);

      if (!fs.existsSync(targetPath) || fs.statSync(targetPath).size === 0) {
        console.error('[DEVELOPER LOGO HTTP CHECK FAILED]: Physical file missing or 0 bytes at', targetPath);
        return res.status(500).json(ApiResponse.error('Upload failed: File was not persisted correctly on server storage.'));
      }

      console.log('[DEVELOPER LOGO HTTP CHECK]', {
        url: fileUrl,
        status: 200,
        contentType: req.file.mimetype || (ext === '.png' ? 'image/png' : 'image/jpeg')
      });

      return res.status(200).json(ApiResponse.success({
        url: fileUrl,
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        mimeType: req.file.mimetype
      }, 'File uploaded successfully'));
    }

    if (req.files) {
      req.files.forEach(f => syncUploadFile(f.filename));
      const fileUrls = req.files.map(f => `/uploads/${f.filename}`);
      return res.status(200).json(ApiResponse.success({
        urls: fileUrls
      }, 'Files uploaded successfully'));
    }
  } catch (err) {
    next(err);
  }
};
