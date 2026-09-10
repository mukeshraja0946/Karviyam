const pool = require('../config/db');
const ApiResponse = require('../utils/apiResponse');

const mapProductRowToDTO = async (p) => {
  if (!p) return null;

  // Fetch gallery images
  const [images] = await pool.query('SELECT image_url FROM product_images WHERE product_id = ? ORDER BY id ASC', [p.id]);
  const imageUrls = images.map(img => img.image_url);
  if (p.image_url && !imageUrls.includes(p.image_url)) {
    imageUrls.unshift(p.image_url);
  }

  // Fetch color variants if table exists
  let colors = [];
  try {
    const [colorRows] = await pool.query('SELECT * FROM product_colors WHERE product_id = ? ORDER BY is_default DESC, id ASC', [p.id]);
    const seenColorNames = new Set();

    for (const c of colorRows) {
      const cName = (c.color_name || 'Standard').trim();
      if (seenColorNames.has(cName.toLowerCase())) {
        continue; // Skip older duplicate rows if any existed
      }
      seenColorNames.add(cName.toLowerCase());

      const [cImages] = await pool.query('SELECT image_url, is_main FROM product_color_images WHERE product_color_id = ? ORDER BY sort_order ASC, id ASC', [c.id]);
      const validSubImgs = cImages.map(ci => ci.image_url).filter(Boolean);
      const mainImg = c.main_image || '';
      let subImgs = validSubImgs.filter(img => img && img !== mainImg);

      // Dual-storage check: If relational table had 0 sub images, check color_variant_images JSON column
      if (subImgs.length === 0 && p.color_variant_images) {
        try {
          const rawMap = typeof p.color_variant_images === 'string' ? JSON.parse(p.color_variant_images) : p.color_variant_images;
          if (rawMap && typeof rawMap === 'object') {
            const val = rawMap[c.color_name] || rawMap[cName];
            if (val && typeof val === 'object' && Array.isArray(val.subImages)) {
              subImgs = val.subImages.filter(Boolean);
            }
          }
        } catch (eJson) {}
      }

      const unifiedImgs = [];
      if (mainImg) unifiedImgs.push(mainImg);
      subImgs.forEach(s => {
        if (s && !unifiedImgs.includes(s)) unifiedImgs.push(s);
      });

      colors.push({
        id: c.id,
        colorName: c.color_name,
        colorCode: c.color_code || c.hex_code || '#000000',
        hexCode: c.hex_code || c.color_code || '#000000',
        isDefault: Boolean(c.is_default),
        mainImage: mainImg,
        subImages: subImgs,
        videoUrl: c.video_url || p.video_url || '',
        imageUrls: unifiedImgs,
        images: unifiedImgs
      });
    }
  } catch (e) {}

  if (colors.length === 0 && p.color_variant_images) {
    try {
      const parsedMap = typeof p.color_variant_images === 'string' ? JSON.parse(p.color_variant_images) : p.color_variant_images;
      if (parsedMap && typeof parsedMap === 'object') {
        Object.keys(parsedMap).forEach((cName, idx) => {
          const val = parsedMap[cName];
          if (Array.isArray(val)) {
            const imgs = val.filter(Boolean);
            const mainImg = imgs[0] || '';
            const subImgs = imgs.slice(1);
            colors.push({
              id: idx + 1,
              colorName: cName,
              colorCode: cName.toLowerCase().includes('black') ? '#000000' : (cName.toLowerCase().includes('white') ? '#FFFFFF' : '#B71C1C'),
              hexCode: cName.toLowerCase().includes('black') ? '#000000' : (cName.toLowerCase().includes('white') ? '#FFFFFF' : '#B71C1C'),
              isDefault: idx === 0,
              mainImage: mainImg,
              subImages: subImgs,
              videoUrl: p.video_url || '',
              imageUrls: imgs,
              images: imgs
            });
          } else if (val && typeof val === 'object') {
            const imgs = Array.isArray(val.imageUrls) ? val.imageUrls.filter(Boolean) : [];
            const mainImg = val.mainImage || imgs[0] || '';
            const subImgs = Array.isArray(val.subImages)
              ? val.subImages.filter(Boolean)
              : imgs.filter(i => i && i !== mainImg);
            const unifiedImgs = [];
            if (mainImg) unifiedImgs.push(mainImg);
            subImgs.forEach(s => { if (s && !unifiedImgs.includes(s)) unifiedImgs.push(s); });

            colors.push({
              id: idx + 1,
              colorName: val.colorName || cName,
              colorCode: val.colorCode || val.hexCode || '#000000',
              hexCode: val.hexCode || val.colorCode || '#000000',
              isDefault: Boolean(val.isDefault),
              mainImage: mainImg,
              subImages: subImgs,
              videoUrl: val.videoUrl || p.video_url || '',
              imageUrls: unifiedImgs,
              images: unifiedImgs
            });
          }
        });
      }
    } catch (eJSON) {}
  }

  // Fetch size/color product variants
  let variants = [];
  try {
    const [variantRows] = await pool.query('SELECT * FROM product_variants WHERE product_id = ?', [p.id]);
    variants = variantRows.map(v => ({
      id: v.id,
      size: v.size,
      color: v.color,
      stock: v.stock || v.stock_quantity,
      priceOverride: v.price_override
    }));
  } catch (e) {}

  // Fetch extra details if available
  let extraDetails = null;
  try {
    const [extraRows] = await pool.query('SELECT * FROM product_extra_details WHERE product_id = ?', [p.id]);
    if (extraRows.length > 0) {
      const ex = extraRows[0];
      extraDetails = {
        mainCategory: ex.main_category,
        subCategory: ex.sub_category,
        productType: ex.product_type,
        attributes: typeof ex.attributes === 'string' ? JSON.parse(ex.attributes) : ex.attributes,
        aboutPoints: typeof ex.about_points === 'string' ? JSON.parse(ex.about_points) : ex.about_points,
        additionalInfo: typeof ex.additional_info === 'string' ? JSON.parse(ex.additional_info) : ex.additional_info
      };
    }
  } catch (e) {}

  // Calculate genuine dynamic ratings & reviews from reviews table
  let avgRating = 0;
  let reviewsCount = 0;
  let ratingDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

  try {
    const [reviewStats] = await pool.query(
      `SELECT 
        COUNT(*) as total_reviews, 
        AVG(rating) as avg_rating,
        SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END) as count_5,
        SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END) as count_4,
        SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END) as count_3,
        SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END) as count_2,
        SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END) as count_1
       FROM reviews 
       WHERE product_id = ? AND (status = 'Approved' OR status IS NULL OR status = '')`,
      [p.id]
    );

    if (reviewStats && reviewStats.length > 0 && reviewStats[0].total_reviews > 0) {
      reviewsCount = parseInt(reviewStats[0].total_reviews, 10);
      avgRating = Math.round(parseFloat(reviewStats[0].avg_rating) * 10) / 10;
      ratingDistribution = {
        5: parseInt(reviewStats[0].count_5 || 0, 10),
        4: parseInt(reviewStats[0].count_4 || 0, 10),
        3: parseInt(reviewStats[0].count_3 || 0, 10),
        2: parseInt(reviewStats[0].count_2 || 0, 10),
        1: parseInt(reviewStats[0].count_1 || 0, 10)
      };
    }
  } catch (e) {}

  const defaultCol = colors.find(c => c.isDefault) || colors[0];
  const primaryImageUrl = (defaultCol && defaultCol.mainImage) || p.image_url || (imageUrls && imageUrls[0]) || null;
  const resolvedImages = (defaultCol && defaultCol.imageUrls && defaultCol.imageUrls.length > 0) ? [...defaultCol.imageUrls] : [...imageUrls];
  if (primaryImageUrl && !resolvedImages.includes(primaryImageUrl)) {
    resolvedImages.unshift(primaryImageUrl);
  }

  return {
    id: p.id,
    name: p.name,
    sku: p.sku,
    barcode: p.barcode,
    description: p.description,
    price: parseFloat(p.price || 0),
    oldPrice: p.old_price !== null && p.old_price !== undefined ? parseFloat(p.old_price) : null,
    costPrice: p.cost_price !== null && p.cost_price !== undefined ? parseFloat(p.cost_price) : null,
    discountPercentage: p.discount_percentage !== null && p.discount_percentage !== undefined ? parseFloat(p.discount_percentage) : null,
    stockQuantity: p.stock_quantity !== undefined ? p.stock_quantity : 0,
    imageUrl: primaryImageUrl,
    images: resolvedImages,
    videoUrl: p.video_url,
    type: p.type || 'General',
    gender: p.gender || 'Unisex',
    brand: p.brand || p.brand_name || null,
    brandId: p.brand_id || p.brandId || null,
    brand_id: p.brand_id || p.brandId || null,
    rating: avgRating,
    reviewsCount: reviewsCount,
    ratingsCount: reviewsCount,
    ratingDistribution: ratingDistribution,
    isFeatured: Boolean(p.is_featured),
    isTrending: Boolean(p.is_trending),
    isBestSeller: Boolean(p.is_best_seller),
    isNewArrival: Boolean(p.is_new_arrival),
    isActive: p.is_active !== undefined ? Boolean(p.is_active) : true,
    size: p.size,
    color: p.color,
    fabric: p.fabric,
    fit: p.fit,
    material: p.material,
    weight: p.weight ? parseFloat(p.weight) : null,
    tags: p.tags,
    review: p.review,
    categoryId: p.category_id || p.categoryId || null,
    category_id: p.category_id || p.categoryId || null,
    categoryName: p.category_name || p.categoryName || null,
    subcategoryId: p.subcategory_id || p.subcategoryId || null,
    subcategory_id: p.subcategory_id || p.subcategoryId || null,
    subcategoryName: p.subcategory_name || p.subcategoryName || null,
    colors,
    colorVariants: colors,
    colorVariantImages: p.color_variant_images || null,
    variants,
    extraDetails,
    createdAt: p.created_at
  };
};

