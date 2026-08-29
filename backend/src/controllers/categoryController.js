const pool = require('../config/db');
const ApiResponse = require('../utils/apiResponse');

const CANONICAL_MAP = {
  'men': 'MEN',
  'mens': 'MEN',
  "men's": 'MEN',
  'men clothing': 'MEN',
  'mens wear': 'MEN',
  'women': 'WOMEN',
  'womens': 'WOMEN',
  "women's": 'WOMEN',
  'women clothing': 'WOMEN',
  'womens wear': 'WOMEN',
  'kids': 'KIDS & BABY',
  'kids & baby': 'KIDS & BABY',
  'baby': 'KIDS & BABY',
  'kids wear': 'KIDS & BABY',
  'jewels': 'JEWELS',
  'jewellery': 'JEWELS',
  'jewelry': 'JEWELS',
  'accessories': 'ACCESSORIES',
  'kitchen & home': 'KITCHEN & HOME',
  'school & office': 'SCHOOL & OFFICE',
  'unisex': 'UNISEX'
};

const getCanonicalName = (name) => {
  if (!name) return '';
  const clean = name.trim().toLowerCase();
  return CANONICAL_MAP[clean] || name.trim().toUpperCase();
};

const consolidateDuplicateCategories = async () => {
  try {
    const [roots] = await pool.query('SELECT * FROM categories WHERE parent_id IS NULL ORDER BY id ASC');
    const groupMap = {};

    roots.forEach(cat => {
      const canonicalKey = getCanonicalName(cat.name);
      if (!groupMap[canonicalKey]) {
        groupMap[canonicalKey] = [];
      }
      groupMap[canonicalKey].push(cat);
    });

    for (const [canonicalKey, cats] of Object.entries(groupMap)) {
      if (cats.length > 1) {
        const primary = cats.find(c => (c.image_url && c.image_url.length > 10) || c.description) || cats[0];
        const duplicateIds = cats.filter(c => c.id !== primary.id).map(c => c.id);

        if (duplicateIds.length > 0) {
          console.log(`[Category Consolidation] Consolidating duplicate categories [${duplicateIds.join(', ')}] into canonical ID ${primary.id} (${primary.name})`);

          for (const dupId of duplicateIds) {
            await pool.query('UPDATE categories SET parent_id = ? WHERE parent_id = ?', [primary.id, dupId]);
            await pool.query('UPDATE products SET category_id = ? WHERE category_id = ?', [primary.id, dupId]);
            await pool.query('UPDATE products SET subcategory_id = ? WHERE subcategory_id = ?', [primary.id, dupId]);
            await pool.query('DELETE FROM categories WHERE id = ?', [dupId]);
          }
        }
      }
    }
  } catch (err) {
    console.error('[Category Consolidation Error]', err.message);
  }
};

