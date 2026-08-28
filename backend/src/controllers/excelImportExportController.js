const pool = require('../config/db');
const ApiResponse = require('../utils/apiResponse');
const XLSX = require('xlsx');
const { mapProductRowToDTO } = require('./productController');

// Helper to sanitize boolean values from Excel strings/numbers
const parseBool = (val, defaultVal = false) => {
  if (val === undefined || val === null || val === '') return defaultVal;
  if (typeof val === 'boolean') return val;
  if (typeof val === 'number') return val === 1;
  const s = String(val).trim().toLowerCase();
  if (['true', '1', 'yes', 'active', 'on'].includes(s)) return true;
  if (['false', '0', 'no', 'inactive', 'off'].includes(s)) return false;
  return defaultVal;
};

// =========================================================================
// 1. PRODUCT EXPORT (MULTI-SHEET WORKBOOK)
// =========================================================================
exports.exportProducts = async (req, res, next) => {
  try {
    const [products] = await pool.query(`
      SELECT p.*, c.name as category_name 
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id 
      ORDER BY p.id DESC
    `);

    const productsSheetRows = [];
    const colorsSheetRows = [];
    const mediaSheetRows = [];

    for (const p of products) {
      const dto = await mapProductRowToDTO(p);
      const sku = p.sku || `KV-SKU-${p.id}`;

      // 1. Products Sheet Row
      productsSheetRows.push({
        'Product ID': p.id,
        'SKU Code': sku,
        'Product Name': p.name || '',
        'Main Category': p.category_name || p.categoryName || 'Apparel',
        'Subcategory': p.subcategory || p.subCategory || '',
        'Brand': p.brand || 'Karviyam',
        'Selling Price': parseFloat(p.price || 0),
        'MRP Price': parseFloat(p.old_price || p.oldPrice || p.price || 0),
        'Stock Quantity': parseInt(p.stock_quantity || p.stockQuantity || 0, 10),
        'Available Sizes': p.sizes || 'S, M, L, XL, XXL',
        'Material / Fabric': p.material || p.fabric || 'Cotton Blend',
        'Tags': p.tags || '',
        'Description': p.description || '',
        'Featured Product': Boolean(p.is_featured),
        'Trending Product': Boolean(p.is_trending),
        'Best Seller': Boolean(p.is_bestseller),
        'New Arrival': Boolean(p.is_new_arrival),
        'Active Status': p.is_active !== 0,
        'Created Date': p.created_at || '',
        'Updated Date': p.updated_at || '',
        'SEO Title': p.seo_title || p.name || '',
        'Meta Keywords': p.meta_keywords || p.tags || '',
        'Meta Description': p.meta_description || p.description || '',
        'Average Rating': parseFloat(p.rating || 0),
        'Total Rating Count': parseInt(p.ratings_count || 0, 10),
        'Review Count': parseInt(p.reviews_count || 0, 10)
      });

      // 2. Colors & Media Sheet Rows
      const colors = dto?.colors || [];
      colors.forEach((col, cIdx) => {
        const colorName = col.colorName || `Color ${cIdx + 1}`;
        colorsSheetRows.push({
          'SKU Code': sku,
          'Color Index': cIdx + 1,
          'Color Name': colorName,
          'Color Code': col.colorCode || col.hexCode || '#000000',
          'Is Default': Boolean(col.isDefault)
        });

        // Color Main Image
        if (col.mainImage) {
          mediaSheetRows.push({
            'SKU Code': sku,
            'Color Name': colorName,
            'Media Type': 'image',
            'Sort Order': 1,
            'Is Main': true,
            'Media URL': col.mainImage
          });
        }

        // Color Sub Images
        const subImgs = Array.isArray(col.subImages) ? col.subImages : [];
        subImgs.forEach((subUrl, sIdx) => {
          if (subUrl) {
            mediaSheetRows.push({
              'SKU Code': sku,
              'Color Name': colorName,
              'Media Type': 'image',
              'Sort Order': sIdx + 2,
              'Is Main': false,
              'Media URL': subUrl
            });
          }
        });

        // Color Video
        if (col.videoUrl) {
          mediaSheetRows.push({
            'SKU Code': sku,
            'Color Name': colorName,
            'Media Type': 'video',
            'Sort Order': 99,
            'Is Main': false,
            'Media URL': col.videoUrl
          });
        }
      });
    }

    // 3. Field Guide Sheet Row
    const fieldGuideRows = [
      { Column: 'SKU Code', Required: 'REQUIRED', Type: 'Text', Example: 'KV-PRD-001', Description: 'Unique product identifier. Used for non-destructive updates.' },
      { Column: 'Product Name', Required: 'REQUIRED', Type: 'Text', Example: 'Silk Kurta Set', Description: 'Title of the product shown to customers.' },
      { Column: 'Selling Price', Required: 'REQUIRED', Type: 'Number', Example: '1499', Description: 'Actual selling price in INR.' },
      { Column: 'MRP Price', Required: 'OPTIONAL', Type: 'Number', Example: '2499', Description: 'Original maximum retail price before discount.' },
      { Column: 'Stock Quantity', Required: 'REQUIRED', Type: 'Number', Example: '50', Description: 'Available inventory count.' },
      { Column: 'Main Category', Required: 'REQUIRED', Type: 'Text', Example: 'Streetwear', Description: 'Main product category name.' },
      { Column: 'Color 1 Name', Required: 'OPTIONAL', Type: 'Text', Example: 'Crimson Red', Description: 'Name of the first color variant.' },
      { Column: 'Color 1 Code', Required: 'OPTIONAL', Type: 'Hex Code', Example: '#B71C1C', Description: 'Hex color code for swatch dot.' },
      { Column: 'Color 1 Main Image', Required: 'OPTIONAL', Type: 'URL/Path', Example: '/uploads/file-1.jpg', Description: 'Main display image URL for Color 1.' },
      { Column: 'Color 1 Sub Image 1..6', Required: 'OPTIONAL', Type: 'URL/Path', Example: '/uploads/sub-1.jpg', Description: 'Sub images for Color 1 gallery.' },
      { Column: 'Color 1 Video', Required: 'OPTIONAL', Type: 'URL/Path', Example: '/uploads/video.mp4', Description: 'Product video URL for Color 1.' }
    ];

    const wb = XLSX.utils.book_new();
    const wsProducts = XLSX.utils.json_to_sheet(productsSheetRows);
    const wsColors = XLSX.utils.json_to_sheet(colorsSheetRows);
    const wsMedia = XLSX.utils.json_to_sheet(mediaSheetRows);
    const wsGuide = XLSX.utils.json_to_sheet(fieldGuideRows);

    XLSX.utils.book_append_sheet(wb, wsProducts, 'PRODUCTS');
    XLSX.utils.book_append_sheet(wb, wsColors, 'PRODUCT COLORS');
    XLSX.utils.book_append_sheet(wb, wsMedia, 'PRODUCT MEDIA');
    XLSX.utils.book_append_sheet(wb, wsGuide, 'FIELD GUIDE');

    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="karviyam_products_export.xlsx"');
    return res.status(200).send(buf);
  } catch (err) {
    next(err);
  }
};