const buildProductFilterConditions = (queryParams) => {
  const {
    keyword,
    category,
    categories,
    categoryId,
    brand,
    brands,
    brandId,
    minPrice,
    maxPrice,
    priceRange,
    priceRanges,
    sizes,
    size,
    colors,
    color,
    colour,
    inStock,
    availability,
    gender,
    type,
    isFeatured,
    isTrending,
    isBestSeller,
    isNewArrival,
    rating,
    includeInactive
  } = queryParams;

  let conditions = [];
  if (includeInactive === 'true' || includeInactive === '1' || includeInactive === true) {
    conditions.push('1=1');
  } else {
    conditions.push('(p.is_active = 1 OR p.is_active IS NULL)');
  }
  let params = [];

  // Keyword search
  if (keyword && keyword.trim()) {
    const term = `%${keyword.trim()}%`;
    conditions.push('(p.name LIKE ? OR p.description LIKE ? OR p.brand LIKE ? OR p.sku LIKE ? OR c.name LIKE ?)');
    params.push(term, term, term, term, term);
  }

  // 1. CATEGORY FILTER (OR logic within categories group)
  const rawCatList = categories || category || categoryId;
  if (rawCatList && rawCatList !== 'ALL' && rawCatList !== 'all') {
    const catArray = (Array.isArray(rawCatList) ? rawCatList : String(rawCatList).split(','))
      .map(c => c.trim())
      .filter(Boolean);

    if (catArray.length > 0) {
      const catSubClauses = [];
      catArray.forEach(cat => {
        if (!isNaN(cat)) {
          catSubClauses.push('(p.category_id = ? OR p.subcategory_id = ?)');
          params.push(cat, cat);
        } else {
          const catLower = cat.toLowerCase();
          if (catLower === 'men') {
            catSubClauses.push("(LOWER(p.gender) = 'men' OR LOWER(c.name) LIKE '%men%' OR LOWER(p.type) LIKE '%men%' OR LOWER(p.name) LIKE '%shirt%' OR LOWER(p.name) LIKE '%polo%' OR LOWER(p.name) LIKE '%kurta%') AND LOWER(p.name) NOT LIKE '%saree%' AND LOWER(p.name) NOT LIKE '%women%'");
          } else if (catLower === 'women') {
            catSubClauses.push("(LOWER(p.gender) = 'women' OR LOWER(c.name) LIKE '%women%' OR LOWER(p.type) LIKE '%women%' OR LOWER(p.name) LIKE '%saree%' OR LOWER(p.name) LIKE '%lehenga%' OR LOWER(p.name) LIKE '%dress%')");
          } else {
            const term = `%${cat}%`;
            catSubClauses.push('(LOWER(c.name) LIKE LOWER(?) OR LOWER(p.type) LIKE LOWER(?) OR LOWER(p.category) LIKE LOWER(?) OR LOWER(p.name) LIKE LOWER(?))');
            params.push(term, term, term, term);
          }
        }
      });
      if (catSubClauses.length > 0) {
        conditions.push(`(${catSubClauses.join(' OR ')})`);
      }
    }
  }

  // 2. BRAND FILTER (OR logic within brands group)
  const rawBrandList = brands || brand || brandId;
  if (rawBrandList && rawBrandList !== 'ALL' && rawBrandList !== 'all') {
    const brandArray = (Array.isArray(rawBrandList) ? rawBrandList : String(rawBrandList).split(','))
      .map(b => b.trim())
      .filter(Boolean);

    if (brandArray.length > 0) {
      const brandSubClauses = [];
      brandArray.forEach(brd => {
        if (!isNaN(brd)) {
          brandSubClauses.push('p.brand_id = ?');
          params.push(brd);
        } else {
          const term = `%${brd}%`;
          brandSubClauses.push('(LOWER(b.name) LIKE LOWER(?) OR LOWER(p.brand) LIKE LOWER(?))');
          params.push(term, term);
        }
      });
      if (brandSubClauses.length > 0) {
        conditions.push(`(${brandSubClauses.join(' OR ')})`);
      }
    }
  }

  // 3. PRICE RANGE FILTER (OR logic within price ranges)
  const rawPriceRanges = priceRanges || priceRange;
  if (rawPriceRanges) {
    const rangeArray = (Array.isArray(rawPriceRanges) ? rawPriceRanges : String(rawPriceRanges).split(','))
      .map(r => r.trim())
      .filter(Boolean);

    if (rangeArray.length > 0) {
      const priceSubClauses = [];
      rangeArray.forEach(rKey => {
        if (rKey === 'under_499' || rKey === 'under-499' || rKey === '0-499') {
          priceSubClauses.push('p.price < 499');
        } else if (rKey === '500_999' || rKey === '500-999') {
          priceSubClauses.push('(p.price >= 500 AND p.price <= 999)');
        } else if (rKey === '1000_1999' || rKey === '1000-1999') {
          priceSubClauses.push('(p.price >= 1000 AND p.price <= 1999)');
        } else if (rKey === '2000_2999' || rKey === '2000-2999') {
          priceSubClauses.push('(p.price >= 2000 AND p.price <= 2999)');
        } else if (rKey === 'above_3000' || rKey === 'above-3000' || rKey === '3000+') {
          priceSubClauses.push('p.price > 3000');
        }
      });
      if (priceSubClauses.length > 0) {
        conditions.push(`(${priceSubClauses.join(' OR ')})`);
      }
    }
  }

  if (minPrice && !isNaN(minPrice)) {
    conditions.push('p.price >= ?');
    params.push(parseFloat(minPrice));
  }
  if (maxPrice && !isNaN(maxPrice)) {
    conditions.push('p.price <= ?');
    params.push(parseFloat(maxPrice));
  }

  // 4. SIZE FILTER (OR logic within sizes group)
  const rawSizes = sizes || (size && isNaN(size) ? size : null);
  if (rawSizes) {
    const sizeArray = (Array.isArray(rawSizes) ? rawSizes : String(rawSizes).split(','))
      .map(s => s.trim())
      .filter(Boolean);

    if (sizeArray.length > 0) {
      const sizeSubClauses = [];
      sizeArray.forEach(sz => {
        const term = `%${sz}%`;
        sizeSubClauses.push(`(
          EXISTS (SELECT 1 FROM product_variants pv WHERE pv.product_id = p.id AND LOWER(pv.size) = LOWER(?))
          OR LOWER(p.size) LIKE LOWER(?)
          OR LOWER(p.sizes) LIKE LOWER(?)
        )`);
        params.push(sz, term, term);
      });
      if (sizeSubClauses.length > 0) {
        conditions.push(`(${sizeSubClauses.join(' OR ')})`);
      }
    }
  }

  // 5. COLOUR FILTER (OR logic within colors group)
  const rawColors = colors || color || colour;
  if (rawColors) {
    const colorArray = (Array.isArray(rawColors) ? rawColors : String(rawColors).split(','))
      .map(c => c.trim())
      .filter(Boolean);

    if (colorArray.length > 0) {
      const colorSubClauses = [];
      colorArray.forEach(col => {
        const term = `%${col}%`;
        colorSubClauses.push(`(
          EXISTS (SELECT 1 FROM product_colors pc WHERE pc.product_id = p.id AND LOWER(pc.color_name) LIKE LOWER(?))
          OR EXISTS (SELECT 1 FROM product_variants pv WHERE pv.product_id = p.id AND LOWER(pv.color) LIKE LOWER(?))
          OR LOWER(p.color) LIKE LOWER(?)
          OR LOWER(p.color_variant_images) LIKE LOWER(?)
        )`);
        params.push(term, term, term, term);
      });
      if (colorSubClauses.length > 0) {
        conditions.push(`(${colorSubClauses.join(' OR ')})`);
      }
    }
  }

  // 6. AVAILABILITY FILTER (In Stock)
  if (inStock === 'true' || inStock === '1' || availability === 'in_stock' || availability === 'true') {
    conditions.push(`(
      (p.stock_quantity IS NOT NULL AND p.stock_quantity > 0)
      OR (p.stock IS NOT NULL AND p.stock > 0)
      OR EXISTS (SELECT 1 FROM product_variants pv WHERE pv.product_id = p.id AND pv.stock > 0)
    )`);
  }

  // Gender & Type
  if (gender && gender !== 'All' && gender !== 'ALL') {
    conditions.push('LOWER(p.gender) = LOWER(?)');
    params.push(gender);
  }
  if (type && type !== 'All' && type !== 'ALL') {
    conditions.push('LOWER(p.type) = LOWER(?)');
    params.push(type);
  }
  if (rating && !isNaN(rating)) {
    conditions.push('p.rating >= ?');
    params.push(parseFloat(rating));
  }

  if (isFeatured === 'true' || isFeatured === '1') conditions.push('p.is_featured = 1');
  if (isTrending === 'true' || isTrending === '1') conditions.push('p.is_trending = 1');
  if (isBestSeller === 'true' || isBestSeller === '1') conditions.push('p.is_best_seller = 1');
  if (isNewArrival === 'true' || isNewArrival === '1') conditions.push('p.is_new_arrival = 1');

  return { conditions, params };
};

