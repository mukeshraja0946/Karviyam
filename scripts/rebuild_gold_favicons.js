const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// Locate uploaded gold emblem image
const sourceImagePaths = [
  path.join(__dirname, '..', 'frontend', 'public', 'BRAND MARK-GOLD.png'),
  path.join(__dirname, '..', 'frontend', 'public', 'brand_logo.png'),
  'C:/Users/smuke/.gemini/antigravity-ide/brain/8a392bb6-64ec-4636-9160-4f95011f8498/media__1787030100936.png'
];

let sourcePath = null;
for (const p of sourceImagePaths) {
  if (fs.existsSync(p)) {
    sourcePath = p;
    break;
  }
}

if (!sourcePath) {
  console.error('Source gold emblem image missing!');
  process.exit(1);
}

console.log('Using source image:', sourcePath);

const publicDir = path.join(__dirname, '..', 'frontend', 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Copy source as brand-mark-gold.png (URL safe without spaces)
fs.copyFileSync(sourcePath, path.join(publicDir, 'brand-mark-gold.png'));
fs.copyFileSync(sourcePath, path.join(publicDir, 'BRAND MARK-GOLD.png'));
fs.copyFileSync(sourcePath, path.join(publicDir, 'favicon.png'));

const targets = [
  { name: 'favicon-16x16.png', size: 16 },
  { name: 'favicon-32x32.png', size: 32 },
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'favicon-192x192.png', size: 192 },
  { name: 'favicon-512x512.png', size: 512 },
  { name: 'favicon.ico', size: 32 }
];

async function generateAll() {
  for (const item of targets) {
    const outPath = path.join(publicDir, item.name);
    await sharp(sourcePath)
      .resize(item.size, item.size, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .png()
      .toFile(outPath);
    console.log(`Generated ${item.name} (${item.size}x${item.size})`);
  }
}

generateAll().then(() => {
  console.log('Successfully regenerated all favicons from Gold emblem!');
}).catch(err => {
  console.error('Error generating favicons:', err);
  process.exit(1);
});
