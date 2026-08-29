const pool = require('../config/db');
const ApiResponse = require('../utils/apiResponse');
const XLSX = require('xlsx');
const { mapProductRowToDTO } = require('./productController');

// Build domain base from environment variables or default to Karviyam domain
const getAppBaseUrl = () => {
  const envUrl = process.env.APP_URL || process.env.BACKEND_URL || process.env.FRONTEND_URL;
  if (envUrl && envUrl.startsWith('http')) {
    return envUrl.replace(/\/$/, '');
  }
  return 'https://karviyam.com';
};

// Converts relative database image paths into full, permanent public URLs
const resolvePermanentImageUrl = (url) => {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (!trimmed) return '';

  // Filter out temporary blob and data URLs
  if (trimmed.startsWith('blob:') || trimmed.startsWith('data:')) return '';

  // If already an absolute HTTP or HTTPS URL, return as is
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }

  // Prepend base URL for relative paths (/uploads/... or uploads/...)
  const baseUrl = getAppBaseUrl();
  const cleanPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return `${baseUrl}${cleanPath}`;
};

// Universal Image URL Validator and Extractor
const validateAndExtractImageUrl = (val, fieldName = 'Image URL') => {
  if (val === undefined || val === null) return { isValid: true, cleanUrl: '', error: null };

  let rawStr = '';
  if (typeof val === 'object' && val !== null) {
    rawStr = val.Target || val.l?.Target || val.v || val.w || String(val);
  } else {
    rawStr = String(val);
  }

  const trimmed = rawStr.trim();
  if (!trimmed || trimmed === '[object Object]') return { isValid: true, cleanUrl: '', error: null };

  // 1. Filter out browser blob URLs and temporary base64 data URIs
  if (trimmed.startsWith('blob:') || trimmed.startsWith('data:')) {
    return {
      isValid: false,
      cleanUrl: '',
      error: `${fieldName} contains a temporary browser URL. Please provide a direct public image URL.`
    };
  }

  // 2. Handle Google Search / Google Images Result URLs
  if (trimmed.includes('google.com/search') || trimmed.includes('google.co.in/search') || trimmed.includes('google.com/url?') || trimmed.includes('google.com/imgres')) {
    try {
      const urlObj = new URL(trimmed);
      const directImg = urlObj.searchParams.get('imgurl') || urlObj.searchParams.get('url');
      if (directImg && directImg.startsWith('http')) {
        const decoded = decodeURIComponent(directImg);
        return { isValid: true, cleanUrl: decoded, error: null };
      }
    } catch (e) {}

    return {
      isValid: false,
      cleanUrl: '',
      error: `${fieldName} must be a direct public image URL (e.g. https://domain.com/image.jpg), not a Google Search results page.`
    };
  }

  // 3. Extract relative /uploads/ path for internal server images
  if (trimmed.includes('/uploads/')) {
    const idx = trimmed.indexOf('/uploads/');
    return { isValid: true, cleanUrl: trimmed.substring(idx), error: null };
  }

  return { isValid: true, cleanUrl: trimmed, error: null };
};

// Sanitizes imported Excel image URLs for safe database storage
const sanitizeImportImageUrl = (url, fieldName = 'Image') => {
  const result = validateAndExtractImageUrl(url, fieldName);
  return result.isValid ? result.cleanUrl : '';
};

