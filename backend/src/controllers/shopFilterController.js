const pool = require('../config/db');
const ApiResponse = require('../utils/apiResponse');

// --------------------------------------------------
// 1. CUSTOMER SHOP FILTER CONFIG (GET /api/shop/filter-config)
// --------------------------------------------------
exports.getShopFilterConfig = async (req, res, next) => {
  try {
    // Fetch enabled sections ordered by display_order
    const [sections] = await pool.query(
      `SELECT * FROM shop_filter_sections WHERE is_enabled = 1 ORDER BY display_order ASC`
    );

    // Fetch enabled options
    const [allOptions] = await pool.query(
      `SELECT * FROM shop_filter_options WHERE is_enabled = 1 ORDER BY display_order ASC`
    );

    const filterConfig = [];

    for (const sec of sections) {
      const sectionKey = sec.section_key;
      let optionsList = [];

      if (sectionKey === 'category') {
        // Dynamic Categories from actual products/categories with product counts
        const [cats] = await pool.query(`
          SELECT c.id, c.name, c.parent_id, COUNT(p.id) as product_count
          FROM categories c
          LEFT JOIN products p ON (p.category_id = c.id OR p.subcategory_id = c.id) AND p.is_active = 1
          WHERE c.is_active = 1 OR c.is_active IS NULL
          GROUP BY c.id, c.name, c.parent_id
          HAVING product_count > 0 OR c.parent_id IS NOT NULL
          ORDER BY c.name ASC
        `);
        optionsList = cats.map(c => ({
          id: String(c.id),
          key: String(c.id),
          name: c.name,
          label: c.name,
          count: parseInt(c.product_count || 0, 10),
          isEnabled: true
        }));
      } else if (sectionKey === 'brand') {
        // Dynamic Brands from products table and custom options with counts
        const [brandCounts] = await pool.query(`
          SELECT brand, COUNT(id) as product_count 
          FROM products 
          WHERE is_active = 1 AND brand IS NOT NULL AND TRIM(brand) != ''
          GROUP BY brand 
          ORDER BY brand ASC
        `);

        const brandMap = {};
        brandCounts.forEach(b => {
          if (b.brand) brandMap[b.brand.toUpperCase()] = parseInt(b.product_count || 0, 10);
        });

        const customBrandOpts = allOptions.filter(o => o.section_key === 'brand');
        if (customBrandOpts.length > 0) {
          optionsList = customBrandOpts.map(o => {
            const bName = o.label || o.option_key;
            return {
              id: String(o.id),
              key: bName,
              name: bName,
              label: bName,
              count: brandMap[bName.toUpperCase()] || 0,
              isEnabled: Boolean(o.is_enabled)
            };
          });
        } else {
          optionsList = Object.keys(brandMap).map((bName, idx) => ({
            id: `brand_${idx}`,
            key: bName,
            name: bName,
            label: bName,
            count: brandMap[bName],
            isEnabled: true
          }));
        }
      } else if (sectionKey === 'price') {
        const priceOpts = allOptions.filter(o => o.section_key === 'price');
        for (const pOpt of priceOpts) {
          const min = parseFloat(pOpt.min_price || 0);
          const max = parseFloat(pOpt.max_price || 999999);

          const [pCount] = await pool.query(
            `SELECT COUNT(id) as count FROM products WHERE is_active = 1 AND price >= ? AND price <= ?`,
            [min, max]
          );

          optionsList.push({
            id: String(pOpt.id),
            key: pOpt.option_key,
            label: pOpt.label,
            minPrice: min,
            maxPrice: max,
            count: parseInt(pCount[0]?.count || 0, 10),
            isEnabled: Boolean(pOpt.is_enabled)
          });
        }
      } else if (sectionKey === 'size') {
        const sizeOpts = allOptions.filter(o => o.section_key === 'size');
        for (const sOpt of sizeOpts) {
          const szLabel = sOpt.label;
          const [sCount] = await pool.query(
            `SELECT COUNT(id) as count FROM products WHERE is_active = 1 AND (size LIKE ? OR size LIKE ?)`,
            [`%${szLabel}%`, `%${szLabel.toLowerCase()}%`]
          );
          optionsList.push({
            id: String(sOpt.id),
            key: sOpt.option_key,
            label: sOpt.label,
            count: parseInt(sCount[0]?.count || 0, 10),
            isEnabled: Boolean(sOpt.is_enabled)
          });
        }
      } else if (sectionKey === 'colour') {
        const colOpts = allOptions.filter(o => o.section_key === 'colour');
        for (const cOpt of colOpts) {
          const colName = cOpt.label;
          const [cCount] = await pool.query(
            `SELECT COUNT(id) as count FROM products WHERE is_active = 1 AND (color LIKE ? OR color LIKE ?)`,
            [`%${colName}%`, `%${colName.toLowerCase()}%`]
          );
          optionsList.push({
            id: String(cOpt.id),
            key: cOpt.option_key,
            label: cOpt.label,
            hex: cOpt.color_hex || '#000000',
            count: parseInt(cCount[0]?.count || 0, 10),
            isEnabled: Boolean(cOpt.is_enabled)
          });
        }
      } else if (sectionKey === 'availability') {
        const availOpts = allOptions.filter(o => o.section_key === 'availability');
        for (const aOpt of availOpts) {
          const [stkCount] = await pool.query(
            `SELECT COUNT(id) as count FROM products WHERE is_active = 1 AND stock_quantity > 0`
          );
          optionsList.push({
            id: String(aOpt.id),
            key: aOpt.option_key,
            label: aOpt.label,
            count: parseInt(stkCount[0]?.count || 0, 10),
            isEnabled: Boolean(aOpt.is_enabled)
          });
        }
      }

      filterConfig.push({
        id: sec.id,
        key: sec.section_key,
        title: sec.title,
        isEnabled: Boolean(sec.is_enabled),
        displayOrder: sec.display_order,
        displayLimit: sec.display_limit || 5,
        enableShowMore: Boolean(sec.enable_show_more),
        showMoreLimit: sec.show_more_limit || 10,
        options: optionsList
      });
    }

    return res.status(200).json(ApiResponse.success(filterConfig, 'Shop filter configuration retrieved successfully'));
  } catch (err) {
    next(err);
  }
};

