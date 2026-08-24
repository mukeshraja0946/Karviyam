const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const frontendDist = path.join(rootDir, 'frontend', 'dist');

console.log('🚀 Running Karviyam Post-Build Deployment Synchronizer...');
console.log(`Source dist directory: ${frontendDist}`);

if (!fs.existsSync(frontendDist)) {
  console.error('❌ Error: frontend/dist directory does not exist! Vite build failed or output missing.');
  process.exit(1);
}

const copyTargets = [
  path.join(rootDir, 'dist'),
  path.join(rootDir, 'backend', 'dist')
];

for (const target of copyTargets) {
  try {
    fs.mkdirSync(target, { recursive: true });
    fs.cpSync(frontendDist, target, { recursive: true, force: true });
    console.log(`✅ Successfully copied build artifacts to: ${target}`);
  } catch (err) {
    console.error(`⚠️ Warning copying to ${target}:`, err.message);
  }
}

// Copy index.html to root
const rootIndexHtml = path.join(rootDir, 'index.html');
const distIndexHtml = path.join(frontendDist, 'index.html');
if (fs.existsSync(distIndexHtml)) {
  fs.copyFileSync(distIndexHtml, rootIndexHtml);
  console.log(`✅ Copied frontend index.html to root: ${rootIndexHtml}`);
}

// Copy assets folder to root if present
const frontendAssets = path.join(frontendDist, 'assets');
const rootAssets = path.join(rootDir, 'assets');
if (fs.existsSync(frontendAssets)) {
  fs.mkdirSync(rootAssets, { recursive: true });
  fs.cpSync(frontendAssets, rootAssets, { recursive: true, force: true });
  console.log(`✅ Copied assets directory to root: ${rootAssets}`);
}

console.log('✨ Karviyam post-build step completed successfully!');