exports.getProducts = async (req, res, next) => {
  try {
    const {
      sortBy,
      sort,
      sortDir = 'desc',
      page = 0,
      size = 250,
      limit: reqLimit
    } = req.query;

    const { conditions, params } = buildProductFilterConditions(req.query);

    // Dynamic sorting
    const activeSort = sortBy || sort || 'featured';
    let orderClause = 'ORDER BY p.is_featured DESC, p.id DESC';
    if (activeSort === 'price_asc' || activeSort === 'price_low_high') {
      orderClause = 'ORDER BY p.price ASC, p.id DESC';
    } else if (activeSort === 'price_desc' || activeSort === 'price_high_low') {
      orderClause = 'ORDER BY p.price DESC, p.id DESC';
    } else if (activeSort === 'rating') {
      orderClause = 'ORDER BY p.rating DESC, p.id DESC';
    } else if (activeSort === 'newest') {
      orderClause = 'ORDER BY p.id DESC';
    } else if (activeSort === 'best_selling') {
      orderClause = 'ORDER BY p.is_best_seller DESC, p.id DESC';
    }

    const pageSize = parseInt(reqLimit || size, 10) > 0 ? parseInt(reqLimit || size, 10) : 250;
    const pageNum = parseInt(page, 10) > 0 ? parseInt(page, 10) : 0;
    const offset = pageNum * pageSize;

    // 1. Get Count
    const countSql = `
      SELECT COUNT(DISTINCT p.id) as totalCount
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN brands b ON p.brand_id = b.id
      WHERE ${conditions.join(' AND ')}
    `;
    const [countRows] = await pool.query(countSql, params);
    const totalCount = countRows[0]?.totalCount || 0;

    // 2. Fetch Products
    const sql = `
      SELECT p.*, c.name as category_name, b.name as brand_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN brands b ON p.brand_id = b.id
      WHERE ${conditions.join(' AND ')}
      ${orderClause}
      LIMIT ${pageSize} OFFSET ${offset}
    `;

    const [rows] = await pool.query(sql, params);
    const productDTOs = await Promise.all(rows.map(mapProductRowToDTO));

    return res.status(200).json(ApiResponse.success({
      products: productDTOs,
      content: productDTOs,
      data: productDTOs,
      totalCount,
      totalElements: totalCount,
      page: pageNum,
      pageSize
    }, 'Products retrieved successfully'));
  } catch (err) {
    next(err);
  }
};

