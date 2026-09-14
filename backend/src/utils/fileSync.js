const fs = require('fs');
const path = require('path');

/**
 * Synchronizes an uploaded or decoded file across all static upload directories
 * to guarantee accessibility under Apache/LiteSpeed, Node.js, and static dist paths.
 */
const syncUploadFile = (filename, sourceBuffer = null) => {
  if (!filename) return;

  const rootDir = process.cwd();
  const dirs = [
    path.resolve(rootDir, 'uploads'),
    path.resolve(rootDir, 'backend/uploads'),
    path.resolve(rootDir, 'dist/uploads'),
    path.resolve(rootDir, 'public/uploads'),
    path.resolve(rootDir, 'backend/public/uploads'),
    path.resolve(__dirname, '../../uploads'),
    path.resolve(__dirname, '../uploads'),
    path.resolve(__dirname, '../../../uploads')
  ];

  let bufferToSave = sourceBuffer;

  if (!bufferToSave) {
    for (const d of dirs) {
      const p = path.join(d, filename);
      if (fs.existsSync(p)) {
        try {
          bufferToSave = fs.readFileSync(p);
          break;
        } catch (e) {}
      }
    }
  }

  if (!bufferToSave) return;

  for (const d of dirs) {
    try {
      if (!fs.existsSync(d)) {
        fs.mkdirSync(d, { recursive: true });
      }
      const targetPath = path.join(d, filename);
      fs.writeFileSync(targetPath, bufferToSave);
    } catch (e) {}
  }
};

module.exports = { syncUploadFile };