// Helper to look up an Excel row value matching any alias normalized by removing spaces, underscores, hyphens & casing
const getNormalizedRowValue = (row, keyAliases, defaultVal = '') => {
  if (!row || typeof row !== 'object') return defaultVal;

  const normalizedAliases = keyAliases.map(k => String(k).toLowerCase().replace(/[^a-z0-9]/g, ''));
  const rowKeys = Object.keys(row);

  for (const rawKey of rowKeys) {
    const normKey = rawKey.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (normalizedAliases.includes(normKey)) {
      const val = row[rawKey];
      if (val !== undefined && val !== null) {
        if (typeof val === 'object') {
          const targetUrl = val.Target || val.l?.Target || val.v || val.w;
          if (targetUrl && String(targetUrl).trim() !== '') return targetUrl;
        } else if (String(val).trim() !== '') {
          return val;
        }
      }
    }
  }

  return defaultVal;
};

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

  const productMainImg = resolvePermanentImageUrl(p.image_url || p.image || dto?.images?.[0]);
  const productSubImgs = (dto?.images || []).filter(img => img && resolvePermanentImageUrl(img) !== productMainImg);

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
    'Meta Description': p.meta_description || p.description || '',

    // Product Base Media
    'Main Product Image': productMainImg,
    'Sub Image 1': resolvePermanentImageUrl(productSubImgs[0]),
    'Sub Image 2': resolvePermanentImageUrl(productSubImgs[1]),
    'Sub Image 3': resolvePermanentImageUrl(productSubImgs[2]),
    'Sub Image 4': resolvePermanentImageUrl(productSubImgs[3]),
    'Sub Image 5': resolvePermanentImageUrl(productSubImgs[4]),
    'Sub Image 6': resolvePermanentImageUrl(productSubImgs[5]),
    'Product Video': resolvePermanentImageUrl(p.video_url || dto?.videoUrl || '')
  };

  // 2. Color 1 to Color 10 Fields AT THE VERY END
  const colors = dto?.colors || [];
  for (let c = 1; c <= 10; c++) {
    const col = colors[c - 1];
    if (col) {
      row[`Color ${c} Name`] = col.colorName || '';
      row[`Color ${c} Hex`] = col.colorCode || col.hexCode || '#000000';
      row[`Color ${c} Default`] = Boolean(col.isDefault);
      row[`Color ${c} Main Image`] = resolvePermanentImageUrl(col.mainImage);

      const subImgs = Array.isArray(col.subImages) ? col.subImages : [];
      for (let s = 1; s <= 6; s++) {
        row[`Color ${c} Sub Image ${s}`] = resolvePermanentImageUrl(subImgs[s - 1]);
      }
      row[`Color ${c} Video`] = resolvePermanentImageUrl(col.videoUrl);
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
            'Media URL': resolvePermanentImageUrl(col.mainImage)
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
              'Media URL': resolvePermanentImageUrl(subUrl)
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
            'Media URL': resolvePermanentImageUrl(col.videoUrl)
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
      { Column: 'Main Product Image', Required: 'OPTIONAL', Type: 'URL/Path', Example: 'https://karviyam.com/uploads/products/main.jpg', Description: 'Permanent public URL of main image.' },
      { Column: 'Sub Image 1..6', Required: 'OPTIONAL', Type: 'URL/Path', Example: 'https://karviyam.com/uploads/products/sub1.jpg', Description: 'Permanent public URLs for gallery sub images.' },
      { Column: 'Color 1..10 Name', Required: 'OPTIONAL', Type: 'Text', Example: 'Crimson Red', Description: 'Color variant name (located in the last columns).' },
      { Column: 'Color 1..10 Main Image', Required: 'OPTIONAL', Type: 'URL/Path', Example: 'https://karviyam.com/uploads/products/red-main.jpg', Description: 'Main image URL for color variant.' },
      { Column: 'Color 1..10 Sub Image 1..6', Required: 'OPTIONAL', Type: 'URL/Path', Example: 'https://karviyam.com/uploads/products/red-sub1.jpg', Description: 'Sub images 1 to 6 for color variant.' },
      { Column: 'Color 1..10 Video', Required: 'OPTIONAL', Type: 'URL/Path', Example: 'https://karviyam.com/uploads/products/video.mp4', Description: 'Product video URL for color variant.' }
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
      image_url: '/uploads/demo-main.jpg',
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
      images: ['/uploads/demo-main.jpg', '/uploads/demo-sub1.jpg', '/uploads/demo-sub2.jpg'],
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
      { 'SKU Code': 'KV-DEMO-001', 'Color Name': 'Crimson Red', 'Media Type': 'image', 'Sort Order': 1, 'Is Main': true, 'Media URL': resolvePermanentImageUrl('/uploads/red-main.jpg') },
      { 'SKU Code': 'KV-DEMO-001', 'Color Name': 'Crimson Red', 'Media Type': 'image', 'Sort Order': 2, 'Is Main': false, 'Media URL': resolvePermanentImageUrl('/uploads/red-sub1.jpg') },
      { 'SKU Code': 'KV-DEMO-001', 'Color Name': 'Crimson Red', 'Media Type': 'video', 'Sort Order': 99, 'Is Main': false, 'Media URL': resolvePermanentImageUrl('/uploads/red-video.mp4') },
      { 'SKU Code': 'KV-DEMO-001', 'Color Name': 'Obsidian Black', 'Media Type': 'image', 'Sort Order': 1, 'Is Main': true, 'Media URL': resolvePermanentImageUrl('/uploads/black-main.jpg') }
    ];

    const fieldGuideRows = [
      { Column: 'SKU Code', Required: 'REQUIRED', Type: 'Text', Example: 'KV-DEMO-001', Description: 'Unique identifier. Used to match and update existing products.' },
      { Column: 'Product Name', Required: 'REQUIRED', Type: 'Text', Example: 'Silk Kurta', Description: 'Product title displayed to customers.' },
      { Column: 'Selling Price', Required: 'REQUIRED', Type: 'Number', Example: '1299', Description: 'Final retail price in INR.' },
      { Column: 'MRP Price', Required: 'OPTIONAL', Type: 'Number', Example: '1999', Description: 'Maximum retail price.' },
      { Column: 'Stock Quantity', Required: 'REQUIRED', Type: 'Number', Example: '50', Description: 'Available stock.' },
      { Column: 'Main Product Image', Required: 'OPTIONAL', Type: 'URL/Path', Example: 'https://karviyam.com/uploads/products/main.jpg', Description: 'Main product display image.' },
      { Column: 'Color 1..10 Name', Required: 'OPTIONAL', Type: 'Text', Example: 'Emerald Green', Description: 'Color variant name (located in the last columns).' },
      { Column: 'Color 1..10 Main Image', Required: 'OPTIONAL', Type: 'URL/Path', Example: 'https://karviyam.com/uploads/products/green-main.jpg', Description: 'Main image for color variant.' },
      { Column: 'Color 1..10 Video', Required: 'OPTIONAL', Type: 'URL/Path', Example: 'https://karviyam.com/uploads/products/green-video.mp4', Description: 'Product video URL for color variant.' }
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
// 3. PRODUCT IMPORT PREVIEW & VALIDATION (NORMALIZED HEADERS)
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
      const sku = String(getNormalizedRowValue(row, ['SKU Code', 'SKU', 'sku_code', 'SKUCode', 'Product SKU', 'Item SKU'])).trim();
      const name = String(getNormalizedRowValue(row, ['Product Name', 'Name', 'product_name', 'Title', 'Item Name'])).trim();
      const priceVal = getNormalizedRowValue(row, ['Selling Price', 'Price', 'selling_price', 'Selling Price (₹)', 'Retail Price']);
      const stockVal = getNormalizedRowValue(row, ['Stock Quantity', 'Stock', 'stock_quantity', 'Quantity', 'Qty'], 0);

      const price = parseFloat(priceVal);
      const stock = parseInt(stockVal, 10);

      const rowErrors = [];

      if (!sku) {
        rowErrors.push('SKU Code is required.');
      }
      if (!name) {
        rowErrors.push('Product Name is required.');
      }
      if (priceVal === '' || isNaN(price) || price < 0) {
        rowErrors.push('Selling Price must be a valid positive number.');
      }
      if (isNaN(stock) || stock < 0) {
        rowErrors.push('Stock Quantity must be a non-negative integer.');
      }

      // Validate image URLs (must not be temporary browser blob/data URLs)
      const mainImg = getNormalizedRowValue(row, ['Main Product Image', 'Image URL', 'image_url', 'Main Image']);
      if (mainImg && (String(mainImg).startsWith('blob:') || String(mainImg).startsWith('data:'))) {
        rowErrors.push(`Main Product Image contains invalid temporary browser URL (${mainImg.substring(0, 15)}...). Only permanent URLs are allowed.`);
      }

      for (let c = 1; c <= 10; c++) {
        const cImg = getNormalizedRowValue(row, [`Color ${c} Main Image`, `Color${c}MainImage`]);
        if (cImg && (String(cImg).startsWith('blob:') || String(cImg).startsWith('data:'))) {
          rowErrors.push(`Color ${c} Main Image contains invalid temporary browser URL (${cImg.substring(0, 15)}...). Only permanent URLs are allowed.`);
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

    try { await connection.query("ALTER TABLE products ADD COLUMN sizes VARCHAR(255)"); } catch (e) {}
    try { await connection.query("ALTER TABLE products ADD COLUMN size VARCHAR(255)"); } catch (e) {}
    try { await connection.query("ALTER TABLE products ADD COLUMN is_bestseller BOOLEAN DEFAULT FALSE"); } catch (e) {}
    try { await connection.query("ALTER TABLE products ADD COLUMN seo_title VARCHAR(255)"); } catch (e) {}
    try { await connection.query("ALTER TABLE products ADD COLUMN meta_keywords VARCHAR(255)"); } catch (e) {}
    try { await connection.query("ALTER TABLE products ADD COLUMN meta_description TEXT"); } catch (e) {}

    await connection.beginTransaction();

    for (let idx = 0; idx < rawProducts.length; idx++) {
      const row = rawProducts[idx];
      const sku = String(getNormalizedRowValue(row, ['SKU Code', 'SKU', 'sku_code', 'SKUCode', 'Product SKU', 'Item SKU'])).trim();
      const name = String(getNormalizedRowValue(row, ['Product Name', 'Name', 'product_name', 'Title', 'Item Name'])).trim();
      const priceVal = getNormalizedRowValue(row, ['Selling Price', 'Price', 'selling_price', 'Selling Price (₹)', 'Retail Price']);
      const oldPriceVal = getNormalizedRowValue(row, ['MRP Price', 'MRP', 'old_price', 'MRP (₹)', 'Original Price'], priceVal);
      const stockVal = getNormalizedRowValue(row, ['Stock Quantity', 'Stock', 'stock_quantity', 'Quantity', 'Qty'], 0);

      const price = parseFloat(priceVal);
      const oldPrice = parseFloat(oldPriceVal);
      const stock = parseInt(stockVal, 10);

      const categoryName = String(getNormalizedRowValue(row, ['Main Category', 'Category Name', 'Category', 'category_name'], 'Apparel')).trim();
      const subcategory = String(getNormalizedRowValue(row, ['Subcategory', 'Sub Category', 'subcategory_name'], '')).trim();
      const brand = String(getNormalizedRowValue(row, ['Brand', 'Brand Name', 'Manufacturer'], 'Karviyam')).trim();
      const sizes = String(getNormalizedRowValue(row, ['Available Sizes', 'Sizes', 'Size'], 'S, M, L, XL, XXL')).trim();
      const material = String(getNormalizedRowValue(row, ['Material / Fabric', 'Material', 'Fabric'], 'Cotton Blend')).trim();
      const description = String(getNormalizedRowValue(row, ['Description', 'desc', 'detail'], '')).trim();
      const tags = String(getNormalizedRowValue(row, ['Tags', 'keywords'], '')).trim();
      const isFeatured = parseBool(getNormalizedRowValue(row, ['Featured Product', 'isFeatured', 'is_featured']), false);
      const isTrending = parseBool(getNormalizedRowValue(row, ['Trending Product', 'isTrending', 'is_trending']), false);
      const isBestseller = parseBool(getNormalizedRowValue(row, ['Best Seller', 'isBestseller', 'is_bestseller']), false);
      const isNewArrival = parseBool(getNormalizedRowValue(row, ['New Arrival', 'isNewArrival', 'is_new_arrival']), true);
      const isActive = parseBool(getNormalizedRowValue(row, ['Active Catalog Status', 'Active Status', 'isActive', 'is_active']), true);
      const seoTitle = String(getNormalizedRowValue(row, ['SEO Title', 'seo_title'], name)).trim();
      const metaKeywords = String(getNormalizedRowValue(row, ['Meta Keywords', 'meta_keywords'], tags)).trim();
      const metaDescription = String(getNormalizedRowValue(row, ['Meta Description', 'meta_description'], description)).trim();

      const mainProductImage = sanitizeImportImageUrl(getNormalizedRowValue(row, ['Main Product Image', 'Image URL', 'image_url', 'Main Image']));
      const videoUrl = sanitizeImportImageUrl(getNormalizedRowValue(row, ['Product Video', 'video_url', 'Video URL']));

      if (!sku || !name || priceVal === '' || isNaN(price)) {
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
      const [existing] = await connection.query('SELECT * FROM products WHERE LOWER(sku) = ? LIMIT 1', [sku.toLowerCase()]);

      let productId;
      if (existing.length > 0) {
        productId = existing[0].id;
        const currentProd = existing[0];
        const finalImage = mainProductImage !== '' ? mainProductImage : currentProd.image_url;
        const finalVideo = videoUrl !== '' ? videoUrl : currentProd.video_url;

        // Non-destructive update: Update product normal fields first
        await connection.query(
          `UPDATE products SET 
           category_id = ?, name = ?, description = ?, price = ?, old_price = ?, stock_quantity = ?,
           image_url = ?, video_url = ?, brand = ?, sizes = ?, material = ?, tags = ?, is_featured = ?, is_trending = ?,
           is_bestseller = ?, is_new_arrival = ?, is_active = ?, seo_title = ?, meta_keywords = ?,
           meta_description = ?
           WHERE id = ?`,
          [
            categoryId, name, description, price, oldPrice, stock, finalImage, finalVideo, brand, sizes, material, tags,
            isFeatured ? 1 : 0, isTrending ? 1 : 0, isBestseller ? 1 : 0, isNewArrival ? 1 : 0,
            isActive ? 1 : 0, seoTitle, metaKeywords, metaDescription, productId
          ]
        );
        updatedCount++;
      } else {
        // Insert new product
        const [insertRes] = await connection.query(
          `INSERT INTO products 
           (category_id, name, sku, description, price, old_price, stock_quantity, image_url, video_url, brand, sizes, material, tags,
            is_featured, is_trending, is_bestseller, is_new_arrival, is_active, seo_title, meta_keywords, meta_description, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
          [
            categoryId, name, sku, description, price, oldPrice, stock, mainProductImage, videoUrl, brand, sizes, material, tags,
            isFeatured ? 1 : 0, isTrending ? 1 : 0, isBestseller ? 1 : 0, isNewArrival ? 1 : 0,
            isActive ? 1 : 0, seoTitle, metaKeywords, metaDescription
          ]
        );
        productId = insertRes.insertId;
        createdCount++;
      }

      // Base Sub Images processing (Sub Image 1..6)
      const baseSubImages = [];
      for (let s = 1; s <= 6; s++) {
        const sUrl = sanitizeImportImageUrl(getNormalizedRowValue(row, [`Sub Image ${s}`, `SubImage${s}`, `Sub Image${s}`]));
        if (sUrl) baseSubImages.push(sUrl);
      }
      if (baseSubImages.length > 0) {
        await connection.query('DELETE FROM product_images WHERE product_id = ? AND is_main = 0', [productId]);
        for (let sIdx = 0; sIdx < baseSubImages.length; sIdx++) {
          await connection.query(
            'INSERT INTO product_images (product_id, image_url, is_main, sort_order) VALUES (?, ?, 0, ?)',
            [productId, baseSubImages[sIdx], sIdx + 2]
          );
        }
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
          const cName = String(getNormalizedRowValue(cRow, ['Color Name', 'Color'])).trim();
          const cCode = String(getNormalizedRowValue(cRow, ['Color Code', 'Color Hex', 'Hex'], '#000000')).trim();
          const isDefault = parseBool(getNormalizedRowValue(cRow, ['Is Default', 'Default']), false);

          const cMedia = relMedia.filter(m => String(getNormalizedRowValue(m, ['Color Name', 'Color'])).trim().toLowerCase() === cName.toLowerCase());
          const mainMedia = cMedia.find(m => parseBool(getNormalizedRowValue(m, ['Is Main', 'Main'])) || getNormalizedRowValue(m, ['Sort Order']) === 1);
          const subMedia = cMedia.filter(m => m !== mainMedia && String(getNormalizedRowValue(m, ['Media Type'])).toLowerCase() !== 'video');
          const videoMedia = cMedia.find(m => String(getNormalizedRowValue(m, ['Media Type'])).toLowerCase() === 'video');

          if (cName || (mainMedia && mainMedia['Media URL'])) {
            parsedColors.push({
              colorName: cName || 'Standard',
              colorCode: cCode,
              isDefault,
              mainImage: mainMedia ? sanitizeImportImageUrl(getNormalizedRowValue(mainMedia, ['Media URL', 'URL'])) : '',
              subImages: subMedia.map(sm => sanitizeImportImageUrl(getNormalizedRowValue(sm, ['Media URL', 'URL']))).filter(Boolean),
              videoUrl: videoMedia ? sanitizeImportImageUrl(getNormalizedRowValue(videoMedia, ['Media URL', 'URL'])) : ''
            });
          }
        });
      }

      // Flat format columns at the end of row (Color 1 Name ... Color 10 Video)
      if (parsedColors.length === 0) {
        for (let c = 1; c <= 20; c++) {
          const cName = String(getNormalizedRowValue(row, [`Color ${c} Name`, `Color${c}Name`, `Color ${c}`])).trim();
          const cCode = String(getNormalizedRowValue(row, [`Color ${c} Hex`, `Color ${c} Code`, `Color${c}Hex`], '#000000')).trim();
          const mainImg = sanitizeImportImageUrl(getNormalizedRowValue(row, [`Color ${c} Main Image`, `Color${c}MainImage`]));
          const isDef = parseBool(getNormalizedRowValue(row, [`Color ${c} Default`, `Color ${c} Is Default`]), c === 1);

          const subImgs = [];
          for (let s = 1; s <= 6; s++) {
            const subUrl = sanitizeImportImageUrl(getNormalizedRowValue(row, [`Color ${c} Sub Image ${s}`, `Color${c}SubImage${s}`]));
            if (subUrl) subImgs.push(subUrl);
          }
          const cVideo = sanitizeImportImageUrl(getNormalizedRowValue(row, [`Color ${c} Video`, `Color${c}Video`]));

          // RULES: Create ONLY colors that actually contain data.
          const hasData = cName !== '' || mainImg !== '' || subImgs.length > 0;
          if (hasData) {
            parsedColors.push({
              colorName: cName || `Color ${c}`,
              colorCode: cCode || '#000000',
              isDefault: isDef,
              mainImage: mainImg,
              subImages: subImgs,
              videoUrl: cVideo
            });
          }
        }
      }

      // RULES: If parsedColors contains new color data, update color variants.
      // If parsedColors.length === 0, DO NOT RESET OR DELETE PREVIOUSLY SAVED COLORS!
      if (parsedColors.length > 0) {
        // Delete existing color records before re-inserting updated color variants
        const [oldColors] = await connection.query('SELECT id FROM product_colors WHERE product_id = ?', [productId]);
        for (const oc of oldColors) {
          await connection.query('DELETE FROM product_color_images WHERE product_color_id = ? OR color_id = ?', [oc.id, oc.id]).catch(() => null);
        }
        await connection.query('DELETE FROM product_colors WHERE product_id = ?', [productId]);

        // Insert colors maintaining exact order, main image, sub images & video
        for (let cIdx = 0; cIdx < parsedColors.length; cIdx++) {
          const c = parsedColors[cIdx];
          const isDefaultVal = c.isDefault || (cIdx === 0 && !parsedColors.some(pc => pc.isDefault));

          try { await connection.query("ALTER TABLE product_colors ADD COLUMN hex_code VARCHAR(50)"); } catch (e) {}
          try { await connection.query("ALTER TABLE product_colors ADD COLUMN is_default BOOLEAN DEFAULT FALSE"); } catch (e) {}
          try { await connection.query("ALTER TABLE product_colors ADD COLUMN image_url VARCHAR(500)"); } catch (e) {}
          try { await connection.query("ALTER TABLE product_colors ADD COLUMN main_image VARCHAR(500)"); } catch (e) {}
          try { await connection.query("ALTER TABLE product_colors ADD COLUMN video_url VARCHAR(500)"); } catch (e) {}

          const [cRes] = await connection.query(
            `INSERT INTO product_colors (product_id, color_name, color_code, hex_code, is_default, image_url, main_image, video_url)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [productId, c.colorName, c.colorCode, c.colorCode, isDefaultVal ? 1 : 0, c.mainImage || null, c.mainImage || null, c.videoUrl || null]
          );
          const colorId = cRes.insertId;

          try { await connection.query("ALTER TABLE product_color_images ADD COLUMN product_color_id BIGINT"); } catch (e) {}
          try { await connection.query("ALTER TABLE product_color_images ADD COLUMN color_id BIGINT"); } catch (e) {}
          try { await connection.query("ALTER TABLE product_color_images ADD COLUMN is_main BOOLEAN DEFAULT FALSE"); } catch (e) {}
          try { await connection.query("ALTER TABLE product_color_images ADD COLUMN sort_order INT DEFAULT 0"); } catch (e) {}

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
      'Parent Category Image': resolvePermanentImageUrl(c.parent_image_url),
      'Classification Type': c.type || c.classification || 'General',
      'Display Order': c.sort_order || c.order_index || c.display_order || 0,
      'Active Status': c.is_active !== 0,
      'Main Image': resolvePermanentImageUrl(c.image_url || c.image_path || c.image),
      'Category Icon': resolvePermanentImageUrl(c.icon_url || c.icon_path || c.icon),
      'Category Banner': resolvePermanentImageUrl(c.banner_url || c.banner_path || c.banner),
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

exports.downloadCategoryTemplate = async (req, res, next) => {
  try {
    const sampleRows = [
      {
        'Category Name': 'Sneakers',
        'Parent Category Name': 'Footwear',
        'Classification Type': 'MEN',
        'Display Order': 1,
        'Active Status': 'Yes',
        'Main Image': 'https://karviyam.com/uploads/categories/sneakers-main.jpg',
        'Category Icon': 'https://karviyam.com/uploads/categories/sneakers-icon.png',
        'Category Banner': 'https://karviyam.com/uploads/categories/sneakers-banner.jpg',
        'Description': 'Premium streetwear sneakers',
        'SEO Title': 'Streetwear Sneakers Collection | Karviyam',
        'Meta Keywords': 'sneakers, streetwear, shoes',
        'Meta Description': 'Shop exclusive premium sneakers on Karviyam.'
      }
    ];

    const guideRows = [
      { Column: 'Category Name', Required: 'REQUIRED', Type: 'Text', Example: 'Sneakers', Description: 'Unique category title.' },
      { Column: 'Parent Category Name', Required: 'OPTIONAL', Type: 'Text', Example: 'Footwear', Description: 'Parent category name if sub-category.' },
      { Column: 'Classification Type', Required: 'REQUIRED', Type: 'Text', Example: 'MEN / WOMEN / UNISEX / GENERAL', Description: 'Target collection classification.' },
      { Column: 'Display Order', Required: 'OPTIONAL', Type: 'Number', Example: '1', Description: 'Sorting index on storefront.' },
      { Column: 'Active Status', Required: 'OPTIONAL', Type: 'Boolean', Example: 'Yes / No', Description: 'Enable or disable category visibility.' },
      { Column: 'Main Image', Required: 'OPTIONAL', Type: 'URL/Path', Example: 'https://domain.com/images/cat-main.jpg', Description: 'Direct publicly accessible image URL. Do NOT paste Google Search page URLs.' },
      { Column: 'Category Icon', Required: 'OPTIONAL', Type: 'URL/Path', Example: 'https://domain.com/images/cat-icon.png', Description: 'Direct publicly accessible icon URL. Must be an independent image file.' },
      { Column: 'Category Banner', Required: 'OPTIONAL', Type: 'URL/Path', Example: 'https://domain.com/images/cat-banner.jpg', Description: 'Direct publicly accessible banner URL. Must be an independent image file.' }
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(sampleRows), 'CATEGORIES');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(guideRows), 'FIELD GUIDE');

    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="karviyam_official_categories_template.xlsx"');
    return res.status(200).send(buf);
  } catch (err) {
    next(err);
  }
};

exports.previewCategoryImport = async (req, res, next) => {
  try {
    let workbook;
    if (req.file) {
      workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    } else if (req.body.fileBase64) {
      const base64Data = req.body.fileBase64.replace(/^data:.+;base64,/, '');
      workbook = XLSX.read(Buffer.from(base64Data, 'base64'), { type: 'buffer' });
    } else {
      return res.status(400).json(ApiResponse.error('No Excel file provided'));
    }

    const sheetName = workbook.SheetNames[0];
    const rawRows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

    const previewRows = [];
    let validRows = 0;
    let invalidRows = 0;

    for (let idx = 0; idx < rawRows.length; idx++) {
      const r = rawRows[idx];
      const rowNum = idx + 2;
      const name = String(getNormalizedRowValue(r, ['Category Name', 'Name', 'category_name'])).trim();

      let status = 'VALID';
      let problem = '';
      let field = '';

      if (!name) {
        status = 'ERROR';
        field = 'Category Name';
        problem = 'Category Name is required.';
      } else {
        const rawMain = getNormalizedRowValue(r, ['Main Image', 'Image URL', 'image_url', 'main_image']);
        const rawIcon = getNormalizedRowValue(r, ['Category Icon', 'Icon URL', 'icon_url', 'category_icon']);
        const rawBanner = getNormalizedRowValue(r, ['Category Banner', 'Banner URL', 'banner_url', 'category_banner']);

        const mainCheck = validateAndExtractImageUrl(rawMain, 'Main Image');
        const iconCheck = validateAndExtractImageUrl(rawIcon, 'Category Icon');
        const bannerCheck = validateAndExtractImageUrl(rawBanner, 'Category Banner');

        if (!mainCheck.isValid) {
          status = 'ERROR';
          field = 'Main Image';
          problem = mainCheck.error;
        } else if (!iconCheck.isValid) {
          status = 'ERROR';
          field = 'Category Icon';
          problem = iconCheck.error;
        } else if (!bannerCheck.isValid) {
          status = 'ERROR';
          field = 'Category Banner';
          problem = bannerCheck.error;
        }
      }

      if (status === 'VALID') validRows++;
      else invalidRows++;

      previewRows.push({
        rowNumber: rowNum,
        name: name || 'N/A',
        status,
        field,
        problem
      });
    }

    return res.status(200).json(ApiResponse.success({
      summary: {
        totalRows: rawRows.length,
        validRows,
        invalidRows
      },
      rows: previewRows
    }, 'Category import preview generated successfully'));
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
    let failedCount = 0;
    const failedRows = [];

    for (let idx = 0; idx < rawRows.length; idx++) {
      const r = rawRows[idx];
      const rowNum = idx + 2;
      const name = String(getNormalizedRowValue(r, ['Category Name', 'Name', 'category_name'])).trim();
      if (!name) {
        failedCount++;
        failedRows.push({ rowNumber: rowNum, sku: 'N/A', field: 'Category Name', problem: 'Category Name is required.' });
        continue;
      }

      const rawMain = getNormalizedRowValue(r, ['Main Image', 'Image URL', 'image_url', 'main_image']);
      const rawIcon = getNormalizedRowValue(r, ['Category Icon', 'Icon URL', 'icon_url', 'category_icon']);
      const rawBanner = getNormalizedRowValue(r, ['Category Banner', 'Banner URL', 'banner_url', 'category_banner']);

      const mainCheck = validateAndExtractImageUrl(rawMain, 'Main Image');
      const iconCheck = validateAndExtractImageUrl(rawIcon, 'Category Icon');
      const bannerCheck = validateAndExtractImageUrl(rawBanner, 'Category Banner');

      if (!mainCheck.isValid) {
        failedCount++;
        failedRows.push({ rowNumber: rowNum, sku: name, field: 'Main Image', problem: mainCheck.error });
        continue;
      }
      if (!iconCheck.isValid) {
        failedCount++;
        failedRows.push({ rowNumber: rowNum, sku: name, field: 'Category Icon', problem: iconCheck.error });
        continue;
      }
      if (!bannerCheck.isValid) {
        failedCount++;
        failedRows.push({ rowNumber: rowNum, sku: name, field: 'Category Banner', problem: bannerCheck.error });
        continue;
      }

      const mainImage = mainCheck.cleanUrl;
      const iconUrl = iconCheck.cleanUrl;
      const bannerUrl = bannerCheck.cleanUrl;

      const parentName = String(getNormalizedRowValue(r, ['Parent Category Name', 'Parent Category', 'parent_name'])).trim();
      const parentImage = sanitizeImportImageUrl(getNormalizedRowValue(r, ['Parent Category Image', 'parent_image']));
      const type = String(getNormalizedRowValue(r, ['Classification Type', 'Type', 'classification'], 'General')).trim();
      const displayOrder = parseInt(getNormalizedRowValue(r, ['Display Order', 'Sort Order', 'Order Index', 'order_index', 'sort_order'], 0), 10);
      const isActive = parseBool(getNormalizedRowValue(r, ['Active Status', 'Status', 'is_active'], true), true);
      const description = String(getNormalizedRowValue(r, ['Description', 'desc', 'detail'], '')).trim();
      const seoTitle = String(getNormalizedRowValue(r, ['SEO Title', 'seo_title'], name)).trim();
      const metaKeywords = String(getNormalizedRowValue(r, ['Meta Keywords', 'meta_keywords'], '')).trim();
      const metaDescription = String(getNormalizedRowValue(r, ['Meta Description', 'meta_description'], description)).trim();

      // Resolve Parent Category
      let parentId = null;
      if (parentName) {
        const [parents] = await pool.query('SELECT id, image_url FROM categories WHERE LOWER(name) = ? LIMIT 1', [parentName.toLowerCase()]);
        if (parents.length > 0) {
          parentId = parents[0].id;
          if (parentImage) {
            await pool.query('UPDATE categories SET image_url = ? WHERE id = ?', [parentImage, parentId]);
          }
        }
      }

      // Check if category exists
      const [existing] = await pool.query('SELECT * FROM categories WHERE LOWER(name) = ? LIMIT 1', [name.toLowerCase()]);

      if (existing.length > 0) {
        const curCat = existing[0];
        const finalMainImage = mainImage !== '' ? mainImage : curCat.image_url;
        const finalIconUrl = iconUrl !== '' ? iconUrl : curCat.icon_url;
        const finalBannerUrl = bannerUrl !== '' ? bannerUrl : curCat.banner_url;

        await pool.query(
          `UPDATE categories SET 
           parent_id = ?, type = ?, sort_order = ?, order_index = ?, is_active = ?, image_url = ?, icon_url = ?, banner_url = ?,
           description = ?, seo_title = ?, meta_keywords = ?, meta_description = ?
           WHERE id = ?`,
          [parentId, type, displayOrder, displayOrder, isActive ? 1 : 0, finalMainImage, finalIconUrl, finalBannerUrl, description, seoTitle, metaKeywords, metaDescription, curCat.id]
        );
        updatedCount++;
      } else {
        await pool.query(
          `INSERT INTO categories 
           (name, parent_id, type, sort_order, order_index, is_active, image_url, icon_url, banner_url, description, seo_title, meta_keywords, meta_description)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [name, parentId, type, displayOrder, displayOrder, isActive ? 1 : 0, mainImage, iconUrl, bannerUrl, description, seoTitle, metaKeywords, metaDescription]
        );
        createdCount++;
      }
    }

    return res.status(200).json(ApiResponse.success({ createdCount, updatedCount, failedCount, failedRows }, 'Category import completed successfully'));
  } catch (err) {
    next(err);
  }
};

// =========================================================================
// 7. BANNER EXPORT & IMPORT
// =========================================================================
exports.exportBanners = async (req, res, next) => {
  try {
    let banners = [];
    try {
      const [bRows] = await pool.query(`SELECT * FROM home_banners ORDER BY display_order ASC, sort_order ASC, id ASC`);
      banners = bRows;
    } catch (e) {
      try {
        const [bRows] = await pool.query(`SELECT * FROM banners ORDER BY id ASC`);
        banners = bRows;
      } catch (e2) {}
    }

    const rows = banners.map(b => ({
      'Banner ID': b.id,
      'Title': b.title || '',
      'Subtitle': b.subtitle || '',
      'Desktop Banner Image': resolvePermanentImageUrl(b.image_path || b.image_url),
      'Mobile Banner Image': resolvePermanentImageUrl(b.mobile_image_url || b.image_path || b.image_url),
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
      const desktopImage = sanitizeImportImageUrl(r['Desktop Banner Image'] || r['Desktop Image URL'] || r['image_path']);
      if (!title && !desktopImage) continue;

      const subtitle = String(r['Subtitle'] || '').trim();
      const mobileImage = sanitizeImportImageUrl(r['Mobile Banner Image'] || r['Mobile Image URL'] || desktopImage);
      const link = String(r['Target Link'] || '/shop').trim();
      const buttonText = String(r['Button Text'] || 'Shop Now').trim();
      const displayOrder = parseInt(r['Display Order'] || 1, 10);
      const isActive = parseBool(r['Active Status'], true);
      const status = isActive ? 'active' : 'inactive';

      let existing = [];
      try {
        const [eRows] = await pool.query('SELECT * FROM home_banners WHERE LOWER(title) = ? LIMIT 1', [title.toLowerCase()]);
        existing = eRows;
      } catch (e) {
        try {
          const [eRows] = await pool.query('SELECT * FROM banners WHERE LOWER(title) = ? LIMIT 1', [title.toLowerCase()]);
          existing = eRows;
        } catch (e2) {}
      }

      if (existing.length > 0) {
        const curB = existing[0];
        const finalDesk = desktopImage !== '' ? desktopImage : (curB.image_path || curB.image_url);
        const finalMob = mobileImage !== '' ? mobileImage : (curB.mobile_image_url || finalDesk);

        try {
          await pool.query(
            `UPDATE home_banners SET 
             subtitle = ?, image_path = ?, image_url = ?, mobile_image_url = ?, link = ?, button_link = ?,
             button_text = ?, display_order = ?, sort_order = ?, status = ?, is_active = ?
             WHERE id = ?`,
            [subtitle, finalDesk, finalDesk, finalMob, link, link, buttonText, displayOrder, displayOrder, status, isActive ? 1 : 0, curB.id]
          );
        } catch (e) {
          await pool.query(
            `UPDATE banners SET 
             subtitle = ?, image_path = ?, image_url = ?, mobile_image_url = ?, link = ?, button_link = ?,
             button_text = ?, display_order = ?, status = ?, is_active = ?
             WHERE id = ?`,
            [subtitle, finalDesk, finalDesk, finalMob, link, link, buttonText, displayOrder, status, isActive ? 1 : 0, curB.id]
          );
        }
        updatedCount++;
      } else {
        try {
          await pool.query(
            `INSERT INTO home_banners 
             (title, subtitle, image_path, image_url, mobile_image_url, link, button_link, button_text, display_order, sort_order, status, is_active)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [title, subtitle, desktopImage, desktopImage, mobileImage, link, link, buttonText, displayOrder, displayOrder, status, isActive ? 1 : 0]
          );
        } catch (e) {
          await pool.query(
            `INSERT INTO banners 
             (title, subtitle, image_path, image_url, mobile_image_url, link, button_link, button_text, display_order, status, is_active)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [title, subtitle, desktopImage, desktopImage, mobileImage, link, link, buttonText, displayOrder, status, isActive ? 1 : 0]
          );
        }
        createdCount++;
      }
    }

    return res.status(200).json(ApiResponse.success({ createdCount, updatedCount }, 'Banner import completed successfully'));
  } catch (err) {
    next(err);
  }
};

// =========================================================================
// 8. PARENT CATEGORY EXPORT & IMPORT
// =========================================================================
exports.exportParentCategories = async (req, res, next) => {
  try {
    let parents = [];
    try {
      const [pRows] = await pool.query(`SELECT * FROM parent_categories ORDER BY sort_order ASC, id ASC`);
      parents = pRows;
    } catch (e) {
      const [pRows] = await pool.query(`SELECT * FROM categories WHERE parent_id IS NULL ORDER BY sort_order ASC, id ASC`);
      parents = pRows;
    }

    const rows = parents.map(p => ({
      'Parent Category ID': p.id,
      'Parent Category Name': p.name || '',
      'Slug': p.slug || '',
      'Parent Category Image': resolvePermanentImageUrl(p.image_url || p.image_path || p.image),
      'Parent Category Icon': resolvePermanentImageUrl(p.icon_url || p.icon_path || p.icon),
      'Parent Category Banner': resolvePermanentImageUrl(p.banner_url || p.banner_path || p.banner),
      'Display Order': p.sort_order || p.order_index || 0,
      'Active Status': p.is_active !== 0
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, 'PARENT CATEGORIES');

    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="karviyam_parent_categories_export.xlsx"');
    return res.status(200).send(buf);
  } catch (err) {
    next(err);
  }
};

exports.importParentCategories = async (req, res, next) => {
  try {
    let workbook;
    if (req.file) {
      workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    } else if (req.body.fileBase64) {
      const base64Data = req.body.fileBase64.replace(/^data:.+;base64,/, '');
      workbook = XLSX.read(Buffer.from(base64Data, 'base64'), { type: 'buffer' });
    } else {
      return res.status(400).json(ApiResponse.error('No Excel file provided for parent category import'));
    }

    const sheetName = workbook.SheetNames[0];
    const rawRows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

    let createdCount = 0;
    let updatedCount = 0;

    for (const r of rawRows) {
      const name = String(r['Parent Category Name'] || r['name'] || '').trim();
      if (!name) continue;

      const mainImage = sanitizeImportImageUrl(r['Parent Category Image'] || r['image_url']);
      const iconUrl = sanitizeImportImageUrl(r['Parent Category Icon'] || r['icon_url']);
      const bannerUrl = sanitizeImportImageUrl(r['Parent Category Banner'] || r['banner_url']);
      const displayOrder = parseInt(r['Display Order'] || 0, 10);
      const isActive = parseBool(r['Active Status'], true);

      let existing = [];
      try {
        const [eRows] = await pool.query('SELECT * FROM parent_categories WHERE LOWER(name) = ? LIMIT 1', [name.toLowerCase()]);
        existing = eRows;
      } catch (e) {
        const [eRows] = await pool.query('SELECT * FROM categories WHERE parent_id IS NULL AND LOWER(name) = ? LIMIT 1', [name.toLowerCase()]);
        existing = eRows;
      }

      if (existing.length > 0) {
        const curP = existing[0];
        const finalImg = mainImage !== '' ? mainImage : curP.image_url;
        const finalIcon = iconUrl !== '' ? iconUrl : curP.icon_url;
        const finalBanner = bannerUrl !== '' ? bannerUrl : curP.banner_url;

        try {
          await pool.query(
            `UPDATE parent_categories SET image_url = ?, icon_url = ?, banner_url = ?, sort_order = ?, is_active = ? WHERE id = ?`,
            [finalImg, finalIcon, finalBanner, displayOrder, isActive ? 1 : 0, curP.id]
          );
        } catch (e) {
          await pool.query(
            `UPDATE categories SET image_url = ?, icon_url = ?, banner_url = ?, sort_order = ?, order_index = ?, is_active = ? WHERE id = ?`,
            [finalImg, finalIcon, finalBanner, displayOrder, displayOrder, isActive ? 1 : 0, curP.id]
          );
        }
        updatedCount++;
      } else {
        try {
          await pool.query(
            `INSERT INTO parent_categories (name, image_url, icon_url, banner_url, sort_order, is_active) VALUES (?, ?, ?, ?, ?, ?)`,
            [name, mainImage, iconUrl, bannerUrl, displayOrder, isActive ? 1 : 0]
          );
        } catch (e) {
          await pool.query(
            `INSERT INTO categories (name, parent_id, image_url, icon_url, banner_url, sort_order, order_index, is_active) VALUES (?, NULL, ?, ?, ?, ?, ?, ?)`,
            [name, mainImage, iconUrl, bannerUrl, displayOrder, displayOrder, isActive ? 1 : 0]
          );
        }
        createdCount++;
      }
    }

    return res.status(200).json(ApiResponse.success({ createdCount, updatedCount }, 'Parent categories import completed successfully'));
  } catch (err) {
    next(err);
  }
};

// =========================================================================
// 9. BRANDS EXPORT & IMPORT
// =========================================================================
exports.exportBrands = async (req, res, next) => {
  try {
    const [brands] = await pool.query(`SELECT * FROM brands ORDER BY id ASC`);

    const rows = brands.map(b => ({
      'Brand ID': b.id,
      'Brand Name': b.name || '',
      'Slug': b.slug || '',
      'Brand Logo URL': resolvePermanentImageUrl(b.logo_url || b.logo || b.image_url),
      'Description': b.description || '',
      'Active Status': b.is_active !== 0
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, 'BRANDS');

    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="karviyam_brands_export.xlsx"');
    return res.status(200).send(buf);
  } catch (err) {
    next(err);
  }
};

exports.importBrands = async (req, res, next) => {
  try {
    let workbook;
    if (req.file) {
      workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    } else if (req.body.fileBase64) {
      const base64Data = req.body.fileBase64.replace(/^data:.+;base64,/, '');
      workbook = XLSX.read(Buffer.from(base64Data, 'base64'), { type: 'buffer' });
    } else {
      return res.status(400).json(ApiResponse.error('No Excel file provided for brand import'));
    }

    const sheetName = workbook.SheetNames[0];
    const rawRows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

    let createdCount = 0;
    let updatedCount = 0;

    for (const r of rawRows) {
      const name = String(r['Brand Name'] || r['name'] || '').trim();
      if (!name) continue;

      const logoUrl = sanitizeImportImageUrl(r['Brand Logo URL'] || r['logo_url']);
      const description = String(r['Description'] || '').trim();
      const isActive = parseBool(r['Active Status'], true);

      const [existing] = await pool.query('SELECT * FROM brands WHERE LOWER(name) = ? LIMIT 1', [name.toLowerCase()]);

      if (existing.length > 0) {
        const curB = existing[0];
        const finalLogo = logoUrl !== '' ? logoUrl : curB.logo_url;
        await pool.query(
          `UPDATE brands SET logo_url = ?, description = ?, is_active = ? WHERE id = ?`,
          [finalLogo, description, isActive ? 1 : 0, curB.id]
        );
        updatedCount++;
      } else {
        await pool.query(
          `INSERT INTO brands (name, logo_url, description, is_active) VALUES (?, ?, ?, ?)`,
          [name, logoUrl, description, isActive ? 1 : 0]
        );
        createdCount++;
      }
    }

    return res.status(200).json(ApiResponse.success({ createdCount, updatedCount }, 'Brand import completed successfully'));
  } catch (err) {
    next(err);
  }
};

// =========================================================================
// 10. PROMO CARDS EXPORT & IMPORT
// =========================================================================
exports.exportPromoCards = async (req, res, next) => {
  try {
    const [cards] = await pool.query(`SELECT * FROM promo_cards ORDER BY sort_order ASC, id ASC`);

    const rows = cards.map(c => ({
      'Promo Card ID': c.id,
      'Title': c.title || '',
      'Subtitle': c.subtitle || '',
      'Promo Image URL': resolvePermanentImageUrl(c.image_url || c.image_path),
      'Button Text': c.button_text || 'Explore',
      'Button Link': c.button_link || c.link || '/shop',
      'Display Order': c.sort_order || c.display_order || 0,
      'Active Status': c.is_active !== 0
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, 'PROMO CARDS');

    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="karviyam_promo_cards_export.xlsx"');
    return res.status(200).send(buf);
  } catch (err) {
    next(err);
  }
};

exports.importPromoCards = async (req, res, next) => {
  try {
    let workbook;
    if (req.file) {
      workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    } else if (req.body.fileBase64) {
      const base64Data = req.body.fileBase64.replace(/^data:.+;base64,/, '');
      workbook = XLSX.read(Buffer.from(base64Data, 'base64'), { type: 'buffer' });
    } else {
      return res.status(400).json(ApiResponse.error('No Excel file provided for promo cards import'));
    }

    const sheetName = workbook.SheetNames[0];
    const rawRows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

    let createdCount = 0;
    let updatedCount = 0;

    for (const r of rawRows) {
      const title = String(r['Title'] || r['title'] || '').trim();
      const imageUrl = sanitizeImportImageUrl(r['Promo Image URL'] || r['image_url']);
      if (!title && !imageUrl) continue;

      const subtitle = String(r['Subtitle'] || '').trim();
      const buttonText = String(r['Button Text'] || 'Explore').trim();
      const buttonLink = String(r['Button Link'] || '/shop').trim();
      const displayOrder = parseInt(r['Display Order'] || 0, 10);
      const isActive = parseBool(r['Active Status'], true);

      const [existing] = await pool.query('SELECT * FROM promo_cards WHERE LOWER(title) = ? LIMIT 1', [title.toLowerCase()]);

      if (existing.length > 0) {
        const curC = existing[0];
        const finalImg = imageUrl !== '' ? imageUrl : curC.image_url;
        await pool.query(
          `UPDATE promo_cards SET subtitle = ?, image_url = ?, button_text = ?, button_link = ?, sort_order = ?, is_active = ? WHERE id = ?`,
          [subtitle, finalImg, buttonText, buttonLink, displayOrder, isActive ? 1 : 0, curC.id]
        );
        updatedCount++;
      } else {
        await pool.query(
          `INSERT INTO promo_cards (title, subtitle, image_url, button_text, button_link, sort_order, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [title, subtitle, imageUrl, buttonText, buttonLink, displayOrder, isActive ? 1 : 0]
        );
        createdCount++;
      }
    }

    return res.status(200).json(ApiResponse.success({ createdCount, updatedCount }, 'Promo cards import completed successfully'));
  } catch (err) {
    next(err);
  }
};

// =========================================================================
// 11. BRANDING & SETTINGS EXPORT & IMPORT
// =========================================================================
exports.exportSettings = async (req, res, next) => {
  try {
    let settings = {};
    try {
      const [sRows] = await pool.query(`SELECT setting_key, setting_value FROM settings`);
      sRows.forEach(sr => { settings[sr.setting_key] = sr.setting_value; });
    } catch (e) {}

    const rows = [
      {
        'Setting Module': 'Branding & Asset URLs',
        'Website Logo': resolvePermanentImageUrl(settings.logo_url || settings.logoUrl || settings.site_logo),
        'Mobile Logo': resolvePermanentImageUrl(settings.mobile_logo_url || settings.mobileLogoUrl || settings.logo_url),
        'Email Header Logo': resolvePermanentImageUrl(settings.email_logo_url || settings.emailLogoUrl || settings.logo_url),
        'Favicon Icon': resolvePermanentImageUrl(settings.favicon_url || settings.faviconUrl),
        'Footer Logo': resolvePermanentImageUrl(settings.footer_logo_url || settings.footerLogoUrl || settings.logo_url),
        'Store Name': settings.store_name || 'Karviyam',
        'Support Email': settings.support_email || 'support@karviyam.com',
        'Support Phone': settings.support_phone || '+91 98765 43210'
      }
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, 'SETTINGS & BRANDING');

    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="karviyam_settings_branding_export.xlsx"');
    return res.status(200).send(buf);
  } catch (err) {
    next(err);
  }
};

exports.importSettings = async (req, res, next) => {
  try {
    let workbook;
    if (req.file) {
      workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    } else if (req.body.fileBase64) {
      const base64Data = req.body.fileBase64.replace(/^data:.+;base64,/, '');
      workbook = XLSX.read(Buffer.from(base64Data, 'base64'), { type: 'buffer' });
    } else {
      return res.status(400).json(ApiResponse.error('No Excel file provided for settings import'));
    }

    const sheetName = workbook.SheetNames[0];
    const rawRows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

    if (rawRows.length > 0) {
      const r = rawRows[0];
      const mappings = {
        logo_url: sanitizeImportImageUrl(r['Website Logo']),
        mobile_logo_url: sanitizeImportImageUrl(r['Mobile Logo']),
        email_logo_url: sanitizeImportImageUrl(r['Email Header Logo']),
        favicon_url: sanitizeImportImageUrl(r['Favicon Icon']),
        footer_logo_url: sanitizeImportImageUrl(r['Footer Logo']),
        store_name: r['Store Name'],
        support_email: r['Support Email'],
        support_phone: r['Support Phone']
      };

      for (const [key, val] of Object.entries(mappings)) {
        if (val !== undefined && val !== null && val !== '') {
          await pool.query(
            `INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?`,
            [key, String(val), String(val)]
          );
        }
      }
    }

    return res.status(200).json(ApiResponse.success({}, 'Settings and branding imported successfully'));
  } catch (err) {
    next(err);
  }
};

// =========================================================================
// 12. COUPON EXPORT & IMPORT
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
// 13. CUSTOMER EXPORT (READ-ONLY FOR SECURITY)
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
// 14. ORDER EXPORT (MULTI-SHEET WORKBOOK)
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

// =========================================================================
// 15. INVENTORY EXPORT & IMPORT
// =========================================================================
exports.exportInventory = async (req, res, next) => {
  try {
    const [products] = await pool.query(`
      SELECT p.*, c.name as category_name 
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id 
      ORDER BY p.id DESC
    `);

    const rows = products.map(p => ({
      'Product ID': p.id,
      'SKU Code': p.sku || `KV-SKU-${p.id}`,
      'Product Name': p.name || '',
      'Main Category': p.category_name || 'Apparel',
      'Warehouse': p.warehouse || 'Main Warehouse (Hub 1)',
      'Current Stock': parseInt(p.stock_quantity || 0, 10),
      'Reorder Threshold': parseInt(p.reorder_threshold || 10, 10),
      'Stock Status': (p.stock_quantity || 0) === 0 ? 'Out of Stock' : ((p.stock_quantity || 0) < 10 ? 'Low Stock' : 'In Stock'),
      'Selling Price (₹)': parseFloat(p.price || 0),
      'Cost Price (₹)': parseFloat(p.cost_price || p.price || 0),
      'Main Image': resolvePermanentImageUrl(p.image_url)
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, 'INVENTORY');

    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="karviyam_inventory_export.xlsx"');
    return res.status(200).send(buf);
  } catch (err) {
    next(err);
  }
};

exports.importInventory = async (req, res, next) => {
  try {
    let workbook;
    if (req.file) {
      workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    } else if (req.body.fileBase64) {
      const base64Data = req.body.fileBase64.replace(/^data:.+;base64,/, '');
      workbook = XLSX.read(Buffer.from(base64Data, 'base64'), { type: 'buffer' });
    } else {
      return res.status(400).json(ApiResponse.error('No Excel file provided for inventory import'));
    }

    const sheetName = workbook.SheetNames[0];
    const rawRows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

    let updatedCount = 0;
    let failedCount = 0;

    for (const r of rawRows) {
      const sku = String(getNormalizedRowValue(r, ['SKU Code', 'SKU', 'sku_code'])).trim();
      if (!sku) continue;

      const stock = parseInt(getNormalizedRowValue(r, ['Current Stock', 'Stock Quantity', 'Stock', 'qty'], 0), 10);
      const priceVal = getNormalizedRowValue(r, ['Selling Price (₹)', 'Selling Price', 'Price']);

      const [existing] = await pool.query('SELECT id FROM products WHERE LOWER(sku) = ? LIMIT 1', [sku.toLowerCase()]);
      if (existing.length > 0) {
        let updates = ['stock_quantity = ?'];
        let params = [stock];

        if (priceVal !== '') {
          updates.push('price = ?');
          params.push(parseFloat(priceVal));
        }
        params.push(existing[0].id);

        await pool.query(`UPDATE products SET ${updates.join(', ')} WHERE id = ?`, params);
        updatedCount++;
      } else {
        failedCount++;
      }
    }

    return res.status(200).json(ApiResponse.success({ updatedCount, failedCount }, 'Inventory import completed successfully'));
  } catch (err) {
    next(err);
  }
};