exports.getFilterOptions = async (req, res, next) => {
  try {
    // 1. Dynamic Categories from DB
    const [catRows] = await pool.query(`
      SELECT DISTINCT c.id, c.name, COUNT(p.id) as count
      FROM categories c
      JOIN products p ON (p.category_id = c.id OR p.subcategory_id = c.id)
      WHERE p.is_active = 1 OR p.is_active IS NULL
      GROUP BY c.id, c.name
      ORDER BY count DESC, c.name ASC
    `);

    // 2. Dynamic Brands from DB
    const [brandRowsFromTable] = await pool.query(`
      SELECT DISTINCT b.id, b.name, COUNT(p.id) as count
      FROM brands b
      JOIN products p ON p.brand_id = b.id
      WHERE p.is_active = 1 OR p.is_active IS NULL
      GROUP BY b.id, b.name
      ORDER BY count DESC, b.name ASC
    `);

    const [brandRowsFromProductString] = await pool.query(`
      SELECT DISTINCT brand as name, COUNT(id) as count
      FROM products
      WHERE brand IS NOT NULL AND brand != '' AND (is_active = 1 OR is_active IS NULL)
      GROUP BY brand
      ORDER BY count DESC, brand ASC
    `);

    const brandMap = new Map();
    brandRowsFromTable.forEach(b => brandMap.set(b.name.toUpperCase(), { id: b.id, name: b.name, count: b.count }));
    brandRowsFromProductString.forEach(b => {
      const key = b.name.toUpperCase();
      if (!brandMap.has(key)) {
        brandMap.set(key, { id: b.name, name: b.name, count: b.count });
      }
    });
    const brandList = Array.from(brandMap.values());

    return res.status(200).json(ApiResponse.success({
      categories: catRows,
      brands: brandList,
      sizes: ['S', 'M', 'L', 'XL', 'XXL'],
      colors: [
        { id: 'black', name: 'Black', hex: '#000000' },
        { id: 'red', name: 'Red', hex: '#B71C1C' },
        { id: 'blue', name: 'Blue', hex: '#1D4ED8' },
        { id: 'green', name: 'Green', hex: '#15803D' },
        { id: 'beige', name: 'Beige', hex: '#F5F5DC' },
        { id: 'brown', name: 'Brown', hex: '#78350F' },
        { id: 'white', name: 'White', hex: '#FFFFFF' }
      ],
      priceRanges: [
        { id: 'under_499', label: 'Under ₹499', min: 0, max: 499 },
        { id: '500_999', label: '₹500 – ₹999', min: 500, max: 999 },
        { id: '1000_1999', label: '₹1,000 – ₹1,999', min: 1000, max: 1999 },
        { id: '2000_2999', label: '₹2,000 – ₹2,999', min: 2000, max: 2999 },
        { id: 'above_3000', label: 'Above ₹3,000', min: 3000, max: 999999 }
      ]
    }, 'Filter options fetched successfully'));
  } catch (err) {
    next(err);
  }
};