const ensureCategoryTableExists = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        parent_id BIGINT DEFAULT NULL,
        name VARCHAR(100) NOT NULL,
        slug VARCHAR(150),
        type VARCHAR(50),
        description TEXT,
        image_url LONGTEXT,
        icon_url LONGTEXT,
        banner_url LONGTEXT,
        order_index INT DEFAULT 0,
        sort_order INT DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        seo_title VARCHAR(150),
        meta_description TEXT,
        meta_keywords VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE CASCADE
      )
    `);
    try { await pool.query("ALTER TABLE categories ADD COLUMN sort_order INT DEFAULT 0"); } catch (e) {}
    try { await pool.query("ALTER TABLE categories MODIFY COLUMN image_url LONGTEXT"); } catch (e) {}
    try { await pool.query("ALTER TABLE categories MODIFY COLUMN icon_url LONGTEXT"); } catch (e) {}
    try { await pool.query("ALTER TABLE categories MODIFY COLUMN banner_url LONGTEXT"); } catch (e) {}
    try { await pool.query("UPDATE categories SET is_active = 1 WHERE is_active IS NULL"); } catch (e) {}

    await ensureMainCategoriesExist();
    await consolidateDuplicateCategories();
  } catch (e) {}
};

const ensureMainCategoriesExist = async () => {
  try {
    const required = [
      { name: 'MEN', type: 'MEN', description: "Men's clothing and products", order: 1 },
      { name: 'WOMEN', type: 'WOMEN', description: "Women's clothing and products", order: 2 },
      { name: 'UNISEX', type: 'UNISEX', description: "Unisex clothing and products", order: 3 },
      { name: 'JEWELS', type: 'JEWELS', description: "Jewellery products", order: 4 },
      { name: 'KIDS & BABY', type: 'KIDS & BABY', description: "Kids and baby clothing", order: 5 },
      { name: 'ACCESSORIES', type: 'ACCESSORIES', description: "Fashion accessories", order: 6 },
      { name: 'KITCHEN & HOME', type: 'KITCHEN & HOME', description: "Kitchen and home products", order: 7 }
    ];

    for (const item of required) {
      const canonical = getCanonicalName(item.name);
      const [rows] = await pool.query(
        'SELECT id FROM categories WHERE parent_id IS NULL AND (LOWER(name) = LOWER(?) OR LOWER(name) = LOWER(?))',
        [item.name, canonical]
      );
      if (rows.length === 0) {
        const slug = item.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        await pool.query(
          'INSERT INTO categories (name, slug, type, description, order_index, sort_order, is_active) VALUES (?, ?, ?, ?, ?, ?, 1)',
          [item.name, slug, item.type, item.description, item.order, item.order]
        );
      }
    }
  } catch (e) {
    console.error('Error ensuring main categories exist:', e);
  }
};

const parseIsActive = (val) => {
  if (val === undefined || val === null) return true;
  if (Buffer.isBuffer(val)) return val[0] === 1 || val[0] === 0x01;
  if (typeof val === 'object' && val !== null && val.type === 'Buffer' && Array.isArray(val.data)) {
    return val.data[0] === 1 || val.data[0] === 0x01;
  }
  if (typeof val === 'number') return val === 1;
  if (typeof val === 'boolean') return val;
  if (typeof val === 'string') return val.toLowerCase() === 'true' || val === '1';
  return Boolean(val);
};

const mapCategoryRow = (c) => {
  const activeBool = parseIsActive(c.is_active);
  const displayOrd = c.sort_order || c.order_index || 0;
  return {
    id: c.id,
    parentId: c.parent_id,
    parent_id: c.parent_id,
    name: c.name,
    slug: c.slug,
    type: c.type || 'General',
    description: c.description,
    imageUrl: c.image_url || '',
    image_url: c.image_url || '',
    mainImage: c.image_url || '',
    main_image: c.image_url || '',
    iconUrl: c.icon_url || '',
    icon_url: c.icon_url || '',
    categoryIcon: c.icon_url || '',
    category_icon: c.icon_url || '',
    bannerUrl: c.banner_url || '',
    banner_url: c.banner_url || '',
    categoryBanner: c.banner_url || '',
    category_banner: c.banner_url || '',
    orderIndex: displayOrd,
    sortOrder: displayOrd,
    sort_order: displayOrd,
    displayOrder: displayOrd,
    isActive: activeBool,
    is_active: activeBool,
    enabled: activeBool,
    seoTitle: c.seo_title,
    metaDescription: c.meta_description,
    metaKeywords: c.meta_keywords,
    createdAt: c.created_at
  };
};

exports.getAllCategories = async (req, res, next) => {
  try {
    await ensureCategoryTableExists();
    const activeOnly = req.query.activeOnly === 'true';
    const [rows] = await pool.query('SELECT * FROM categories ORDER BY order_index ASC, id ASC');
    let categories = rows.map(mapCategoryRow);
    if (activeOnly) {
      categories = categories.filter(c => c.isActive);
    }
    return res.status(200).json(ApiResponse.success(categories, 'Categories retrieved successfully'));
  } catch (err) {
    next(err);
  }
};

exports.getCategoryTree = async (req, res, next) => {
  try {
    await ensureCategoryTableExists();
    const includeAll = req.query.all === 'true';
    const [rows] = await pool.query('SELECT * FROM categories ORDER BY order_index ASC, id ASC');
    let categories = rows.map(mapCategoryRow);
    if (!includeAll) {
      categories = categories.filter(c => c.isActive);
    }

    const categoryMap = {};
    const rootCategories = [];

    categories.forEach(cat => {
      cat.subcategories = [];
      cat.children = cat.subcategories; // Provide both subcategories and children aliases
      categoryMap[cat.id] = cat;
    });

    categories.forEach(cat => {
      if (cat.parentId && categoryMap[cat.parentId]) {
        categoryMap[cat.parentId].subcategories.push(cat);
      } else if (!cat.parentId) {
        rootCategories.push(cat);
      }
    });

    return res.status(200).json(ApiResponse.success(rootCategories, 'Category tree retrieved successfully'));
  } catch (err) {
    next(err);
  }
};

exports.getCategoryById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query('SELECT * FROM categories WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json(ApiResponse.error('Category not found'));
    }
    return res.status(200).json(ApiResponse.success(mapCategoryRow(rows[0]), 'Category details retrieved'));
  } catch (err) {
    next(err);
  }
};

exports.createCategory = async (req, res, next) => {
  try {
    await ensureCategoryTableExists();
    const dto = req.body;
    const trimmedName = dto.name.trim();
    const slug = dto.slug || trimmedName.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    let parentIdVal = dto.parentId ? parseInt(dto.parentId, 10) : null;
    if (parentIdVal) {
      const [validParent] = await pool.query('SELECT id FROM categories WHERE id = ?', [parentIdVal]);
      if (validParent.length === 0) parentIdVal = null;
    }

    const canonicalName = getCanonicalName(trimmedName);

    // Duplicate Check
    let dupQuery = '';
    let dupParams = [];

    if (parentIdVal) {
      dupQuery = 'SELECT id, name FROM categories WHERE parent_id = ? AND (LOWER(name) = LOWER(?) OR LOWER(name) = LOWER(?))';
      dupParams = [parentIdVal, trimmedName, canonicalName];
    } else {
      dupQuery = 'SELECT id, name FROM categories WHERE parent_id IS NULL AND (LOWER(name) = LOWER(?) OR LOWER(name) = LOWER(?))';
      dupParams = [trimmedName, canonicalName];
    }

    const [existing] = await pool.query(dupQuery, dupParams);
    if (existing.length > 0) {
      return res.status(400).json(ApiResponse.error('This category already exists.'));
    }

    const [result] = await pool.query(
      `INSERT INTO categories 
       (parent_id, name, slug, type, description, image_url, icon_url, banner_url, order_index, is_active, seo_title, meta_description, meta_keywords, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        parentIdVal,
        trimmedName,
        slug,
        dto.type || 'WOMEN',
        dto.description || null,
        dto.imageUrl || null,
        dto.iconUrl || null,
        dto.bannerUrl || null,
        dto.orderIndex !== undefined ? parseInt(dto.orderIndex, 10) : 0,
        dto.isActive !== undefined ? (dto.isActive ? 1 : 0) : 1,
        dto.seoTitle || null,
        dto.metaDescription || null,
        dto.metaKeywords || null
      ]
    );

    const [rows] = await pool.query('SELECT * FROM categories WHERE id = ?', [result.insertId]);
    if (rows.length === 0) {
      return res.status(500).json(ApiResponse.error('Category created but could not be retrieved from database'));
    }
    return res.status(200).json(ApiResponse.success(mapCategoryRow(rows[0]), 'Category created successfully'));
  } catch (err) {
    next(err);
  }
};

