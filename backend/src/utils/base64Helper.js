const fs = require('fs');
const path = require('path');

/**
 * Recursively decodes any base64 image strings found in a request payload,
 * writes them to the backend/uploads disk directory, and replaces the base64
 * data with its physical file path /uploads/base64-xxx.jpg.
 */
const processBase64Images = async (data) => {
  if (!data) return data;

  if (typeof data === 'string') {
    if (data.startsWith('data:image/')) {
      const matches = data.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
      if (matches) {
        let ext = matches[1].split('+')[0]; // handle svg+xml
        if (ext === 'jpeg') ext = 'jpg';
        if (ext === 'png') ext = 'png';
        if (ext === 'webp') ext = 'webp';
        if (ext === 'gif') ext = 'gif';
        if (ext === 'svg+xml' || ext === 'svg') ext = 'svg';

        const buffer = Buffer.from(matches[2], 'base64');
        const filename = `base64-${Date.now()}-${Math.round(Math.random() * 1e9)}.${ext}`;
        
        const uploadsDir = path.resolve(__dirname, '../../uploads');
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true });
        }

        const filePath = path.join(uploadsDir, filename);
        fs.writeFileSync(filePath, buffer);

        return `/uploads/${filename}`;
      }
    }
    return data;
  }

  if (Array.isArray(data)) {
    const arrResult = [];
    for (let i = 0; i < data.length; i++) {
      arrResult.push(await processBase64Images(data[i]));
    }
    return arrResult;
  }

  if (typeof data === 'object' && data !== null) {
    const objResult = {};
    for (const key of Object.keys(data)) {
      objResult[key] = await processBase64Images(data[key]);
    }
    return objResult;
  }

  return data;
};

module.exports = { processBase64Images };
