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
  path.join(rootDir, 'backend', 'dist'),
  path.join(rootDir, 'backend', 'public'),
  path.join(rootDir, 'public')
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

// Copy .htaccess to root and target directories
const distHtaccess = path.join(frontendDist, '.htaccess');
const rootHtaccess = path.join(rootDir, '.htaccess');
if (fs.existsSync(distHtaccess)) {
  fs.copyFileSync(distHtaccess, rootHtaccess);
  console.log(`✅ Copied frontend .htaccess to root: ${rootHtaccess}`);
}

// Copy uploads directory to root and all target locations if present
const uploadSources = [
  path.join(rootDir, 'uploads'),
  path.join(rootDir, 'backend', 'uploads')
];

const uploadTargets = [
  path.join(rootDir, 'uploads'),
  path.join(rootDir, 'dist', 'uploads'),
  path.join(rootDir, 'backend', 'dist', 'uploads'),
  path.join(rootDir, 'backend', 'public', 'uploads'),
  path.join(rootDir, 'public', 'uploads')
];

for (const src of uploadSources) {
  if (fs.existsSync(src)) {
    for (const tgt of uploadTargets) {
      try {
        fs.mkdirSync(tgt, { recursive: true });
        fs.cpSync(src, tgt, { recursive: true, force: true });
        console.log(`✅ Synchronized uploads from ${src} to ${tgt}`);
      } catch (err) {}
    }
  }
}

console.log('✨ Karviyam post-build step completed successfully!');
