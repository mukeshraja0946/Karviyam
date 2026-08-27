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
    const [colorRows] = await pool.query('SELECT * FROM product_colors WHERE product_id = ? ORDER BY id ASC', [p.id]);
    for (const c of colorRows) {
      const [cImages] = await pool.query('SELECT image_url, is_main FROM product_color_images WHERE product_color_id = ? ORDER BY sort_order ASC, id ASC', [c.id]);
      const validImgs = cImages.map(ci => ci.image_url).filter(Boolean);
      const mainImg = c.main_image || validImgs[0] || '';
      const subImgs = mainImg
        ? validImgs.filter(img => img && img !== mainImg)
        : (validImgs.length > 1 ? validImgs.slice(1) : []);

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
    imageUrl: p.image_url,
    images: imageUrls,
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

exports.getProducts = async (req, res, next) => {
  try {
    const {
      keyword, categoryId, category, subcategoryId, brandId, gender, type,
      minPrice, maxPrice, rating, isFeatured, isTrending, isBestSeller, isNewArrival,
      sortBy = 'id', sortDir = 'desc', page = 0, size = 50
    } = req.query;

    const targetCategory = categoryId || category;

    let conditions = ['1=1'];
    let params = [];

    if (keyword && keyword.trim()) {
      conditions.push('(p.name LIKE ? OR p.description LIKE ? OR p.brand LIKE ? OR p.sku LIKE ?)');
      const term = `%${keyword.trim()}%`;
      params.push(term, term, term, term);
    }

    if (targetCategory && targetCategory !== 'ALL' && targetCategory !== 'all') {
      if (!isNaN(targetCategory)) {
        conditions.push('(p.category_id = ? OR p.subcategory_id = ?)');
        params.push(targetCategory, targetCategory);
      } else {
        const catLower = targetCategory.toLowerCase();
        if (catLower === 'men') {
          conditions.push("(LOWER(p.gender) = 'men' OR LOWER(c.name) LIKE '%men%' OR LOWER(p.type) LIKE '%men%' OR LOWER(p.name) LIKE '%shirt%' OR LOWER(p.name) LIKE '%polo%' OR LOWER(p.name) LIKE '%kurta%') AND LOWER(p.name) NOT LIKE '%saree%' AND LOWER(p.name) NOT LIKE '%women%'");
        } else if (catLower === 'women') {
          conditions.push("(LOWER(p.gender) = 'women' OR LOWER(c.name) LIKE '%women%' OR LOWER(p.type) LIKE '%women%' OR LOWER(p.name) LIKE '%saree%' OR LOWER(p.name) LIKE '%lehenga%' OR LOWER(p.name) LIKE '%dress%')");
        } else {
          const catTerm = `%${targetCategory}%`;
          conditions.push('(c.name LIKE ? OR p.type LIKE ? OR p.gender LIKE ? OR p.name LIKE ?)');
          params.push(catTerm, catTerm, catTerm, catTerm);
        }
      }
    }

    if (subcategoryId) {
      conditions.push('p.subcategory_id = ?');
      params.push(subcategoryId);
    }

    if (brandId) {
      conditions.push('p.brand_id = ?');
      params.push(brandId);
    }

    if (gender && gender !== 'All' && gender !== 'ALL') {
      conditions.push('p.gender = ?');
      params.push(gender);
    }

    if (type && type !== 'All' && type !== 'ALL') {
      conditions.push('p.type = ?');
      params.push(type);
    }

    if (minPrice) {
      conditions.push('p.price >= ?');
      params.push(parseFloat(minPrice));
    }

    if (maxPrice) {
      conditions.push('p.price <= ?');
      params.push(parseFloat(maxPrice));
    }

    if (rating) {
      conditions.push('p.rating >= ?');
      params.push(parseFloat(rating));
    }

    if (isFeatured === 'true' || isFeatured === '1') {
      conditions.push('p.is_featured = 1');
    }
    if (isTrending === 'true' || isTrending === '1') {
      conditions.push('p.is_trending = 1');
    }
    if (isBestSeller === 'true' || isBestSeller === '1') {
      conditions.push('p.is_best_seller = 1');
    }
    if (isNewArrival === 'true' || isNewArrival === '1') {
      conditions.push('p.is_new_arrival = 1');
    }

    const sortColumn = ['price', 'rating', 'name', 'id'].includes(sortBy) ? `p.${sortBy}` : 'p.id';
    const sortDirection = sortDir.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

    const limit = parseInt(size) > 0 ? parseInt(size) : 50;
    const offset = parseInt(page) > 0 ? parseInt(page) * limit : 0;

    const sql = `
      SELECT p.*, c.name as category_name, b.name as brand_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN brands b ON p.brand_id = b.id
      WHERE ${conditions.join(' AND ')}
      ORDER BY ${sortColumn} ${sortDirection}
      LIMIT ${limit} OFFSET ${offset}
    `;

    const [rows] = await pool.query(sql, params);

    const productDTOs = await Promise.all(rows.map(mapProductRowToDTO));

    return res.status(200).json(ApiResponse.success(productDTOs, 'Products retrieved successfully'));
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
    const query = req.query.query || req.query.keyword || '';
    if (!query.trim()) {
      return res.status(200).json(ApiResponse.success([], 'Search query empty'));
    }
    const term = `%${query.trim()}%`;
    const [rows] = await pool.query(
      `SELECT p.*, c.name as category_name 
       FROM products p 
       LEFT JOIN categories c ON p.category_id = c.id 
       WHERE (p.name LIKE ? OR p.description LIKE ? OR p.brand LIKE ? OR p.tags LIKE ?) 
       AND (p.is_active = 1 OR p.is_active IS NULL)
       ORDER BY p.id DESC LIMIT 30`,
      [term, term, term, term]
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

exports.mapProductRowToDTO = mapProductRowToDTO;