// =========================================================================
// 2. PRODUCT TEMPLATE DOWNLOAD
// =========================================================================
exports.downloadProductTemplate = async (req, res, next) => {
  try {
    const sampleProducts = [
      {
        'Product ID': '',
        'SKU Code': 'KV-DEMO-001',
        'Product Name': 'Sample Premium Cotton Shirt',
        'Main Category': 'Men',
        'Subcategory': 'Shirts',
        'Brand': 'Karviyam',
        'Selling Price': 1299,
        'MRP Price': 1999,
        'Stock Quantity': 50,
        'Available Sizes': 'S, M, L, XL, XXL',
        'Material / Fabric': '100% Organic Cotton',
        'Tags': 'shirt, cotton, casual, summer',
        'Description': 'Handcrafted premium cotton shirt designed for all-day comfort.',
        'Featured Product': true,
        'Trending Product': true,
        'Best Seller': false,
        'New Arrival': true,
        'Active Status': true,
        'SEO Title': 'Sample Premium Cotton Shirt | Karviyam',
        'Meta Keywords': 'cotton shirt, men fashion, streetwear',
        'Meta Description': 'Buy high quality handcrafted organic cotton shirts online.'
      }
    ];

    const sampleColors = [
      { 'SKU Code': 'KV-DEMO-001', 'Color Index': 1, 'Color Name': 'Crimson Red', 'Color Code': '#B71C1C', 'Is Default': true },
      { 'SKU Code': 'KV-DEMO-001', 'Color Index': 2, 'Color Name': 'Obsidian Black', 'Color Code': '#000000', 'Is Default': false }
    ];

    const sampleMedia = [
      { 'SKU Code': 'KV-DEMO-001', 'Color Name': 'Crimson Red', 'Media Type': 'image', 'Sort Order': 1, 'Is Main': true, 'Media URL': '/uploads/red-main.jpg' },
      { 'SKU Code': 'KV-DEMO-001', 'Color Name': 'Crimson Red', 'Media Type': 'image', 'Sort Order': 2, 'Is Main': false, 'Media URL': '/uploads/red-sub1.jpg' },
      { 'SKU Code': 'KV-DEMO-001', 'Color Name': 'Crimson Red', 'Media Type': 'video', 'Sort Order': 99, 'Is Main': false, 'Media URL': '/uploads/red-video.mp4' },
      { 'SKU Code': 'KV-DEMO-001', 'Color Name': 'Obsidian Black', 'Media Type': 'image', 'Sort Order': 1, 'Is Main': true, 'Media URL': '/uploads/black-main.jpg' }
    ];

    const fieldGuideRows = [
      { Column: 'SKU Code', Required: 'REQUIRED', Type: 'Text', Example: 'KV-DEMO-001', Description: 'Unique identifier. Used to match and update existing products.' },
      { Column: 'Product Name', Required: 'REQUIRED', Type: 'Text', Example: 'Silk Kurta', Description: 'Product title displayed to customers.' },
      { Column: 'Selling Price', Required: 'REQUIRED', Type: 'Number', Example: '1299', Description: 'Final retail price in INR.' },
      { Column: 'MRP Price', Required: 'OPTIONAL', Type: 'Number', Example: '1999', Description: 'Maximum retail price.' },
      { Column: 'Stock Quantity', Required: 'REQUIRED', Type: 'Number', Example: '50', Description: 'Available stock.' },
      { Column: 'Color 1..10 Name', Required: 'OPTIONAL', Type: 'Text', Example: 'Emerald Green', Description: 'Color variant name.' },
      { Column: 'Color 1..10 Main Image', Required: 'OPTIONAL', Type: 'URL/Path', Example: '/uploads/green-main.jpg', Description: 'Main image for the specified color.' },
      { Column: 'Color 1..10 Video', Required: 'OPTIONAL', Type: 'URL/Path', Example: '/uploads/green-video.mp4', Description: 'Product video URL for the specified color.' }
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(sampleProducts), 'PRODUCTS');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(sampleColors), 'PRODUCT COLORS');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(sampleMedia), 'PRODUCT MEDIA');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(fieldGuideRows), 'FIELD GUIDE');

    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="karviyam_product_import_template.xlsx"');
    return res.status(200).send(buf);
  } catch (err) {
    next(err);
  }
};