// --------------------------------------------------
// 2. ADMIN FILTER CONFIG (GET /api/admin/shop-filters)
// --------------------------------------------------
exports.getAdminFilterConfig = async (req, res, next) => {
  try {
    const [sections] = await pool.query(
      `SELECT * FROM shop_filter_sections ORDER BY display_order ASC`
    );
    const [options] = await pool.query(
      `SELECT * FROM shop_filter_options ORDER BY display_order ASC`
    );

    return res.status(200).json(ApiResponse.success({
      sections,
      options
    }, 'Admin filter configuration fetched successfully'));
  } catch (err) {
    next(err);
  }
};

// --------------------------------------------------
// 3. UPDATE SECTIONS (PUT /api/admin/shop-filters/sections)
// --------------------------------------------------
exports.updateFilterSections = async (req, res, next) => {
  try {
    const { sections } = req.body;
    if (!Array.isArray(sections)) {
      return res.status(400).json(ApiResponse.error('Sections array is required.'));
    }

    for (let idx = 0; idx < sections.length; idx++) {
      const sec = sections[idx];
      await pool.query(
        `UPDATE shop_filter_sections 
         SET title = ?, is_enabled = ?, display_order = ?, display_limit = ?, enable_show_more = ?, show_more_limit = ?, updated_at = NOW() 
         WHERE id = ? OR section_key = ?`,
        [
          sec.title,
          sec.isEnabled || sec.is_enabled ? 1 : 0,
          sec.displayOrder !== undefined ? sec.displayOrder : idx + 1,
          sec.displayLimit || sec.display_limit || 5,
          sec.enableShowMore || sec.enable_show_more ? 1 : 0,
          sec.showMoreLimit || sec.show_more_limit || 10,
          sec.id || 0,
          sec.key || sec.section_key || ''
        ]
      );
    }

    return res.status(200).json(ApiResponse.success(null, 'Shop filter sections updated successfully'));
  } catch (err) {
    next(err);
  }
};

