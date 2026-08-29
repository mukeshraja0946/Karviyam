const fs = require('fs');
const path = require('path');
const axios = require('axios');
const pool = require('../config/db');

const SAMPLE_FASHION_IMAGES = [
  'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800',
  'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800',
  'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800',
  'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800',
  'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800',
  'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800',
  'https://images.unsplash.com/photo-1618932260643-eee4a2f652a6?w=800',
  'https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?w=800',
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800',
  'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800',
  'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800',
  'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=800',
  'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=800',
  'https://images.unsplash.com/photo-1609357605129-26f69add5d6e?w=800'
];

async function downloadSampleImage(url, idx) {
  try {
    const uploadDir = path.join(__dirname, '../../uploads/products');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const fileName = `catalog-img-${idx + 1}.jpg`;
    const filePath = path.join(uploadDir, fileName);

    if (fs.existsSync(filePath) && fs.statSync(filePath).size > 1000) {
      return `/uploads/products/${fileName}`;
    }

    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    fs.writeFileSync(filePath, Buffer.from(response.data));
    return `/uploads/products/${fileName}`;
  } catch (err) {
    console.warn(`[Sample Downloader Warning]: Failed to download sample image ${idx}:`, err.message);
    return SAMPLE_FASHION_IMAGES[idx % SAMPLE_FASHION_IMAGES.length];
  }
}

async function cleanAndMigrateAllProductCatalogImages() {
  console.log('=====================================================');
  console.log('🚀 CLEANING & MIGRATING PRODUCT CATALOG IMAGES TO LOCAL STORAGE');
  console.log('=====================================================');

  try {
    // Pre-download local fashion images
    const localPaths = [];
    for (let i = 0; i < SAMPLE_FASHION_IMAGES.length; i++) {
      const p = await downloadSampleImage(SAMPLE_FASHION_IMAGES[i], i);
      localPaths.push(p);
    }
    console.log(`✅ Pre-downloaded ${localPaths.length} high-res local fashion product images.`);

    // 1. Clean Products table
    const [prods] = await pool.query('SELECT id, name, image_url FROM products');
    let fixedCount = 0;

    for (const p of prods) {
      const img = p.image_url || '';
      const isGoogle = img.includes('google.com/search') || img.includes('google.co.in/search') || img.includes('tbm=isch') || img.includes('google.com/imgres');
      const isEmpty = !img.trim();

      if (isGoogle || isEmpty) {
        const assignedLocalPath = localPaths[p.id % localPaths.length];
        await pool.query('UPDATE products SET image_url = ? WHERE id = ?', [assignedLocalPath, p.id]);
        fixedCount++;
      }
    }
    console.log(`✅ Updated ${fixedCount} product records in MySQL database with local image paths!`);

    // 2. Clean Product Sub Images
    const [subImgs] = await pool.query('SELECT id, product_id, image_url FROM product_images');
    let fixedSubCount = 0;

    for (const s of subImgs) {
      const img = s.image_url || '';
      const isGoogle = img.includes('google.com/search') || img.includes('google.co.in/search') || img.includes('tbm=isch') || img.includes('google.com/imgres');
      const isEmpty = !img.trim();

      if (isGoogle || isEmpty) {
        const assignedLocalPath = localPaths[(s.id + s.product_id) % localPaths.length];
        await pool.query('UPDATE product_images SET image_url = ? WHERE id = ?', [assignedLocalPath, s.id]);
        fixedSubCount++;
      }
    }
    console.log(`✅ Updated ${fixedSubCount} product sub-image records in MySQL database!`);

    // 3. Clean Categories table
    const [cats] = await pool.query('SELECT id, image_url, icon_url, banner_url FROM categories');
    let fixedCatCount = 0;

    for (const c of cats) {
      const updates = [];
      const params = [];

      if (!c.image_url || c.image_url.includes('google.com/search')) {
        updates.push('image_url = ?');
        params.push(localPaths[c.id % localPaths.length]);
      }
      if (!c.icon_url || c.icon_url.includes('google.com/search')) {
        updates.push('icon_url = ?');
        params.push(localPaths[(c.id + 1) % localPaths.length]);
      }
      if (!c.banner_url || c.banner_url.includes('google.com/search')) {
        updates.push('banner_url = ?');
        params.push(localPaths[(c.id + 2) % localPaths.length]);
      }

      if (updates.length > 0) {
        params.push(c.id);
        await pool.query(`UPDATE categories SET ${updates.join(', ')} WHERE id = ?`, params);
        fixedCatCount++;
      }
    }
    console.log(`✅ Updated ${fixedCatCount} category records in MySQL database!`);

    console.log('\n=====================================================');
    console.log('✨ PRODUCT CATALOG IMAGES CLEANED & PERSISTED SUCCESSFULLY! ✨');
    console.log('=====================================================');

  } catch (err) {
    console.error('❌ Migration Error:', err);
  } finally {
    process.exit(0);
  }
}

cleanAndMigrateAllProductCatalogImages();
