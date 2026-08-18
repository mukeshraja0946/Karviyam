const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512" fill="none">
  <defs>
    <linearGradient id="karviyamGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#D32F2F" />
      <stop offset="100%" stop-color="#B71C1C" />
    </linearGradient>
  </defs>
  <path fill="url(#karviyamGrad)" d="M256 42.667L85.333 106.667v128c0 118.4 81.92 229.12 192 256 110.08-26.88 192-137.6 192-256v-128L256 42.667zm0 85.333c35.345 0 64 28.655 64 64s-28.655 64-64 64-64-28.655-64-64 28.655-64 64-64zm-85.333 202.667c0-42.667 85.333-66.133 85.333-66.133s85.333 23.466 85.333 66.133v10.667h-170.666v-10.667z"/>
</svg>`;

const publicDir = path.join(__dirname, '..', 'frontend', 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

const svgPath = path.join(publicDir, 'favicon.svg');
fs.writeFileSync(svgPath, svgContent);
console.log('Saved favicon.svg');

// Generate PNGs using sharp via npx
const sizes = [
  { name: 'favicon-16x16.png', size: 16 },
  { name: 'favicon-32x32.png', size: 32 },
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'favicon-192x192.png', size: 192 },
  { name: 'favicon-512x512.png', size: 512 },
  { name: 'favicon.ico', size: 32 }
];

async function generate() {
  const sharp = require('sharp');
  for (const item of sizes) {
    const outPath = path.join(publicDir, item.name);
    await sharp(Buffer.from(svgContent))
      .resize(item.size, item.size)
      .toFile(outPath);
    console.log(`Generated ${item.name}`);
  }
}

generate().catch(err => {
  console.error('Error generating favicons:', err);
  process.exit(1);
});