// --------------------------------------------------
// 4. CREATE FILTER OPTION (POST /api/admin/shop-filters/options)
// --------------------------------------------------
exports.createFilterOption = async (req, res, next) => {
  try {
    const { sectionKey, optionKey, label, minPrice, maxPrice, colorHex, isEnabled, displayOrder } = req.body;
    if (!sectionKey || !label) {
      return res.status(400).json(ApiResponse.error('sectionKey and label are required.'));
    }

    const optKey = optionKey || label.toLowerCase().replace(/[^a-z0-9]/g, '_');

    const [resInsert] = await pool.query(
      `INSERT INTO shop_filter_options (section_key, option_key, label, min_price, max_price, color_hex, is_enabled, display_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        sectionKey,
        optKey,
        label,
        minPrice !== undefined ? minPrice : null,
        maxPrice !== undefined ? maxPrice : null,
        colorHex || null,
        isEnabled !== false ? 1 : 0,
        displayOrder || 99
      ]
    );

    return res.status(201).json(ApiResponse.success({ id: resInsert.insertId }, 'Filter option created successfully'));
  } catch (err) {
    next(err);
  }
};

// --------------------------------------------------
// 5. UPDATE FILTER OPTION (PUT /api/admin/shop-filters/options/:id)
// --------------------------------------------------
exports.updateFilterOption = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { label, optionKey, minPrice, maxPrice, colorHex, isEnabled, displayOrder } = req.body;

    await pool.query(
      `UPDATE shop_filter_options 
       SET label = ?, option_key = ?, min_price = ?, max_price = ?, color_hex = ?, is_enabled = ?, display_order = ?, updated_at = NOW() 
       WHERE id = ?`,
      [
        label,
        optionKey || label.toLowerCase().replace(/[^a-z0-9]/g, '_'),
        minPrice !== undefined ? minPrice : null,
        maxPrice !== undefined ? maxPrice : null,
        colorHex || null,
        isEnabled ? 1 : 0,
        displayOrder !== undefined ? displayOrder : 0,
        id
      ]
    );

    return res.status(200).json(ApiResponse.success(null, 'Filter option updated successfully'));
  } catch (err) {
    next(err);
  }
};

// --------------------------------------------------
// 6. DELETE FILTER OPTION (DELETE /api/admin/shop-filters/options/:id)
// --------------------------------------------------
exports.deleteFilterOption = async (req, res, next) => {
  try {
    const { id } = req.params;
    await pool.query(`DELETE FROM shop_filter_options WHERE id = ?`, [id]);
    return res.status(200).json(ApiResponse.success(null, 'Filter option deleted successfully'));
  } catch (err) {
    next(err);
  }
};

// --------------------------------------------------
// 7. REORDER FILTER OPTIONS (PUT /api/admin/shop-filters/reorder-options)
// --------------------------------------------------
exports.reorderFilterOptions = async (req, res, next) => {
  try {
    const { options } = req.body; // Array of { id, displayOrder }
    if (!Array.isArray(options)) {
      return res.status(400).json(ApiResponse.error('Options array required.'));
    }

    for (let idx = 0; idx < options.length; idx++) {
      const item = options[idx];
      await pool.query(
        `UPDATE shop_filter_options SET display_order = ? WHERE id = ?`,
        [item.displayOrder !== undefined ? item.displayOrder : idx + 1, item.id]
      );
    }

    return res.status(200).json(ApiResponse.success(null, 'Filter options reordered successfully'));
  } catch (err) {
    next(err);
  }
};