// =========================================================================
// 3. PRODUCT IMPORT PREVIEW & VALIDATION
// =========================================================================
exports.previewProductImport = async (req, res, next) => {
  try {
    let workbook;
    if (req.file) {
      workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    } else if (req.body.fileBase64) {
      const base64Data = req.body.fileBase64.replace(/^data:.+;base64,/, '');
      workbook = XLSX.read(Buffer.from(base64Data, 'base64'), { type: 'buffer' });
    } else {
      return res.status(400).json(ApiResponse.error('No Excel file provided for preview'));
    }

    const sheetNames = workbook.SheetNames;
    const hasProductsSheet = sheetNames.includes('PRODUCTS');
    const mainSheetName = hasProductsSheet ? 'PRODUCTS' : sheetNames[0];
    const rawProducts = XLSX.utils.sheet_to_json(workbook.Sheets[mainSheetName]);

    let rawColors = [];
    if (sheetNames.includes('PRODUCT COLORS')) {
      rawColors = XLSX.utils.sheet_to_json(workbook.Sheets['PRODUCT COLORS']);
    }

    let rawMedia = [];
    if (sheetNames.includes('PRODUCT MEDIA')) {
      rawMedia = XLSX.utils.sheet_to_json(workbook.Sheets['PRODUCT MEDIA']);
    }

    const [existingSkusRows] = await pool.query('SELECT sku FROM products WHERE sku IS NOT NULL AND sku != ""');
    const existingSkusSet = new Set(existingSkusRows.map(r => String(r.sku).trim().toLowerCase()));

    const previewRows = [];
    let newCount = 0;
    let updateCount = 0;
    let errorCount = 0;
    let skipCount = 0;

    for (let idx = 0; idx < rawProducts.length; idx++) {
      const row = rawProducts[idx];
      const sku = String(row['SKU Code'] || row['SKU'] || row['sku'] || '').trim();
      const name = String(row['Product Name'] || row['Name'] || row['name'] || '').trim();
      const price = parseFloat(row['Selling Price'] || row['Price'] || row['price']);
      const stock = parseInt(row['Stock Quantity'] || row['Stock'] || row['stock'] || 0, 10);

      const rowErrors = [];

      if (!sku) {
        rowErrors.push('SKU Code is required.');
      }
      if (!name) {
        rowErrors.push('Product Name is required.');
      }
      if (isNaN(price) || price < 0) {
        rowErrors.push('Selling Price must be a valid positive number.');
      }
      if (isNaN(stock) || stock < 0) {
        rowErrors.push('Stock Quantity must be a non-negative integer.');
      }

      // Check temporary blob / data URLs in flat columns if present
      for (let c = 1; c <= 10; c++) {
        const mImg = row[`Color ${c} Main Image`];
        if (mImg && (String(mImg).startsWith('blob:') || String(mImg).startsWith('data:'))) {
          rowErrors.push(`Color ${c} Main Image contains invalid temporary browser URL (${mImg.substring(0, 15)}...). Only server URLs are allowed.`);
        }
      }

      const isUpdate = sku && existingSkusSet.has(sku.toLowerCase());
      let action = isUpdate ? 'UPDATE' : 'CREATE';
      let status = rowErrors.length === 0 ? 'VALID' : 'ERROR';

      if (status === 'ERROR') {
        errorCount++;
      } else if (isUpdate) {
        updateCount++;
      } else {
        newCount++;
      }

      previewRows.push({
        rowNumber: idx + 1,
        sku: sku || `ROW-${idx + 1}`,
        productName: name || 'Untitled Product',
        action,
        status,
        errors: rowErrors,
        price: isNaN(price) ? 0 : price,
        stock: isNaN(stock) ? 0 : stock
      });
    }

    return res.status(200).json(ApiResponse.success({
      totalRows: rawProducts.length,
      newCount,
      updateCount,
      errorCount,
      skipCount,
      previewRows
    }, 'Import preview generated successfully'));
  } catch (err) {
    next(err);
  }
};

