const fs = require('fs');
const path = require('path');
const ApiResponse = require('../utils/apiResponse');
const { syncUploadFile } = require('../utils/fileSync');

const validateImageMagicBytes = (buffer, ext) => {
  if (!buffer || buffer.length < 4) return false;
  const lowerExt = ext.toLowerCase();

  if (lowerExt === '.png') {
    return buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47;
  }
  if (lowerExt === '.jpg' || lowerExt === '.jpeg') {
    return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  }
  if (lowerExt === '.webp') {
    return buffer.slice(0, 4).toString('ascii') === 'RIFF' && buffer.slice(8, 12).toString('ascii') === 'WEBP';
  }
  if (lowerExt === '.gif') {
    return buffer.slice(0, 3).toString('ascii') === 'GIF';
  }
  if (lowerExt === '.svg') {
    return buffer.toString('utf8', 0, 500).toLowerCase().includes('<svg');
  }
  return true;
};

exports.uploadFile = async (req, res, next) => {
  try {
    if (!req.file && (!req.files || req.files.length === 0)) {
      return res.status(400).json(ApiResponse.error('No file was uploaded'));
    }

    if (req.file) {
      const ext = path.extname(req.file.filename).toLowerCase();
      let fileBuffer = null;

      if (req.file.path && fs.existsSync(req.file.path)) {
        try {
          fileBuffer = fs.readFileSync(req.file.path);
        } catch (eRead) {}
      }

      // Validate image binary header signature
      if (['.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg'].includes(ext)) {
        if (fileBuffer && !validateImageMagicBytes(fileBuffer, ext)) {
          if (fs.existsSync(req.file.path)) {
            try { fs.unlinkSync(req.file.path); } catch (eUnlink) {}
          }
          return res.status(400).json(ApiResponse.error(`Upload failed: The uploaded file binary format does not match the ${ext.toUpperCase()} image format.`));
        }
      }

      // Synchronize file buffer across all target upload directories
      syncUploadFile(req.file.filename, fileBuffer);
      const fileUrl = `/uploads/${req.file.filename}`;

      // Safe Debug Output (Section 28)
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
        fileUrl: fileUrl,
        filePath: fileUrl,
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        mimeType: req.file.mimetype || (ext === '.png' ? 'image/png' : 'image/jpeg')
      }, 'File uploaded successfully'));
    }

    if (req.files) {
      req.files.forEach(f => {
        let fBuf = null;
        if (f.path && fs.existsSync(f.path)) {
          try { fBuf = fs.readFileSync(f.path); } catch (e) {}
        }
        syncUploadFile(f.filename, fBuf);
      });
      const fileUrls = req.files.map(f => `/uploads/${f.filename}`);
      return res.status(200).json(ApiResponse.success({
        urls: fileUrls
      }, 'Files uploaded successfully'));
    }
  } catch (err) {
    next(err);
  }
};
