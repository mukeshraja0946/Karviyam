const multer = require('multer');
const path = require('path');
const fs = require('fs');

const rootUploadDir = path.resolve(__dirname, '../../../uploads');
const backendUploadDir = path.resolve(__dirname, '../../uploads');
const distUploadDir = path.resolve(__dirname, '../../../frontend/dist/uploads');

[rootUploadDir, backendUploadDir, distUploadDir].forEach(d => {
  if (!fs.existsSync(d)) {
    try { fs.mkdirSync(d, { recursive: true }); } catch (e) {}
  }
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, rootUploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    let ext = path.extname(file.originalname).toLowerCase();
    if (!ext) {
      if (file.mimetype === 'image/png' || file.mimetype === 'image/x-png') ext = '.png';
      else if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/jpg') ext = '.jpg';
      else if (file.mimetype === 'image/webp') ext = '.webp';
      else if (file.mimetype === 'image/gif') ext = '.gif';
      else if (file.mimetype === 'image/svg+xml') ext = '.svg';
    }
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedExtensions = [
    '.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg',
    '.xlsx', '.xls', '.csv', '.pdf',
    '.mp4', '.webm', '.mov', '.ogg', '.m4v', '.avi'
  ];
  const allowedMimeTypes = [
    'image/png', 'image/x-png', 'image/jpeg', 'image/jpg', 'image/pjpeg', 'image/gif', 'image/webp', 'image/svg+xml',
    'application/pdf', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/csv'
  ];
  const ext = path.extname(file.originalname).toLowerCase();
  const mime = (file.mimetype || '').toLowerCase();

  if (allowedExtensions.includes(ext) || allowedMimeTypes.includes(mime) || mime.startsWith('image/') || mime.startsWith('video/')) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Allowed: Images (PNG, JPG, WEBP, SVG, GIF), Videos (MP4, WEBM, MOV), PDFs, Spreadsheets.'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB max for video & image uploads
  fileFilter: fileFilter
});

module.exports = upload;
