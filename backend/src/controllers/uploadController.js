const ApiResponse = require('../utils/apiResponse');

exports.uploadFile = async (req, res, next) => {
  try {
    if (!req.file && (!req.files || req.files.length === 0)) {
      return res.status(400).json(ApiResponse.error('No file was uploaded'));
    }

    if (req.file) {
      const fileUrl = `/uploads/${req.file.filename}`;
      return res.status(200).json(ApiResponse.success({
        url: fileUrl,
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size
      }, 'File uploaded successfully'));
    }

    if (req.files) {
      const fileUrls = req.files.map(f => `/uploads/${f.filename}`);
      return res.status(200).json(ApiResponse.success({
        urls: fileUrls
      }, 'Files uploaded successfully'));
    }
  } catch (err) {
    next(err);
  }
};