exports.getFeaturedProducts = async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT p.*, c.name as category_name 
       FROM products p 
       LEFT JOIN categories c ON p.category_id = c.id 
       WHERE p.is_featured = 1 AND (p.is_active = 1 OR p.is_active IS NULL)
       ORDER BY p.id DESC LIMIT 12`
    );
    const productDTOs = await Promise.all(rows.map(mapProductRowToDTO));
    return res.status(200).json(ApiResponse.success(productDTOs, 'Featured products fetched successfully'));
  } catch (err) {
    next(err);
  }
};

exports.searchProducts = async (req, res, next) => {
  try {
    const query = req.query.query || req.query.keyword || req.query.q || req.query.search || '';
    if (!query.trim()) {
      return res.status(200).json(ApiResponse.success([], 'Search query empty'));
    }
    const cleanQuery = query.trim();
    const term = `%${cleanQuery}%`;
    const [rows] = await pool.query(
      `SELECT p.*, c.name as category_name 
       FROM products p 
       LEFT JOIN categories c ON p.category_id = c.id 
       WHERE (
         LOWER(p.name) LIKE LOWER(?) 
         OR LOWER(p.sku) LIKE LOWER(?)
         OR LOWER(p.brand) LIKE LOWER(?) 
         OR LOWER(c.name) LIKE LOWER(?)
         OR LOWER(p.category) LIKE LOWER(?)
         OR LOWER(p.type) LIKE LOWER(?)
         OR LOWER(p.material) LIKE LOWER(?)
         OR LOWER(p.fabric) LIKE LOWER(?)
         OR LOWER(p.description) LIKE LOWER(?) 
         OR LOWER(p.tags) LIKE LOWER(?)
       ) 
       AND (p.is_active = 1 OR p.is_active IS NULL)
       ORDER BY p.id DESC LIMIT 40`,
      [term, term, term, term, term, term, term, term, term, term]
    );
    const productDTOs = await Promise.all(rows.map(mapProductRowToDTO));
    return res.status(200).json(ApiResponse.success(productDTOs, 'Search results fetched successfully'));
  } catch (err) {
    next(err);
  }
};

exports.getProductById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(
      `SELECT p.*, c.name as category_name, b.name as brand_name
       FROM products p 
       LEFT JOIN categories c ON p.category_id = c.id 
       LEFT JOIN brands b ON p.brand_id = b.id 
       WHERE p.id = ? OR p.sku = ? OR p.name = ?`,
      [id, id, id]
    );

    if (rows.length === 0) {
      return res.status(404).json(ApiResponse.error('Product not found'));
    }

    const dto = await mapProductRowToDTO(rows[0]);
    return res.status(200).json(ApiResponse.success(dto, 'Product details fetched successfully'));
  } catch (err) {
    next(err);
  }
};

exports.deleteProduct = async (req, res, next) => {
  let conn;
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json(ApiResponse.error('Product ID is required'));
    }

    conn = await pool.getConnection();
    await conn.beginTransaction();

    const [rows] = await conn.query('SELECT * FROM products WHERE id = ? OR sku = ?', [id, id]);
    if (!rows || rows.length === 0) {
      conn.release();
      return res.status(404).json(ApiResponse.error('Product not found in database'));
    }

    const realId = rows[0].id;

    // Unlink/clean related tables cleanly
    try { await conn.query('UPDATE order_items SET product_id = NULL WHERE product_id = ?', [realId]); } catch (e) {}
    try { await conn.query('DELETE FROM product_color_images WHERE color_id IN (SELECT id FROM product_colors WHERE product_id = ?)', [realId]); } catch (e) {}
    try { await conn.query('DELETE FROM product_colors WHERE product_id = ?', [realId]); } catch (e) {}
    try { await conn.query('DELETE FROM product_images WHERE product_id = ?', [realId]); } catch (e) {}
    try { await conn.query('DELETE FROM wishlist WHERE product_id = ?', [realId]); } catch (e) {}
    try { await conn.query('DELETE FROM cart WHERE product_id = ?', [realId]); } catch (e) {}

    const [delRes] = await conn.query('DELETE FROM products WHERE id = ?', [realId]);

    await conn.commit();
    conn.release();
    conn = null;

    try {
      const { logAudit } = require('../utils/auditLogger');
      await logAudit({
        adminId: req.user?.id || 1,
        action: 'DELETE_PRODUCT',
        targetType: 'Products',
        details: `Deleted product #${realId} (${rows[0].name || 'Product'})`
      });
    } catch (eAudit) {}

    return res.status(200).json(ApiResponse.success(
      { id: realId, deletedCount: delRes.affectedRows || 1 },
      'Product deleted successfully from database'
    ));
  } catch (err) {
    if (conn) {
      try { await conn.rollback(); } catch (eRb) {}
      try { conn.release(); } catch (eRel) {}
    }
    next(err);
  }
};