// =========================================================================
// 4. PRODUCT IMPORT EXECUTION (UPSERT TRANSACTION)
// =========================================================================
exports.executeProductImport = async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    let workbook;
    if (req.file) {
      workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    } else if (req.body.fileBase64) {
      const base64Data = req.body.fileBase64.replace(/^data:.+;base64,/, '');
      workbook = XLSX.read(Buffer.from(base64Data, 'base64'), { type: 'buffer' });
    } else {
      connection.release();
      return res.status(400).json(ApiResponse.error('No Excel file provided for import execution'));
    }

    const sheetNames = workbook.SheetNames;
    const hasProductsSheet = sheetNames.includes('PRODUCTS');
    const mainSheetName = hasProductsSheet ? 'PRODUCTS' : sheetNames[0];
    const rawProducts = XLSX.utils.sheet_to_json(workbook.Sheets[mainSheetName]);

    let rawColors = [];
    if (sheetNames.includes('PRODUCT COLORS')) {
      rawColors = XLSX.utils.sheet_to_json(workbook.Sheets['PRODUCT COLORS']);
    }

    let rawMedia = [];
    if (sheetNames.includes('PRODUCT MEDIA')) {
      rawMedia = XLSX.utils.sheet_to_json(workbook.Sheets['PRODUCT MEDIA']);
    }

    // Group colors & media by SKU Code
    const colorsBySku = {};
    rawColors.forEach(rc => {
      const sku = String(rc['SKU Code'] || rc['SKU'] || '').trim().toLowerCase();
      if (!sku) return;
      if (!colorsBySku[sku]) colorsBySku[sku] = [];
      colorsBySku[sku].push(rc);
    });

    const mediaBySku = {};
    rawMedia.forEach(rm => {
      const sku = String(rm['SKU Code'] || rm['SKU'] || '').trim().toLowerCase();
      if (!sku) return;
      if (!mediaBySku[sku]) mediaBySku[sku] = [];
      mediaBySku[sku].push(rm);
    });

    let createdCount = 0;
    let updatedCount = 0;
    let failedCount = 0;
    const failedRows = [];

    await connection.beginTransaction();

    for (let idx = 0; idx < rawProducts.length; idx++) {
      const row = rawProducts[idx];
      const sku = String(row['SKU Code'] || row['SKU'] || row['sku'] || '').trim();
      const name = String(row['Product Name'] || row['Name'] || row['name'] || '').trim();
      const price = parseFloat(row['Selling Price'] || row['Price'] || row['price']);
      const oldPrice = parseFloat(row['MRP Price'] || row['MRP'] || row['oldPrice'] || price);
      const stock = parseInt(row['Stock Quantity'] || row['Stock'] || row['stock'] || 10, 10);
      const categoryName = String(row['Main Category'] || row['Category'] || 'Apparel').trim();
      const subcategory = String(row['Subcategory'] || '').trim();
      const brand = String(row['Brand'] || 'Karviyam').trim();
      const sizes = String(row['Available Sizes'] || row['Sizes'] || 'S, M, L, XL, XXL').trim();
      const material = String(row['Material / Fabric'] || row['Material'] || 'Cotton Blend').trim();
      const description = String(row['Description'] || '').trim();
      const tags = String(row['Tags'] || '').trim();
      const isFeatured = parseBool(row['Featured Product'] || row['isFeatured'], false);
      const isTrending = parseBool(row['Trending Product'] || row['isTrending'], false);
      const isBestseller = parseBool(row['Best Seller'] || row['isBestseller'], false);
      const isNewArrival = parseBool(row['New Arrival'] || row['isNewArrival'], true);
      const isActive = parseBool(row['Active Status'] || row['isActive'], true);
      const seoTitle = String(row['SEO Title'] || name).trim();
      const metaKeywords = String(row['Meta Keywords'] || tags).trim();
      const metaDescription = String(row['Meta Description'] || description).trim();

      if (!sku || !name || isNaN(price)) {
        failedCount++;
        failedRows.push({
          rowNumber: idx + 1,
          sku: sku || `ROW-${idx + 1}`,
          field: !sku ? 'SKU Code' : (!name ? 'Product Name' : 'Selling Price'),
          problem: 'Required field missing or invalid format.',
          suggestedFix: 'Provide a valid non-empty value.'
        });
        continue;
      }

      // Resolve Category ID
      let categoryId = 1;
      const [cats] = await connection.query('SELECT id FROM categories WHERE LOWER(name) = ? LIMIT 1', [categoryName.toLowerCase()]);
      if (cats.length > 0) {
        categoryId = cats[0].id;
      }

      // Check if product exists by SKU
      const [existing] = await connection.query('SELECT id FROM products WHERE LOWER(sku) = ? LIMIT 1', [sku.toLowerCase()]);

      let productId;
      if (existing.length > 0) {
        productId = existing[0].id;
        // Non-destructive update: Update product fields
        await connection.query(
          `UPDATE products SET 
           category_id = ?, name = ?, description = ?, price = ?, old_price = ?, stock_quantity = ?,
           brand = ?, sizes = ?, material = ?, tags = ?, is_featured = ?, is_trending = ?,
           is_bestseller = ?, is_new_arrival = ?, is_active = ?, seo_title = ?, meta_keywords = ?,
           meta_description = ?, updated_at = NOW()
           WHERE id = ?`,
          [
            categoryId, name, description, price, oldPrice, stock, brand, sizes, material, tags,
            isFeatured ? 1 : 0, isTrending ? 1 : 0, isBestseller ? 1 : 0, isNewArrival ? 1 : 0,
            isActive ? 1 : 0, seoTitle, metaKeywords, metaDescription, productId
          ]
        );
        updatedCount++;
      } else {
        // Insert new product
        const [insertRes] = await connection.query(
          `INSERT INTO products 
           (category_id, name, sku, description, price, old_price, stock_quantity, brand, sizes, material, tags,
            is_featured, is_trending, is_bestseller, is_new_arrival, is_active, seo_title, meta_keywords, meta_description, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
          [
            categoryId, name, sku, description, price, oldPrice, stock, brand, sizes, material, tags,
            isFeatured ? 1 : 0, isTrending ? 1 : 0, isBestseller ? 1 : 0, isNewArrival ? 1 : 0,
            isActive ? 1 : 0, seoTitle, metaKeywords, metaDescription
          ]
        );
        productId = insertRes.insertId;
        createdCount++;
      }

      // Process Color Variants (Multi-sheet OR Flat format)
      let parsedColors = [];

      const skuKey = sku.toLowerCase();
      if (colorsBySku[skuKey] && colorsBySku[skuKey].length > 0) {
        // Multi-sheet format
        const relMedia = mediaBySku[skuKey] || [];
        colorsBySku[skuKey].forEach(cRow => {
          const cName = String(cRow['Color Name'] || 'Standard').trim();
          const cCode = String(cRow['Color Code'] || '#000000').trim();
          const isDefault = parseBool(cRow['Is Default'], false);

          const cMedia = relMedia.filter(m => String(m['Color Name']).trim().toLowerCase() === cName.toLowerCase());
          const mainMedia = cMedia.find(m => parseBool(m['Is Main']) || m['Sort Order'] === 1);
          const subMedia = cMedia.filter(m => m !== mainMedia && String(m['Media Type']).toLowerCase() !== 'video');
          const videoMedia = cMedia.find(m => String(m['Media Type']).toLowerCase() === 'video');

          parsedColors.push({
            colorName: cName,
            colorCode: cCode,
            isDefault,
            mainImage: mainMedia ? mainMedia['Media URL'] : '',
            subImages: subMedia.map(sm => sm['Media URL']).filter(Boolean),
            videoUrl: videoMedia ? videoMedia['Media URL'] : ''
          });
        });
      } else {
        // Flat format columns (Color 1 Name, Color 1 Code, Color 1 Main Image, etc.)
        for (let c = 1; c <= 10; c++) {
          const cName = String(row[`Color ${c} Name`] || '').trim();
          if (cName) {
            const cCode = String(row[`Color ${c} Code`] || '#000000').trim();
            const isDef = parseBool(row[`Color ${c} Is Default`], c === 1);
            const mainImg = String(row[`Color ${c} Main Image`] || '').trim();
            const subImgs = [];
            for (let s = 1; s <= 6; s++) {
              const subUrl = String(row[`Color ${c} Sub Image ${s}`] || '').trim();
              if (subUrl && !subUrl.startsWith('blob:') && !subUrl.startsWith('data:')) {
                subImgs.push(subUrl);
              }
            }
            const videoUrl = String(row[`Color ${c} Video`] || '').trim();

            parsedColors.push({
              colorName: cName,
              colorCode: cCode,
              isDefault: isDef,
              mainImage: mainImg && !mainImg.startsWith('blob:') && !mainImg.startsWith('data:') ? mainImg : '',
              subImages: subImgs,
              videoUrl: videoUrl && !videoUrl.startsWith('blob:') && !videoUrl.startsWith('data:') ? videoUrl : ''
            });
          }
        }
      }

      // If color variants were explicitly provided in Excel, insert into relational tables
      if (parsedColors.length > 0) {
        // Delete existing color records for this product before updating
        const [oldColors] = await connection.query('SELECT id FROM product_colors WHERE product_id = ?', [productId]);
        for (const oc of oldColors) {
          await connection.query('DELETE FROM product_color_images WHERE product_color_id = ?', [oc.id]);
        }
        await connection.query('DELETE FROM product_colors WHERE product_id = ?', [productId]);

        // Insert new color records
        for (const c of parsedColors) {
          const [cRes] = await connection.query(
            `INSERT INTO product_colors (product_id, color_name, color_code, hex_code, is_default, main_image, video_url)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [productId, c.colorName, c.colorCode, c.colorCode, c.isDefault ? 1 : 0, c.mainImage || null, c.videoUrl || null]
          );
          const colorId = cRes.insertId;

          if (c.mainImage) {
            await connection.query(
              `INSERT INTO product_color_images (product_color_id, image_url, is_main, sort_order) VALUES (?, ?, 1, 1)`,
              [colorId, c.mainImage]
            );
          }

          for (let sIdx = 0; sIdx < c.subImages.length; sIdx++) {
            await connection.query(
              `INSERT INTO product_color_images (product_color_id, image_url, is_main, sort_order) VALUES (?, ?, 0, ?)`,
              [colorId, c.subImages[sIdx], sIdx + 2]
            );
          }
        }

        // Set main product image URL from default color or first color
        const defaultColor = parsedColors.find(c => c.isDefault) || parsedColors[0];
        if (defaultColor && defaultColor.mainImage) {
          await connection.query('UPDATE products SET image_url = ? WHERE id = ?', [defaultColor.mainImage, productId]);
        }
      }
    }

    await connection.commit();
    connection.release();

    return res.status(200).json(ApiResponse.success({
      createdCount,
      updatedCount,
      failedCount,
      failedRows
    }, 'Product import completed successfully'));
  } catch (err) {
    await connection.rollback();
    connection.release();
    next(err);
  }
};