exports.bulkImportCategories = async (req, res, next) => {
  try {
    const dtos = Array.isArray(req.body) ? req.body : (req.body.categories || []);
    let imported = 0;
    let updated = 0;
    let skipped = 0;
    let failed = 0;
    let errors = [];

    for (let i = 0; i < dtos.length; i++) {
      const cat = dtos[i];
      if (!cat.name) {
        failed++;
        errors.push(`Row ${i + 1}: Name is required`);
        continue;
      }
      try {
        const slug = cat.slug || cat.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        const [existing] = await pool.query('SELECT id FROM categories WHERE LOWER(name) = ? OR slug = ?', [cat.name.trim().toLowerCase(), slug]);

        if (existing.length > 0) {
          if (req.query.updateExisting === 'true') {
            await pool.query('UPDATE categories SET description = ?, image_url = ? WHERE id = ?', [cat.description || null, cat.imageUrl || null, existing[0].id]);
            updated++;
          } else {
            skipped++;
          }
        } else {
          await pool.query(
            `INSERT INTO categories (parent_id, name, slug, type, description, image_url, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())`,
            [cat.parentId || null, cat.name, slug, cat.type || 'General', cat.description || null, cat.imageUrl || null]
          );
          imported++;
        }
      } catch (err) {
        failed++;
        errors.push(`Row ${i + 1}: ${err.message}`);
      }
    }

    return res.status(200).json(ApiResponse.success({
      importedCount: imported,
      updatedCount: updated,
      skippedCount: skipped,
      failedCount: failed,
      errors
    }, 'Bulk category import completed successfully'));
  } catch (err) {
    next(err);
  }
};

