const fs = require('fs');
const path = require('path');

/**
 * Synchronizes an uploaded or decoded file across all static upload directories
 * to guarantee accessibility under Apache/LiteSpeed, Node.js, and static dist paths.
 */
const getTargetUploadDirs = () => {
  const rootDir = process.cwd();
  return Array.from(new Set([
    path.resolve(__dirname, '../../uploads'),                 // root/uploads
    path.resolve(__dirname, '../uploads'),                    // backend/uploads
    path.resolve(__dirname, '../../frontend/dist/uploads'),    // frontend/dist/uploads
    path.resolve(__dirname, '../../dist/uploads'),            // dist/uploads
    path.resolve(__dirname, '../../public/uploads'),          // public/uploads
    path.resolve(rootDir, 'uploads'),
    path.resolve(rootDir, 'backend/uploads'),
    path.resolve(rootDir, 'dist/uploads'),
    path.resolve(rootDir, 'public/uploads')
  ]));
};

const syncUploadFile = (filename, sourceBuffer = null) => {
  if (!filename) return;

  const dirs = getTargetUploadDirs();
  let bufferToSave = sourceBuffer;

  if (!bufferToSave) {
    for (const d of dirs) {
      const p = path.join(d, filename);
      if (fs.existsSync(p)) {
        try {
          bufferToSave = fs.readFileSync(p);
          if (bufferToSave && bufferToSave.length > 0) break;
        } catch (e) {}
      }
    }
  }

  if (!bufferToSave || bufferToSave.length === 0) return;

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

const syncAllExistingUploads = () => {
  try {
    const dirs = getTargetUploadDirs();
    for (const d of dirs) {
      if (fs.existsSync(d)) {
        const files = fs.readdirSync(d);
        for (const f of files) {
          const fp = path.join(d, f);
          try {
            if (fs.statSync(fp).isFile()) {
              syncUploadFile(f);
            }
          } catch (e) {}
        }
      }
    }
  } catch (e) {}
};

module.exports = { syncUploadFile, syncAllExistingUploads };
