const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const sourceImagePath = 'C:/Users/smuke/.gemini/antigravity-ide/brain/8a392bb6-64ec-4636-9160-4f95011f8498/media__1787030100936.png';

if (!fs.existsSync(sourceImagePath)) {
  console.error('Source image missing at:', sourceImagePath);
  process.exit(1);
}

const publicDir = path.join(__dirname, '..', 'frontend', 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Copy original high res logo as brand_logo.png
fs.copyFileSync(sourceImagePath, path.join(publicDir, 'brand_logo.png'));
fs.copyFileSync(sourceImagePath, path.join(publicDir, 'favicon.png'));

const targets = [
  { name: 'favicon-16x16.png', size: 16 },
  { name: 'favicon-32x32.png', size: 32 },
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'favicon-192x192.png', size: 192 },
  { name: 'favicon-512x512.png', size: 512 },
  { name: 'favicon.ico', size: 32 }
];

async function convert() {
  for (const item of targets) {
    const outPath = path.join(publicDir, item.name);
    await sharp(sourceImagePath)
      .resize(item.size, item.size, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .png()
      .toFile(outPath);
    console.log(`Converted ${item.name} (${item.size}x${item.size})`);
  }
}

convert().then(() => {
  console.log('Successfully converted uploaded logo image into all favicons!');
}).catch(err => {
  console.error('Conversion error:', err);
  process.exit(1);
});