exports.updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const dto = req.body;

    const [rows] = await pool.query('SELECT * FROM categories WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json(ApiResponse.error('Category not found'));
    }

    let updates = [];
    let params = [];

    if (dto.name !== undefined) {
      const nameTrim = dto.name.trim();
      const targetParentId = dto.parentId !== undefined ? (dto.parentId ? parseInt(dto.parentId, 10) : null) : rows[0].parent_id;
      const canonicalName = getCanonicalName(nameTrim);

      let dupQuery = targetParentId
        ? 'SELECT id FROM categories WHERE id != ? AND parent_id = ? AND (LOWER(name) = LOWER(?) OR LOWER(name) = LOWER(?))'
        : 'SELECT id FROM categories WHERE id != ? AND parent_id IS NULL AND (LOWER(name) = LOWER(?) OR LOWER(name) = LOWER(?))';
      let dupParams = targetParentId ? [id, targetParentId, nameTrim, canonicalName] : [id, nameTrim, canonicalName];

      const [dupRows] = await pool.query(dupQuery, dupParams);
      if (dupRows.length > 0) {
        return res.status(400).json(ApiResponse.error('This category already exists.'));
      }

      updates.push('name = ?'); params.push(nameTrim);
      updates.push('slug = ?'); params.push(dto.slug || nameTrim.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
    }
    if (dto.parentId !== undefined) { updates.push('parent_id = ?'); params.push(dto.parentId); }
    if (dto.type !== undefined) { updates.push('type = ?'); params.push(dto.type); }
    if (dto.description !== undefined) { updates.push('description = ?'); params.push(dto.description); }
    if (dto.imageUrl !== undefined) { updates.push('image_url = ?'); params.push(dto.imageUrl); }
    if (dto.iconUrl !== undefined) { updates.push('icon_url = ?'); params.push(dto.iconUrl); }
    if (dto.bannerUrl !== undefined) { updates.push('banner_url = ?'); params.push(dto.bannerUrl); }
    if (dto.orderIndex !== undefined) { updates.push('order_index = ?'); params.push(dto.orderIndex); }
    if (dto.isActive !== undefined) { updates.push('is_active = ?'); params.push(dto.isActive ? 1 : 0); }
    if (dto.seoTitle !== undefined) { updates.push('seo_title = ?'); params.push(dto.seoTitle); }
    if (dto.metaDescription !== undefined) { updates.push('meta_description = ?'); params.push(dto.metaDescription); }
    if (dto.metaKeywords !== undefined) { updates.push('meta_keywords = ?'); params.push(dto.metaKeywords); }

    if (updates.length > 0) {
      params.push(id);
      await pool.query(`UPDATE categories SET ${updates.join(', ')} WHERE id = ?`, params);
    }

    const [updatedRows] = await pool.query('SELECT * FROM categories WHERE id = ?', [id]);
    return res.status(200).json(ApiResponse.success(mapCategoryRow(updatedRows[0]), 'Category updated successfully'));
  } catch (err) {
    next(err);
  }
};


exports.deleteCategory = async (req, res, next) => {
  try {
    await ensureCategoryTableExists();
    const { id } = req.params;

    // 1. Unlink child subcategories
    await pool.query('UPDATE categories SET parent_id = NULL WHERE parent_id = ?', [id]).catch(() => null);

    // 2. Unlink products associated with this category
    await pool.query('UPDATE products SET category_id = NULL WHERE category_id = ?', [id]).catch(() => null);
    try { await pool.query('UPDATE products SET subcategory_id = NULL WHERE subcategory_id = ?', [id]); } catch (e) {}

    // 3. Delete category record
    await pool.query('DELETE FROM categories WHERE id = ?', [id]);
    return res.status(200).json(ApiResponse.success(null, 'Category deleted successfully'));
  } catch (err) {
    next(err);
  }
};

exports.deleteAllCategories = async (req, res, next) => {
  let conn;
  try {
    await ensureCategoryTableExists();
    conn = await pool.getConnection();
    await conn.beginTransaction();

    const [countRows] = await conn.query('SELECT COUNT(*) as cnt FROM categories');
    const totalCount = countRows[0]?.cnt || 0;

    await conn.query('UPDATE categories SET parent_id = NULL').catch(() => null);
    await conn.query('UPDATE products SET category_id = NULL').catch(() => null);
    try { await conn.query('UPDATE products SET subcategory_id = NULL'); } catch (e) {}
    try { await conn.query('DELETE FROM category_cards'); } catch (e) {}
    try { await conn.query('DELETE FROM product_categories'); } catch (e) {}

    await conn.query('DELETE FROM categories');

    await conn.commit();
    conn.release();
    conn = null;

    try {
      const { logAudit } = require('../utils/auditLogger');
      await logAudit({
        adminId: req.user?.id || 1,
        action: 'CLEAR_ALL_CATEGORIES',
        targetType: 'Categories',
        details: `Successfully cleared all ${totalCount} categories in a single bulk operation.`
      });
    } catch (eAudit) {}

    return res.status(200).json(ApiResponse.success(
      { deletedCount: totalCount },
      `Successfully deleted ${totalCount} categories.`
    ));
  } catch (err) {
    if (conn) {
      try { await conn.rollback(); } catch (eRb) {}
      try { conn.release(); } catch (eRel) {}
    }
    next(err);
  }
};

