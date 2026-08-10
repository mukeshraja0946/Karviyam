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
    const [colorRows] = await pool.query('SELECT * FROM product_colors WHERE product_id = ?', [p.id]);
    for (const c of colorRows) {
      const [cImages] = await pool.query('SELECT image_url FROM product_color_images WHERE product_color_id = ?', [c.id]);
      colors.push({
        id: c.id,
        colorName: c.color_name,
        colorCode: c.color_code || c.hex_code,
        hexCode: c.hex_code,
        imageUrls: cImages.map(ci => ci.image_url)
      });
    }
  } catch (e) {}

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
    rating: parseFloat(p.rating || 4.5),
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
    variants,
    extraDetails,
    createdAt: p.created_at
  };
};

exports.getProducts = async (req, res, next) => {
  try {
    const {
      keyword, categoryId, subcategoryId, brandId, gender, type,
      minPrice, maxPrice, rating, isFeatured, isTrending, isBestSeller, isNewArrival,
      sortBy = 'id', sortDir = 'desc', page = 0, size = 50
    } = req.query;

    let conditions = ['1=1'];
    let params = [];

    if (keyword && keyword.trim()) {
      conditions.push('(p.name LIKE ? OR p.description LIKE ? OR p.brand LIKE ? OR p.sku LIKE ?)');
      const term = `%${keyword.trim()}%`;
      params.push(term, term, term, term);
    }

    if (categoryId) {
      if (!isNaN(categoryId)) {
        conditions.push('(p.category_id = ? OR p.subcategory_id = ?)');
        params.push(categoryId, categoryId);
      } else {
        conditions.push('(c.name LIKE ? OR p.type LIKE ? OR p.brand LIKE ?)');
        const catTerm = `%${categoryId}%`;
        params.push(catTerm, catTerm, catTerm);
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
       WHERE p.id = ?`,
      [id]
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