exports.bulkImportProducts = async (req, res, next) => {
  try {
    const productsData = Array.isArray(req.body) ? req.body : (req.body.products || []);
    let successCount = 0;
    let failedCount = 0;
    let errors = [];

    for (let idx = 0; idx < productsData.length; idx++) {
      const item = productsData[idx];
      try {
        if (!item.name || !item.price) {
          failedCount++;
          errors.push(`Row ${idx + 1}: Name and price are required.`);
          continue;
        }

        // Resolve Category
        let catId = item.categoryId || 1;
        if (!item.categoryId && item.categoryName) {
          const [cats] = await pool.query('SELECT id FROM categories WHERE LOWER(name) = ?', [item.categoryName.trim().toLowerCase()]);
          if (cats.length > 0) catId = cats[0].id;
        }

        await pool.query(
          `INSERT INTO products 
           (category_id, name, sku, description, price, old_price, stock_quantity, image_url, gender, type, brand, is_featured, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
          [
            catId,
            item.name,
            item.sku || null,
            item.description || null,
            parseFloat(item.price),
            item.oldPrice ? parseFloat(item.oldPrice) : null,
            item.stockQuantity !== undefined ? parseInt(item.stockQuantity) : 10,
            item.imageUrl || null,
            item.gender || 'Unisex',
            item.type || 'General',
            item.brand || 'Karviyam',
            item.isFeatured ? 1 : 0
          ]
        );
        successCount++;
      } catch (err) {
        failedCount++;
        errors.push(`Row ${idx + 1}: ${err.message}`);
      }
    }

    return res.status(200).json(ApiResponse.success({
      totalRows: productsData.length,
      successCount,
      failedCount,
      errors
    }, 'Bulk import completed successfully'));
  } catch (err) {
    next(err);
  }
};

exports.deleteAllProducts = async (req, res, next) => {
  let conn;
  try {
    conn = await pool.getConnection();
    await conn.beginTransaction();

    const [countRows] = await conn.query('SELECT COUNT(*) as cnt FROM products');
    const totalCount = countRows[0]?.cnt || 0;

    // Unlink product reference from order_items without deleting historical sales/invoice data
    try { await conn.query('UPDATE order_items SET product_id = NULL WHERE product_id IS NOT NULL'); } catch (e) {}
    try { await conn.query('DELETE FROM product_color_images'); } catch (e) {}
    try { await conn.query('DELETE FROM product_colors'); } catch (e) {}
    try { await conn.query('DELETE FROM product_images'); } catch (e) {}
    try { await conn.query('DELETE FROM wishlist'); } catch (e) {}
    try { await conn.query('DELETE FROM cart'); } catch (e) {}
    try { await conn.query('DELETE FROM category_cards'); } catch (e) {}
    await conn.query('DELETE FROM products');

    await conn.commit();
    conn.release();
    conn = null;

    try {
      const { logAudit } = require('../utils/auditLogger');
      await logAudit({
        adminId: req.user?.id || 1,
        action: 'CLEAR_ALL_PRODUCTS',
        targetType: 'Products',
        details: `Successfully cleared all ${totalCount} products in a single bulk operation.`
      });
    } catch (eAudit) {}

    return res.status(200).json(ApiResponse.success(
      { deletedCount: totalCount },
      `Successfully deleted ${totalCount} products.`
    ));
  } catch (err) {
    if (conn) {
      try { await conn.rollback(); } catch (eRb) {}
      try { conn.release(); } catch (eRel) {}
    }
    next(err);
  }
};

exports.deleteSelectedProducts = async (req, res, next) => {
  let conn;
  try {
    const { ids } = req.body || {};
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json(ApiResponse.error('No product IDs provided for deletion'));
    }

    const cleanIds = ids.map(id => parseInt(id, 10)).filter(id => !isNaN(id) && id > 0);
    if (cleanIds.length === 0) {
      return res.status(400).json(ApiResponse.error('Invalid product IDs'));
    }

    conn = await pool.getConnection();
    await conn.beginTransaction();

    try { await conn.query('UPDATE order_items SET product_id = NULL WHERE product_id IN (?)', [cleanIds]); } catch (e) {}
    try { await conn.query('DELETE FROM product_color_images WHERE color_id IN (SELECT id FROM product_colors WHERE product_id IN (?))', [cleanIds]); } catch (e) {}
    try { await conn.query('DELETE FROM product_colors WHERE product_id IN (?)', [cleanIds]); } catch (e) {}
    try { await conn.query('DELETE FROM product_images WHERE product_id IN (?)', [cleanIds]); } catch (e) {}
    try { await conn.query('DELETE FROM wishlist WHERE product_id IN (?)', [cleanIds]); } catch (e) {}
    try { await conn.query('DELETE FROM cart WHERE product_id IN (?)', [cleanIds]); } catch (e) {}

    const [delRes] = await conn.query('DELETE FROM products WHERE id IN (?)', [cleanIds]);
    const deletedCount = delRes.affectedRows || cleanIds.length;

    await conn.commit();
    conn.release();
    conn = null;

    try {
      const { logAudit } = require('../utils/auditLogger');
      await logAudit({
        adminId: req.user?.id || 1,
        action: 'DELETE_BATCH',
        targetType: 'Products',
        details: `Deleted ${deletedCount} selected products.`
      });
    } catch (eAudit) {}

    return res.status(200).json(ApiResponse.success(
      { deletedCount },
      `Successfully deleted ${deletedCount} selected products.`
    ));
  } catch (err) {
    if (conn) {
      try { await conn.rollback(); } catch (eRb) {}
      try { conn.release(); } catch (eRel) {}
    }
    next(err);
  }
};

exports.mapProductRowToDTO = mapProductRowToDTO;