exports.deleteSelectedCategories = async (req, res, next) => {
  let conn;
  try {
    const { ids } = req.body || {};
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json(ApiResponse.error('No category IDs provided for batch deletion'));
    }

    await ensureCategoryTableExists();
    conn = await pool.getConnection();
    await conn.beginTransaction();

    const cleanIds = ids.map(id => String(id).trim()).filter(Boolean);
    if (cleanIds.length === 0) {
      return res.status(400).json(ApiResponse.error('Invalid category IDs'));
    }

    await conn.query('UPDATE categories SET parent_id = NULL WHERE parent_id IN (?)', [cleanIds]).catch(() => null);
    await conn.query('UPDATE products SET category_id = NULL WHERE category_id IN (?)', [cleanIds]).catch(() => null);
    try { await conn.query('UPDATE products SET subcategory_id = NULL WHERE subcategory_id IN (?)', [cleanIds]); } catch (e) {}
    try { await conn.query('DELETE FROM category_cards WHERE category_id IN (?)', [cleanIds]); } catch (e) {}
    try { await conn.query('DELETE FROM product_categories WHERE category_id IN (?)', [cleanIds]); } catch (e) {}

    const [delRes] = await conn.query('DELETE FROM categories WHERE id IN (?)', [cleanIds]);
    const deletedCount = delRes.affectedRows || cleanIds.length;

    await conn.commit();
    conn.release();
    conn = null;

    try {
      const { logAudit } = require('../utils/auditLogger');
      await logAudit({
        adminId: req.user?.id || 1,
        action: 'DELETE_BATCH',
        targetType: 'Categories',
        details: `Deleted ${deletedCount} selected categories.`
      });
    } catch (eAudit) {}

    return res.status(200).json(ApiResponse.success(
      { deletedCount },
      `Successfully deleted ${deletedCount} selected categories.`
    ));
  } catch (err) {
    if (conn) {
      try { await conn.rollback(); } catch (eRb) {}
      try { conn.release(); } catch (eRel) {}
    }
    next(err);
  }
};

exports.reorderCategories = async (req, res, next) => {
  try {
    const categoryIds = req.body;
    if (Array.isArray(categoryIds)) {
      for (let idx = 0; idx < categoryIds.length; idx++) {
        await pool.query('UPDATE categories SET order_index = ? WHERE id = ?', [idx, categoryIds[idx]]);
      }
    }
    return res.status(200).json(ApiResponse.success(null, 'Category order updated successfully'));
  } catch (err) {
    next(err);
  }
};

const parseBoolParam = (val) => {
  if (val === undefined || val === null) return null;
  if (typeof val === 'boolean') return val;
  if (typeof val === 'number') return val === 1;
  if (typeof val === 'string') {
    const s = val.trim().toLowerCase();
    if (s === 'true' || s === '1' || s === 'on' || s === 'enable' || s === 'enabled') return true;
    if (s === 'false' || s === '0' || s === 'off' || s === 'disable' || s === 'disabled') return false;
  }
  return null;
};

exports.toggleStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    let targetActive = parseBoolParam(req.query?.active)
      ?? parseBoolParam(req.query?.isActive)
      ?? parseBoolParam(req.body?.active)
      ?? parseBoolParam(req.body?.isActive)
      ?? parseBoolParam(req.body?.is_active);

    const [rows] = await pool.query('SELECT is_active FROM categories WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json(ApiResponse.error('Category not found'));
    }

    const currentActive = parseIsActive(rows[0].is_active);
    const newStatus = targetActive !== null ? (targetActive ? 1 : 0) : (currentActive ? 0 : 1);
    await pool.query('UPDATE categories SET is_active = ? WHERE id = ?', [newStatus, id]);

    const [updatedRows] = await pool.query('SELECT * FROM categories WHERE id = ?', [id]);
    return res.status(200).json(ApiResponse.success(mapCategoryRow(updatedRows[0]), 'Category status updated successfully'));
  } catch (err) {
    next(err);
  }
};
