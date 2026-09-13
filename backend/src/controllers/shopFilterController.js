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

    // Fetch enabled options from database if any
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
          LEFT JOIN products p ON (p.category_id = c.id OR p.subcategory_id = c.id) AND (p.is_active = 1 OR p.is_active IS NULL)
          WHERE c.is_active = 1 OR c.is_active IS NULL
          GROUP BY c.id, c.name, c.parent_id
          HAVING product_count > 0
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
        // Dynamic Brands from products table
        const [brandCounts] = await pool.query(`
          SELECT brand, COUNT(id) as product_count 
          FROM products 
          WHERE (is_active = 1 OR is_active IS NULL) AND brand IS NOT NULL AND TRIM(brand) != ''
          GROUP BY brand 
          ORDER BY brand ASC
        `);
        optionsList = brandCounts.map((b, idx) => ({
          id: `brand_${idx}`,
          key: b.brand,
          name: b.brand,
          label: b.brand,
          count: parseInt(b.product_count || 0, 10),
          isEnabled: true
        }));
      } else if (sectionKey === 'price') {
        const priceDefaults = [
          { key: 'under_499', label: 'Under ₹499', min: 0, max: 499 },
          { key: '500_999', label: '₹500 – ₹999', min: 500, max: 999 },
          { key: '1000_1999', label: '₹1,000 – ₹1,999', min: 1000, max: 1999 },
          { key: '2000_2999', label: '₹2,000 – ₹2,999', min: 2000, max: 2999 },
          { key: 'above_3000', label: 'Above ₹3,000', min: 3000, max: 999999 }
        ];
        const customPriceOpts = allOptions.filter(o => o.section_key === 'price');
        const priceListToUse = customPriceOpts.length > 0 ? customPriceOpts.map(p => ({
          key: p.option_key,
          label: p.label,
          min: parseFloat(p.min_price || 0),
          max: parseFloat(p.max_price || 999999)
        })) : priceDefaults;

        for (const pOpt of priceListToUse) {
          const [pCount] = await pool.query(
            `SELECT COUNT(id) as count FROM products WHERE (is_active = 1 OR is_active IS NULL) AND price >= ? AND price <= ?`,
            [pOpt.min, pOpt.max]
          );
          const count = parseInt(pCount[0]?.count || 0, 10);
          if (count > 0) {
            optionsList.push({
              id: pOpt.key,
              key: pOpt.key,
              label: pOpt.label,
              minPrice: pOpt.min,
              maxPrice: pOpt.max,
              count,
              isEnabled: true
            });
          }
        }
      } else if (sectionKey === 'size') {
        const [sizeRows] = await pool.query(`
          SELECT DISTINCT TRIM(size) as size_val FROM products WHERE (is_active = 1 OR is_active IS NULL) AND size IS NOT NULL AND TRIM(size) != ''
        `);
        const distinctSizesSet = new Set();
        sizeRows.forEach(r => {
          if (r.size_val) {
            r.size_val.split(',').forEach(s => {
              const clean = s.trim();
              if (clean) distinctSizesSet.add(clean);
            });
          }
        });
        if (distinctSizesSet.size === 0) {
          ['S', 'M', 'L', 'XL', 'XXL'].forEach(s => distinctSizesSet.add(s));
        }

        for (const szLabel of Array.from(distinctSizesSet)) {
          const [sCount] = await pool.query(
            `SELECT COUNT(id) as count FROM products WHERE (is_active = 1 OR is_active IS NULL) AND (size LIKE ? OR sizes LIKE ?)`,
            [`%${szLabel}%`, `%${szLabel}%`]
          );
          const count = parseInt(sCount[0]?.count || 0, 10);
          if (count > 0) {
            optionsList.push({
              id: `size_${szLabel}`,
              key: szLabel,
              label: szLabel,
              count,
              isEnabled: true
            });
          }
        }
      } else if (sectionKey === 'colour') {
        const [colorRows] = await pool.query(`
          SELECT DISTINCT TRIM(color) as color_val FROM products WHERE (is_active = 1 OR is_active IS NULL) AND color IS NOT NULL AND TRIM(color) != ''
        `);
        const colorHexMap = {
          'Black': '#000000', 'Classic Black': '#000000',
          'White': '#FFFFFF', 'Ivory White': '#FFFFFF',
          'Red': '#B71C1C', 'Crimson Red': '#B71C1C',
          'Blue': '#1D4ED8', 'Navy Blue': '#1E3A8A', 'Royal Blue': '#1D4ED8',
          'Green': '#15803D', 'Emerald Green': '#047857',
          'Yellow': '#EAB308', 'Golden Yellow': '#D97706', 'Mustard': '#CA8A04',
          'Pink': '#EC4899', 'Pastel Pink': '#F472B6',
          'Maroon': '#800000',
          'Beige': '#F5F5DC', 'Brown': '#78350F'
        };

        for (const r of colorRows) {
          const colName = r.color_val;
          const [cCount] = await pool.query(
            `SELECT COUNT(id) as count FROM products WHERE (is_active = 1 OR is_active IS NULL) AND color LIKE ?`,
            [`%${colName}%`]
          );
          const count = parseInt(cCount[0]?.count || 0, 10);
          if (count > 0) {
            optionsList.push({
              id: `col_${colName}`,
              key: colName,
              label: colName,
              hex: colorHexMap[colName] || '#6B7280',
              count,
              isEnabled: true
            });
          }
        }
      } else if (sectionKey === 'material') {
        const [matRows] = await pool.query(`
          SELECT DISTINCT TRIM(val) as mat_val FROM (
            SELECT fabric as val FROM products WHERE (is_active = 1 OR is_active IS NULL) AND fabric IS NOT NULL AND TRIM(fabric) != ''
            UNION
            SELECT material as val FROM products WHERE (is_active = 1 OR is_active IS NULL) AND material IS NOT NULL AND TRIM(material) != ''
          ) AS combined
          ORDER BY mat_val ASC
        `);

        for (const m of matRows) {
          const matName = m.mat_val;
          const [mCount] = await pool.query(
            `SELECT COUNT(id) as count FROM products WHERE (is_active = 1 OR is_active IS NULL) AND (fabric LIKE ? OR material LIKE ?)`,
            [`%${matName}%`, `%${matName}%`]
          );
          const count = parseInt(mCount[0]?.count || 0, 10);
          if (count > 0) {
            optionsList.push({
              id: `mat_${matName}`,
              key: matName,
              label: matName,
              count,
              isEnabled: true
            });
          }
        }
      } else if (sectionKey === 'product_type') {
        const [typeRows] = await pool.query(`
          SELECT type, COUNT(id) as product_count
          FROM products
          WHERE (is_active = 1 OR is_active IS NULL) AND type IS NOT NULL AND TRIM(type) != ''
          GROUP BY type
          ORDER BY type ASC
        `);
        optionsList = typeRows.map((t, idx) => ({
          id: `type_${idx}`,
          key: t.type,
          label: t.type,
          count: parseInt(t.product_count || 0, 10),
          isEnabled: true
        }));
      } else if (sectionKey === 'gender') {
        const [genderRows] = await pool.query(`
          SELECT gender, COUNT(id) as product_count
          FROM products
          WHERE (is_active = 1 OR is_active IS NULL) AND gender IS NOT NULL AND TRIM(gender) != ''
          GROUP BY gender
          ORDER BY gender ASC
        `);
        optionsList = genderRows.map((g, idx) => ({
          id: `gender_${idx}`,
          key: g.gender,
          label: g.gender,
          count: parseInt(g.product_count || 0, 10),
          isEnabled: true
        }));
      } else if (sectionKey === 'fit') {
        const [fitRows] = await pool.query(`
          SELECT fit, COUNT(id) as product_count
          FROM products
          WHERE (is_active = 1 OR is_active IS NULL) AND fit IS NOT NULL AND TRIM(fit) != ''
          GROUP BY fit
          ORDER BY fit ASC
        `);
        optionsList = fitRows.map((f, idx) => ({
          id: `fit_${idx}`,
          key: f.fit,
          label: f.fit,
          count: parseInt(f.product_count || 0, 10),
          isEnabled: true
        }));
      } else if (sectionKey === 'discount') {
        const discountRanges = [
          { key: '10_above', label: '10% and above', min: 10 },
          { key: '20_above', label: '20% and above', min: 20 },
          { key: '30_above', label: '30% and above', min: 30 },
          { key: '40_above', label: '40% and above', min: 40 },
          { key: '50_above', label: '50% and above', min: 50 }
        ];

        for (const dOpt of discountRanges) {
          const [dCount] = await pool.query(
            `SELECT COUNT(id) as count FROM products WHERE (is_active = 1 OR is_active IS NULL) AND (discount_percentage >= ? OR ((old_price - price)/old_price)*100 >= ?)`,
            [dOpt.min, dOpt.min]
          );
          const count = parseInt(dCount[0]?.count || 0, 10);
          if (count > 0) {
            optionsList.push({
              id: `disc_${dOpt.key}`,
              key: dOpt.key,
              label: dOpt.label,
              minDiscount: dOpt.min,
              count,
              isEnabled: true
            });
          }
        }
      } else if (sectionKey === 'rating') {
        const ratingRanges = [
          { key: '4_above', label: '4★ & above', min: 4.0 },
          { key: '3_above', label: '3★ & above', min: 3.0 },
          { key: '2_above', label: '2★ & above', min: 2.0 },
          { key: '1_above', label: '1★ & above', min: 1.0 }
        ];

        for (const rOpt of ratingRanges) {
          const [rCount] = await pool.query(
            `SELECT COUNT(id) as count FROM products WHERE (is_active = 1 OR is_active IS NULL) AND rating >= ?`,
            [rOpt.min]
          );
          const count = parseInt(rCount[0]?.count || 0, 10);
          if (count > 0) {
            optionsList.push({
              id: `rate_${rOpt.key}`,
              key: rOpt.key,
              label: rOpt.label,
              minRating: rOpt.min,
              count,
              isEnabled: true
            });
          }
        }
      } else if (sectionKey === 'offers') {
        const offerDefs = [
          { key: 'on_sale', label: 'On Sale / Discount Available', query: 'old_price > price OR discount_percentage > 0' },
          { key: 'new_arrivals', label: 'New Arrivals', query: 'is_new_arrival = 1' },
          { key: 'best_sellers', label: 'Best Sellers', query: 'is_best_seller = 1' }
        ];

        for (const oOpt of offerDefs) {
          const [oCount] = await pool.query(
            `SELECT COUNT(id) as count FROM products WHERE (is_active = 1 OR is_active IS NULL) AND (${oOpt.query})`
          );
          const count = parseInt(oCount[0]?.count || 0, 10);
          if (count > 0) {
            optionsList.push({
              id: `off_${oOpt.key}`,
              key: oOpt.key,
              label: oOpt.label,
              count,
              isEnabled: true
            });
          }
        }
      } else if (sectionKey === 'availability') {
        const [stkCount] = await pool.query(
          `SELECT COUNT(id) as count FROM products WHERE (is_active = 1 OR is_active IS NULL) AND (stock_quantity > 0 OR stock > 0)`
        );
        const count = parseInt(stkCount[0]?.count || 0, 10);
        if (count > 0) {
          optionsList.push({
            id: 'avail_in_stock',
            key: 'in_stock',
            label: 'In Stock',
            count,
            isEnabled: true
          });
        }
      }

      // DO NOT DISPLAY SECTIONS THAT HAVE NO VALID OPTIONS (Rule 25)
      if (optionsList.length > 0) {
        filterConfig.push({
          id: sec.id,
          key: sec.section_key,
          title: sec.title,
          isEnabled: Boolean(sec.is_enabled),
          displayOrder: sec.display_order,
          displayLimit: sec.display_limit || 5,
          enableShowMore: Boolean(sec.enable_show_more),
          showMoreLimit: sec.show_more_limit || 15,
          options: optionsList
        });
      }
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