// =========================================================================
// 5. DOWNLOAD ERROR REPORT
// =========================================================================
exports.downloadErrorReport = async (req, res, next) => {
  try {
    const failedRows = req.body.failedRows || [];

    const reportRows = failedRows.map((fr, idx) => ({
      'Row Number': fr.rowNumber || idx + 1,
      'SKU Code': fr.sku || 'N/A',
      'Field Name': fr.field || 'General',
      'Error Description': fr.problem || 'Validation failed',
      'Suggested Fix': fr.suggestedFix || 'Review field requirements and re-upload'
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(reportRows);
    XLSX.utils.book_append_sheet(wb, ws, 'IMPORT ERRORS');

    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="karviyam_import_error_report.xlsx"');
    return res.status(200).send(buf);
  } catch (err) {
    next(err);
  }
};

// =========================================================================
// 6. CATEGORY EXPORT & IMPORT
// =========================================================================
exports.exportCategories = async (req, res, next) => {
  try {
    const [categories] = await pool.query(`
      SELECT c.*, p.name as parent_category_name, p.image_url as parent_image_url
      FROM categories c
      LEFT JOIN categories p ON c.parent_id = p.id
      ORDER BY c.id ASC
    `);

    const rows = categories.map(c => ({
      'Category ID': c.id,
      'Category Name': c.name || '',
      'Parent Category Name': c.parent_category_name || '',
      'Parent Category Image': c.parent_image_url || '',
      'Classification Type': c.type || c.classification || 'General',
      'Display Order': c.sort_order || c.display_order || 0,
      'Active Status': c.is_active !== 0,
      'Main Image': c.image_url || '',
      'Category Icon': c.icon_url || c.icon || '',
      'Category Banner': c.banner_url || c.banner || '',
      'Description': c.description || '',
      'SEO Title': c.seo_title || c.name || '',
      'Meta Keywords': c.meta_keywords || '',
      'Meta Description': c.meta_description || ''
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, 'CATEGORIES');

    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="karviyam_categories_export.xlsx"');
    return res.status(200).send(buf);
  } catch (err) {
    next(err);
  }
};

exports.importCategories = async (req, res, next) => {
  try {
    let workbook;
    if (req.file) {
      workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    } else if (req.body.fileBase64) {
      const base64Data = req.body.fileBase64.replace(/^data:.+;base64,/, '');
      workbook = XLSX.read(Buffer.from(base64Data, 'base64'), { type: 'buffer' });
    } else {
      return res.status(400).json(ApiResponse.error('No Excel file provided for category import'));
    }

    const sheetName = workbook.SheetNames[0];
    const rawRows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

    let createdCount = 0;
    let updatedCount = 0;

    for (const r of rawRows) {
      const name = String(r['Category Name'] || r['name'] || '').trim();
      if (!name) continue;

      const parentName = String(r['Parent Category Name'] || '').trim();
      const parentImage = String(r['Parent Category Image'] || '').trim();
      const type = String(r['Classification Type'] || 'General').trim();
      const displayOrder = parseInt(r['Display Order'] || 0, 10);
      const isActive = parseBool(r['Active Status'], true);
      const mainImage = String(r['Main Image'] || '').trim();
      const iconUrl = String(r['Category Icon'] || '').trim();
      const bannerUrl = String(r['Category Banner'] || '').trim();
      const description = String(r['Description'] || '').trim();
      const seoTitle = String(r['SEO Title'] || name).trim();
      const metaKeywords = String(r['Meta Keywords'] || '').trim();
      const metaDescription = String(r['Meta Description'] || description).trim();

      // Resolve Parent Category
      let parentId = null;
      if (parentName) {
        const [parents] = await pool.query('SELECT id FROM categories WHERE LOWER(name) = ? LIMIT 1', [parentName.toLowerCase()]);
        if (parents.length > 0) {
          parentId = parents[0].id;
          if (parentImage) {
            await pool.query('UPDATE categories SET image_url = ? WHERE id = ?', [parentImage, parentId]);
          }
        }
      }

      // Check if category exists
      const [existing] = await pool.query('SELECT id FROM categories WHERE LOWER(name) = ? LIMIT 1', [name.toLowerCase()]);

      if (existing.length > 0) {
        await pool.query(
          `UPDATE categories SET 
           parent_id = ?, type = ?, sort_order = ?, is_active = ?, image_url = ?, icon_url = ?, banner_url = ?,
           description = ?, seo_title = ?, meta_keywords = ?, meta_description = ?
           WHERE id = ?`,
          [parentId, type, displayOrder, isActive ? 1 : 0, mainImage, iconUrl, bannerUrl, description, seoTitle, metaKeywords, metaDescription, existing[0].id]
        );
        updatedCount++;
      } else {
        await pool.query(
          `INSERT INTO categories 
           (name, parent_id, type, sort_order, is_active, image_url, icon_url, banner_url, description, seo_title, meta_keywords, meta_description)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [name, parentId, type, displayOrder, isActive ? 1 : 0, mainImage, iconUrl, bannerUrl, description, seoTitle, metaKeywords, metaDescription]
        );
        createdCount++;
      }
    }

    return res.status(200).json(ApiResponse.success({ createdCount, updatedCount }, 'Category import completed successfully'));
  } catch (err) {
    next(err);
  }
};

// =========================================================================
// 7. BANNER EXPORT & IMPORT
// =========================================================================
exports.exportBanners = async (req, res, next) => {
  try {
    const [banners] = await pool.query('SELECT * FROM banners ORDER BY id ASC');

    const rows = banners.map(b => ({
      'Banner ID': b.id,
      'Title': b.title || '',
      'Subtitle': b.subtitle || '',
      'Main Image': b.image_url || b.image || '',
      'Mobile Image': b.mobile_image || b.mobileImage || b.image_url || '',
      'Desktop Image': b.desktop_image || b.desktopImage || b.image_url || '',
      'Promotional Link': b.link || b.url || '',
      'Display Order': b.sort_order || b.display_order || 0,
      'Active Status': b.is_active !== 0,
      'Auto Scroll Status': b.auto_scroll !== 0
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, 'BANNERS');

    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="karviyam_banners_export.xlsx"');
    return res.status(200).send(buf);
  } catch (err) {
    next(err);
  }
};

exports.importBanners = async (req, res, next) => {
  try {
    let workbook;
    if (req.file) {
      workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    } else if (req.body.fileBase64) {
      const base64Data = req.body.fileBase64.replace(/^data:.+;base64,/, '');
      workbook = XLSX.read(Buffer.from(base64Data, 'base64'), { type: 'buffer' });
    } else {
      return res.status(400).json(ApiResponse.error('No Excel file provided for banner import'));
    }

    const sheetName = workbook.SheetNames[0];
    const rawRows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

    let createdCount = 0;
    let updatedCount = 0;

    for (const r of rawRows) {
      const title = String(r['Title'] || '').trim();
      const subtitle = String(r['Subtitle'] || '').trim();
      const mainImage = String(r['Main Image'] || r['Desktop Image'] || r['Mobile Image'] || '').trim();
      const mobileImage = String(r['Mobile Image'] || mainImage).trim();
      const desktopImage = String(r['Desktop Image'] || mainImage).trim();
      const link = String(r['Promotional Link'] || '').trim();
      const sortOrder = parseInt(r['Display Order'] || 0, 10);
      const isActive = parseBool(r['Active Status'], true);
      const bannerId = r['Banner ID'];

      if (!mainImage && !title) continue;

      if (bannerId) {
        const [existing] = await pool.query('SELECT id FROM banners WHERE id = ?', [bannerId]);
        if (existing.length > 0) {
          await pool.query(
            `UPDATE banners SET title = ?, subtitle = ?, image_url = ?, mobile_image = ?, desktop_image = ?, link = ?, sort_order = ?, is_active = ? WHERE id = ?`,
            [title, subtitle, mainImage, mobileImage, desktopImage, link, sortOrder, isActive ? 1 : 0, bannerId]
          );
          updatedCount++;
          continue;
        }
      }

      await pool.query(
        `INSERT INTO banners (title, subtitle, image_url, mobile_image, desktop_image, link, sort_order, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [title, subtitle, mainImage, mobileImage, desktopImage, link, sortOrder, isActive ? 1 : 0]
      );
      createdCount++;
    }

    return res.status(200).json(ApiResponse.success({ createdCount, updatedCount }, 'Banner import completed successfully'));
  } catch (err) {
    next(err);
  }
};

// =========================================================================
// 8. COUPON EXPORT & IMPORT
// =========================================================================
exports.exportCoupons = async (req, res, next) => {
  try {
    const [coupons] = await pool.query('SELECT * FROM coupons ORDER BY id DESC');

    const rows = coupons.map(c => ({
      'Coupon Code': c.code || '',
      'Discount Type': c.discount_type || 'percentage',
      'Discount Value': parseFloat(c.discount_value || 0),
      'Maximum Discount': parseFloat(c.max_discount || 0),
      'Minimum Order Amount': parseFloat(c.min_order_amount || 0),
      'Usage Limit': parseInt(c.usage_limit || 0, 10),
      'Per User Limit': parseInt(c.per_user_limit || 1, 10),
      'Start Date': c.start_date || '',
      'End Date': c.end_date || c.expires_at || '',
      'Applicable Categories': c.applicable_categories || '',
      'Active Status': c.is_active !== 0
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, 'COUPONS');

    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="karviyam_coupons_export.xlsx"');
    return res.status(200).send(buf);
  } catch (err) {
    next(err);
  }
};

exports.importCoupons = async (req, res, next) => {
  try {
    let workbook;
    if (req.file) {
      workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    } else if (req.body.fileBase64) {
      const base64Data = req.body.fileBase64.replace(/^data:.+;base64,/, '');
      workbook = XLSX.read(Buffer.from(base64Data, 'base64'), { type: 'buffer' });
    } else {
      return res.status(400).json(ApiResponse.error('No Excel file provided for coupon import'));
    }

    const rawRows = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
    let createdCount = 0;
    let updatedCount = 0;

    for (const r of rawRows) {
      const code = String(r['Coupon Code'] || r['code'] || '').trim().toUpperCase();
      if (!code) continue;

      const discountType = String(r['Discount Type'] || 'percentage').trim().toLowerCase();
      const discountValue = parseFloat(r['Discount Value'] || 0);
      const maxDiscount = parseFloat(r['Maximum Discount'] || 0);
      const minOrder = parseFloat(r['Minimum Order Amount'] || 0);
      const usageLimit = parseInt(r['Usage Limit'] || 0, 10);
      const perUserLimit = parseInt(r['Per User Limit'] || 1, 10);
      const isActive = parseBool(r['Active Status'], true);

      const [existing] = await pool.query('SELECT id FROM coupons WHERE UPPER(code) = ?', [code]);
      if (existing.length > 0) {
        await pool.query(
          `UPDATE coupons SET discount_type = ?, discount_value = ?, max_discount = ?, min_order_amount = ?,
           usage_limit = ?, per_user_limit = ?, is_active = ? WHERE id = ?`,
          [discountType, discountValue, maxDiscount, minOrder, usageLimit, perUserLimit, isActive ? 1 : 0, existing[0].id]
        );
        updatedCount++;
      } else {
        await pool.query(
          `INSERT INTO coupons (code, discount_type, discount_value, max_discount, min_order_amount, usage_limit, per_user_limit, is_active)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [code, discountType, discountValue, maxDiscount, minOrder, usageLimit, perUserLimit, isActive ? 1 : 0]
        );
        createdCount++;
      }
    }

    return res.status(200).json(ApiResponse.success({ createdCount, updatedCount }, 'Coupon import completed successfully'));
  } catch (err) {
    next(err);
  }
};

// =========================================================================
// 9. CUSTOMER EXPORT (NO SENSITIVE CREDENTIALS)
// =========================================================================
exports.exportCustomers = async (req, res, next) => {
  try {
    const [customers] = await pool.query(`
      SELECT u.id, u.name, u.email, u.phone, u.role, u.is_active, u.created_at,
             COUNT(o.id) as total_orders, COALESCE(SUM(o.total_amount), 0) as total_spent
      FROM users u
      LEFT JOIN orders o ON u.id = o.user_id
      WHERE u.role = 'customer' OR u.role IS NULL
      GROUP BY u.id
      ORDER BY u.id DESC
    `);

    const rows = customers.map(c => ({
      'Customer ID': c.id,
      'Full Name': c.name || '',
      'Email Address': c.email || '',
      'Phone Number': c.phone || '',
      'Account Role': c.role || 'customer',
      'Active Status': c.is_active !== 0,
      'Total Orders': parseInt(c.total_orders || 0, 10),
      'Total Spent Amount (INR)': parseFloat(c.total_spent || 0),
      'Joined Date': c.created_at || ''
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, 'CUSTOMERS');

    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="karviyam_customers_export.xlsx"');
    return res.status(200).send(buf);
  } catch (err) {
    next(err);
  }
};

// =========================================================================
// 10. ORDER EXPORT (MULTI-SHEET: ORDERS + ORDER ITEMS)
// =========================================================================
exports.exportOrders = async (req, res, next) => {
  try {
    const [orders] = await pool.query(`
      SELECT o.*, p.payment_method, p.payment_status, p.transaction_id
      FROM orders o
      LEFT JOIN payments p ON o.id = p.order_id
      ORDER BY o.id DESC
    `);

    const ordersSheetRows = [];
    const itemsSheetRows = [];

    for (const o of orders) {
      const orderNo = `KV-ORD-${o.id}`;

      ordersSheetRows.push({
        'Order ID': o.id,
        'Order Number': orderNo,
        'Customer Name': o.full_name || '',
        'Customer Email': o.email || '',
        'Customer Phone': o.phone || '',
        'Shipping Address': o.address || '',
        'City': o.city || '',
        'Pincode': o.pincode || '',
        'Total Amount (INR)': parseFloat(o.total_amount || 0),
        'Discount Amount': parseFloat(o.discount_amount || 0),
        'Shipping Cost': parseFloat(o.shipping_cost || 0),
        'Order Status': o.status || 'Pending',
        'Payment Method': o.payment_method || 'COD',
        'Payment Status': o.payment_status || 'Pending',
        'Transaction ID': o.transaction_id || '',
        'Order Date': o.created_at || o.order_date || ''
      });

      const [items] = await pool.query(`
        SELECT oi.*, pr.name as product_name, pr.sku as product_sku
        FROM order_items oi
        LEFT JOIN products pr ON oi.product_id = pr.id
        WHERE oi.order_id = ?
      `, [o.id]);

      items.forEach(item => {
        itemsSheetRows.push({
          'Order Number': orderNo,
          'Product SKU': item.product_sku || `SKU-${item.product_id}`,
          'Product Name': item.product_name || `Product #${item.product_id}`,
          'Color Variant': item.selected_color || 'Standard',
          'Size': item.selected_size || 'M',
          'Quantity': parseInt(item.quantity || 1, 10),
          'Unit Price': parseFloat(item.price_at_time || 0),
          'Line Item Total': parseFloat((item.price_at_time || 0) * (item.quantity || 1))
        });
      });
    }

    const wb = XLSX.utils.book_new();
    const wsOrders = XLSX.utils.json_to_sheet(ordersSheetRows);
    const wsItems = XLSX.utils.json_to_sheet(itemsSheetRows);

    XLSX.utils.book_append_sheet(wb, wsOrders, 'ORDERS');
    XLSX.utils.book_append_sheet(wb, wsItems, 'ORDER ITEMS');

    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="karviyam_orders_export.xlsx"');
    return res.status(200).send(buf);
  } catch (err) {
    next(err);
  }
};
