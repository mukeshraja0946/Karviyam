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

// Helper to format product export row with ALL Normal Fields FIRST and ALL Color 1..10 Fields LAST
function formatProductExportRow(p, dto) {
  const sku = p.sku || `KV-SKU-${p.id}`;

  // 1. Normal Product Fields FIRST
  const row = {
    'Product ID': p.id || '',
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
    'Description': p.description || '',
    'Tags': p.tags || '',
    'Featured Product': parseBool(p.is_featured, false),
    'Trending Product': parseBool(p.is_trending, false),
    'Best Seller': parseBool(p.is_bestseller, false),
    'New Arrival': parseBool(p.is_new_arrival, true),
    'Active Catalog Status': parseBool(p.is_active, true),
    'Barcode': p.barcode || '',
    'Weight': p.weight || '',
    'Dimensions': p.dimensions || '',
    'Country Of Origin': p.country_of_origin || p.countryOfOrigin || 'India',
    'Manufacturer': p.manufacturer || 'Karviyam',
    'HSN Code': p.hsn_code || p.hsnCode || '',
    'GST Percentage': p.gst_percentage || p.gstPercentage || 12,
    'Minimum Order Quantity': p.min_order_qty || p.minOrderQty || 1,
    'Maximum Order Quantity': p.max_order_qty || p.maxOrderQty || 10,
    'Warranty': p.warranty || '',
    'Return Days': p.return_days || p.returnDays || '7 Days',
    'SEO Title': p.seo_title || p.name || '',
    'Meta Keywords': p.meta_keywords || p.tags || '',
    'Meta Description': p.meta_description || p.description || ''
  };

  // 2. Color 1 to Color 10 Fields AT THE VERY END
  const colors = dto?.colors || [];
  for (let c = 1; c <= 10; c++) {
    const col = colors[c - 1];
    if (col) {
      row[`Color ${c} Name`] = col.colorName || '';
      row[`Color ${c} Hex`] = col.colorCode || col.hexCode || '#000000';
      row[`Color ${c} Default`] = Boolean(col.isDefault);
      row[`Color ${c} Main Image`] = col.mainImage || '';
      
      const subImgs = Array.isArray(col.subImages) ? col.subImages : [];
      for (let s = 1; s <= 6; s++) {
        row[`Color ${c} Sub Image ${s}`] = subImgs[s - 1] || '';
      }
      row[`Color ${c} Video`] = col.videoUrl || '';
    } else {
      row[`Color ${c} Name`] = '';
      row[`Color ${c} Hex`] = '';
      row[`Color ${c} Default`] = false;
      row[`Color ${c} Main Image`] = '';
      for (let s = 1; s <= 6; s++) {
        row[`Color ${c} Sub Image ${s}`] = '';
      }
      row[`Color ${c} Video`] = '';
    }
  }

  return row;
}

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

      // 1. Products Sheet Row (Normal fields first, Colors last)
      productsSheetRows.push(formatProductExportRow(p, dto));

      // 2. Relational Colors & Media Sheet Rows (For Multi-Sheet Power Users)
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
      { Column: 'Color 1..10 Name', Required: 'OPTIONAL', Type: 'Text', Example: 'Crimson Red', Description: 'Color variant name (located in the last columns).' },
      { Column: 'Color 1..10 Hex', Required: 'OPTIONAL', Type: 'Hex Code', Example: '#B71C1C', Description: 'Hex color code for swatch dot.' },
      { Column: 'Color 1..10 Main Image', Required: 'OPTIONAL', Type: 'URL/Path', Example: '/uploads/file-1.jpg', Description: 'Main display image URL for the color variant.' },
      { Column: 'Color 1..10 Sub Image 1..6', Required: 'OPTIONAL', Type: 'URL/Path', Example: '/uploads/sub-1.jpg', Description: 'Sub images 1 to 6 for the color variant gallery.' },
      { Column: 'Color 1..10 Video', Required: 'OPTIONAL', Type: 'URL/Path', Example: '/uploads/video.mp4', Description: 'Product video URL for the color variant.' }
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
    const sampleProduct = {
      id: 1,
      sku: 'KV-DEMO-001',
      name: 'Sample Premium Cotton Shirt',
      category_name: 'Men',
      subcategory: 'Shirts',
      brand: 'Karviyam',
      price: 1299,
      old_price: 1999,
      stock_quantity: 50,
      sizes: 'S, M, L, XL, XXL',
      material: '100% Organic Cotton',
      tags: 'shirt, cotton, casual, summer',
      description: 'Handcrafted premium cotton shirt designed for all-day comfort.',
      is_featured: true,
      is_trending: true,
      is_bestseller: false,
      is_new_arrival: true,
      is_active: true,
      seo_title: 'Sample Premium Cotton Shirt | Karviyam',
      meta_keywords: 'cotton shirt, men fashion, streetwear',
      meta_description: 'Buy high quality handcrafted organic cotton shirts online.'
    };

    const sampleDTO = {
      colors: [
        {
          colorName: 'Crimson Red',
          colorCode: '#B71C1C',
          isDefault: true,
          mainImage: '/uploads/red-main.jpg',
          subImages: ['/uploads/red-sub1.jpg', '/uploads/red-sub2.jpg'],
          videoUrl: '/uploads/red-video.mp4'
        },
        {
          colorName: 'Obsidian Black',
          colorCode: '#000000',
          isDefault: false,
          mainImage: '/uploads/black-main.jpg',
          subImages: ['/uploads/black-sub1.jpg'],
          videoUrl: ''
        }
      ]
    };

    const sampleProducts = [formatProductExportRow(sampleProduct, sampleDTO)];

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
      { Column: 'Color 1..10 Name', Required: 'OPTIONAL', Type: 'Text', Example: 'Emerald Green', Description: 'Color variant name (located in the last columns).' },
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

      // Check temporary blob / data URLs in Color 1..10 columns at the end of row
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

    // Group colors & media by SKU Code for multi-sheet imports
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
      const stock = parseInt(row['Stock Quantity'] || row['Stock'] || row['stock'] || 0, 10);
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
      const isActive = parseBool(row['Active Catalog Status'] || row['Active Status'] || row['isActive'], true);
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
        // Non-destructive update: Update product normal fields first
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

      // -----------------------------------------------------------------
      // Process Color Data from the Last Columns (or Multi-sheet)
      // -----------------------------------------------------------------
      let parsedColors = [];

      const skuKey = sku.toLowerCase();
      if (colorsBySku[skuKey] && colorsBySku[skuKey].length > 0) {
        // Multi-sheet format
        const relMedia = mediaBySku[skuKey] || [];
        colorsBySku[skuKey].forEach(cRow => {
          const cName = String(cRow['Color Name'] || '').trim();
          const cCode = String(cRow['Color Code'] || cRow['Color Hex'] || '#000000').trim();
          const isDefault = parseBool(cRow['Is Default'], false);

          const cMedia = relMedia.filter(m => String(m['Color Name']).trim().toLowerCase() === cName.toLowerCase());
          const mainMedia = cMedia.find(m => parseBool(m['Is Main']) || m['Sort Order'] === 1);
          const subMedia = cMedia.filter(m => m !== mainMedia && String(m['Media Type']).toLowerCase() !== 'video');
          const videoMedia = cMedia.find(m => String(m['Media Type']).toLowerCase() === 'video');

          if (cName || (mainMedia && mainMedia['Media URL'])) {
            parsedColors.push({
              colorName: cName || 'Standard',
              colorCode: cCode,
              isDefault,
              mainImage: mainMedia ? mainMedia['Media URL'] : '',
              subImages: subMedia.map(sm => sm['Media URL']).filter(Boolean),
              videoUrl: videoMedia ? videoMedia['Media URL'] : ''
            });
          }
        });
      }

      // Flat format columns at the end of row (Color 1 Name ... Color 10 Video)
      if (parsedColors.length === 0) {
        for (let c = 1; c <= 20; c++) {
          const cName = String(row[`Color ${c} Name`] || '').trim();
          const cCode = String(row[`Color ${c} Hex`] || row[`Color ${c} Code`] || '').trim();
          const mainImg = String(row[`Color ${c} Main Image`] || '').trim();
          const isDef = parseBool(row[`Color ${c} Default`] || row[`Color ${c} Is Default`], c === 1);

          const subImgs = [];
          for (let s = 1; s <= 6; s++) {
            const subUrl = String(row[`Color ${c} Sub Image ${s}`] || row[`Color ${c} Image ${s}`] || '').trim();
            if (subUrl && !subUrl.startsWith('blob:') && !subUrl.startsWith('data:')) {
              subImgs.push(subUrl);
            }
          }
          const videoUrl = String(row[`Color ${c} Video`] || '').trim();

          // RULES 3 & 4: Create ONLY colors that actually contain data. Do not create empty colors.
          const hasData = cName !== '' || (mainImg !== '' && !mainImg.startsWith('blob:') && !mainImg.startsWith('data:'));
          if (hasData) {
            parsedColors.push({
              colorName: cName || `Color ${c}`,
              colorCode: cCode || '#000000',
              isDefault: isDef,
              mainImage: mainImg && !mainImg.startsWith('blob:') && !mainImg.startsWith('data:') ? mainImg : '',
              subImages: subImgs,
              videoUrl: videoUrl && !videoUrl.startsWith('blob:') && !videoUrl.startsWith('data:') ? videoUrl : ''
            });
          }
        }
      }

      // RULES 7 & 8: If existing SKU is imported and parsedColors contains new color data, update color variants.
      // If parsedColors.length === 0, DO NOT RESET OR DELETE PREVIOUSLY SAVED COLORS!
      if (parsedColors.length > 0) {
        // Delete existing color records before re-inserting updated color variants
        const [oldColors] = await connection.query('SELECT id FROM product_colors WHERE product_id = ?', [productId]);
        for (const oc of oldColors) {
          await connection.query('DELETE FROM product_color_images WHERE product_color_id = ?', [oc.id]);
        }
        await connection.query('DELETE FROM product_colors WHERE product_id = ?', [productId]);

        // Insert colors maintaining exact order, main image, sub images & video
        for (let cIdx = 0; cIdx < parsedColors.length; cIdx++) {
          const c = parsedColors[cIdx];
          const isDefaultVal = c.isDefault || (cIdx === 0 && !parsedColors.some(pc => pc.isDefault));

          const [cRes] = await connection.query(
            `INSERT INTO product_colors (product_id, color_name, color_code, hex_code, is_default, main_image, video_url)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [productId, c.colorName, c.colorCode, c.colorCode, isDefaultVal ? 1 : 0, c.mainImage || null, c.videoUrl || null]
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

        // Update main product image_url from default color
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
    const [banners] = await pool.query(`SELECT * FROM banners ORDER BY display_order ASC, id ASC`);

    const rows = banners.map(b => ({
      'Banner ID': b.id,
      'Title': b.title || '',
      'Subtitle': b.subtitle || '',
      'Desktop Image URL': b.image_path || b.image_url || '',
      'Mobile Image URL': b.mobile_image_url || b.image_path || '',
      'Target Link': b.link || b.button_link || '/shop',
      'Button Text': b.button_text || 'Shop Now',
      'Display Order': b.display_order || b.sort_order || 1,
      'Active Status': (b.status || (b.is_active !== 0 ? 'active' : 'inactive')).toLowerCase() === 'active'
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
      const title = String(r['Title'] || r['title'] || '').trim();
      const desktopImage = String(r['Desktop Image URL'] || r['image'] || '').trim();
      if (!title && !desktopImage) continue;

      const subtitle = String(r['Subtitle'] || '').trim();
      const mobileImage = String(r['Mobile Image URL'] || desktopImage).trim();
      const link = String(r['Target Link'] || '/shop').trim();
      const buttonText = String(r['Button Text'] || 'Shop Now').trim();
      const displayOrder = parseInt(r['Display Order'] || 1, 10);
      const isActive = parseBool(r['Active Status'], true);
      const status = isActive ? 'active' : 'inactive';

      const [existing] = await pool.query('SELECT id FROM banners WHERE LOWER(title) = ? LIMIT 1', [title.toLowerCase()]);

      if (existing.length > 0) {
        await pool.query(
          `UPDATE banners SET 
           subtitle = ?, image_path = ?, image_url = ?, mobile_image_url = ?, link = ?, button_link = ?,
           button_text = ?, display_order = ?, status = ?, is_active = ?
           WHERE id = ?`,
          [subtitle, desktopImage, desktopImage, mobileImage, link, link, buttonText, displayOrder, status, isActive ? 1 : 0, existing[0].id]
        );
        updatedCount++;
      } else {
        await pool.query(
          `INSERT INTO banners 
           (title, subtitle, image_path, image_url, mobile_image_url, link, button_link, button_text, display_order, status, is_active)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [title, subtitle, desktopImage, desktopImage, mobileImage, link, link, buttonText, displayOrder, status, isActive ? 1 : 0]
        );
        createdCount++;
      }
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
    const [coupons] = await pool.query(`SELECT * FROM coupons ORDER BY id DESC`);

    const rows = coupons.map(c => ({
      'Coupon ID': c.id,
      'Coupon Code': c.code || '',
      'Discount Type': c.discount_type || c.type || 'PERCENTAGE',
      'Discount Value': parseFloat(c.discount_value || c.value || 0),
      'Minimum Order Amount': parseFloat(c.min_order_amount || c.minAmount || 0),
      'Maximum Discount Amount': parseFloat(c.max_discount_amount || 0),
      'Usage Limit': parseInt(c.usage_limit || 0, 10),
      'Times Used': parseInt(c.used_count || 0, 10),
      'Start Date': c.start_date || '',
      'End Date': c.end_date || c.expires_at || '',
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

    const sheetName = workbook.SheetNames[0];
    const rawRows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

    let createdCount = 0;
    let updatedCount = 0;

    for (const r of rawRows) {
      const code = String(r['Coupon Code'] || r['code'] || '').trim().toUpperCase();
      if (!code) continue;

      const discountType = String(r['Discount Type'] || 'PERCENTAGE').trim().toUpperCase();
      const discountValue = parseFloat(r['Discount Value'] || 0);
      const minOrderAmount = parseFloat(r['Minimum Order Amount'] || 0);
      const maxDiscountAmount = parseFloat(r['Maximum Discount Amount'] || 0);
      const usageLimit = parseInt(r['Usage Limit'] || 100, 10);
      const startDate = r['Start Date'] || null;
      const endDate = r['End Date'] || null;
      const isActive = parseBool(r['Active Status'], true);

      const [existing] = await pool.query('SELECT id FROM coupons WHERE UPPER(code) = ? LIMIT 1', [code]);

      if (existing.length > 0) {
        await pool.query(
          `UPDATE coupons SET 
           discount_type = ?, discount_value = ?, min_order_amount = ?, max_discount_amount = ?,
           usage_limit = ?, start_date = ?, end_date = ?, is_active = ?
           WHERE id = ?`,
          [discountType, discountValue, minOrderAmount, maxDiscountAmount, usageLimit, startDate, endDate, isActive ? 1 : 0, existing[0].id]
        );
        updatedCount++;
      } else {
        await pool.query(
          `INSERT INTO coupons 
           (code, discount_type, discount_value, min_order_amount, max_discount_amount, usage_limit, start_date, end_date, is_active)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [code, discountType, discountValue, minOrderAmount, maxDiscountAmount, usageLimit, startDate, endDate, isActive ? 1 : 0]
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
// 9. CUSTOMER EXPORT (READ-ONLY FOR SECURITY)
// =========================================================================
exports.exportCustomers = async (req, res, next) => {
  try {
    const [customers] = await pool.query(`
      SELECT u.id, u.full_name, u.email, u.phone, u.city, u.state, u.pincode, u.wallet_balance, u.status, u.role, u.created_at,
             COUNT(o.id) as total_orders, COALESCE(SUM(o.total_amount), 0) as total_spent
      FROM users u
      LEFT JOIN orders o ON u.id = o.user_id
      WHERE u.role = 'ROLE_CUSTOMER' OR u.role IS NULL
      GROUP BY u.id
      ORDER BY u.id DESC
    `);

    const rows = customers.map(c => ({
      'Customer ID': c.id,
      'Full Name': c.full_name || '',
      'Email Address': c.email || '',
      'Phone Number': c.phone || '',
      'City': c.city || '',
      'State': c.state || '',
      'Pincode': c.pincode || '',
      'Total Orders': parseInt(c.total_orders || 0, 10),
      'Total Spent Amount (₹)': parseFloat(c.total_spent || 0),
      'Wallet Balance (₹)': parseFloat(c.wallet_balance || 0),
      'Account Status': c.status || 'Active',
      'Registered Date': c.created_at || ''
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
// 10. ORDER EXPORT (MULTI-SHEET WORKBOOK)
// =========================================================================
exports.exportOrders = async (req, res, next) => {
  try {
    const [orders] = await pool.query(`
      SELECT o.*, u.full_name as user_full_name, u.email as user_email, u.phone as user_phone
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      ORDER BY o.id DESC
    `);

    const ordersRows = [];
    const itemsRows = [];

    for (const o of orders) {
      const orderCode = o.order_code || o.orderCode || `#ORD${o.id}`;
      ordersRows.push({
        'Order ID': o.id,
        'Order Code': orderCode,
        'Customer Name': o.user_full_name || o.customer_name || 'Guest Customer',
        'Customer Email': o.user_email || o.email || '',
        'Customer Phone': o.user_phone || o.phone || '',
        'Shipping Address': o.shipping_address || o.address || '',
        'City': o.city || '',
        'Pincode': o.pincode || '',
        'Total Amount (₹)': parseFloat(o.total_amount || 0),
        'Payment Method': o.payment_method || 'COD',
        'Payment Status': o.payment_status || 'Pending',
        'Order Status': o.status || 'PENDING',
        'Courier Partner': o.courier_name || '',
        'Tracking Number': o.tracking_number || '',
        'Order Date': o.created_at || ''
      });

      const [items] = await pool.query('SELECT * FROM order_items WHERE order_id = ?', [o.id]);
      items.forEach(it => {
        itemsRows.push({
          'Order Code': orderCode,
          'Product SKU': it.product_sku || it.sku || '',
          'Product Name': it.product_name || it.name || '',
          'Quantity': parseInt(it.quantity || 1, 10),
          'Unit Price (₹)': parseFloat(it.price || 0),
          'Item Total (₹)': parseFloat((it.price || 0) * (it.quantity || 1))
        });
      });
    }

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(ordersRows), 'ORDERS');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(itemsRows), 'ORDER ITEMS');

    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="karviyam_orders_export.xlsx"');
    return res.status(200).send(buf);
  } catch (err) {
    next(err);
  }
};
