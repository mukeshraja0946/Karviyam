const pool = require('../config/db');
const ApiResponse = require('../utils/apiResponse');

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
        is_active BOOLEAN DEFAULT TRUE,
        seo_title VARCHAR(150),
        meta_description TEXT,
        meta_keywords VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE CASCADE
      )
    `);
    try { await pool.query("ALTER TABLE categories MODIFY COLUMN image_url LONGTEXT"); } catch (e) {}
    try { await pool.query("ALTER TABLE categories MODIFY COLUMN icon_url LONGTEXT"); } catch (e) {}
    try { await pool.query("ALTER TABLE categories MODIFY COLUMN banner_url LONGTEXT"); } catch (e) {}

    await ensureMainCategoriesExist();
  } catch (e) {}
};

const ensureMainCategoriesExist = async () => {
  try {
    const required = [
      { name: 'MEN', type: 'MEN', description: "Men's clothing and products", order: 1 },
      { name: 'WOMEN', type: 'WOMEN', description: "Women's clothing and products", order: 2 },
      { name: 'UNISEX', type: 'UNISEX', description: "Unisex clothing and products", order: 3 },
      { name: 'JEWELS', type: 'JEWELS', description: "Jewellery products", order: 4 }
    ];

    for (const item of required) {
      const [rows] = await pool.query(
        'SELECT id FROM categories WHERE parent_id IS NULL AND LOWER(name) = LOWER(?)',
        [item.name]
      );
      if (rows.length === 0) {
        const slug = item.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        await pool.query(
          'INSERT INTO categories (name, slug, type, description, order_index, is_active) VALUES (?, ?, ?, ?, ?, 1)',
          [item.name, slug, item.type, item.description, item.order]
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
  if (typeof val === 'number') return val === 1;
  if (typeof val === 'boolean') return val;
  if (typeof val === 'string') return val.toLowerCase() === 'true' || val === '1';
  return Boolean(val);
};

const mapCategoryRow = (c) => ({
  id: c.id,
  parentId: c.parent_id,
  name: c.name,
  slug: c.slug,
  type: c.type || 'General',
  description: c.description,
  imageUrl: c.image_url,
  iconUrl: c.icon_url,
  bannerUrl: c.banner_url,
  orderIndex: c.order_index || 0,
  isActive: parseIsActive(c.is_active),
  seoTitle: c.seo_title,
  metaDescription: c.meta_description,
  metaKeywords: c.meta_keywords,
  createdAt: c.created_at
});

exports.getAllCategories = async (req, res, next) => {
  try {
    await ensureCategoryTableExists();
    const activeOnly = req.query.activeOnly === 'true';
    const query = activeOnly
      ? 'SELECT * FROM categories WHERE is_active = 1 OR is_active = b\'1\' OR is_active IS TRUE ORDER BY order_index ASC, id ASC'
      : 'SELECT * FROM categories ORDER BY order_index ASC, id ASC';
    const [rows] = await pool.query(query);
    const categories = rows.map(mapCategoryRow);
    return res.status(200).json(ApiResponse.success(categories, 'Categories retrieved successfully'));
  } catch (err) {
    next(err);
  }
};

exports.getCategoryTree = async (req, res, next) => {
  try {
    await ensureCategoryTableExists();
    const includeAll = req.query.all === 'true';
    const query = includeAll
      ? 'SELECT * FROM categories ORDER BY order_index ASC, id ASC'
      : 'SELECT * FROM categories WHERE is_active = 1 OR is_active = b\'1\' OR is_active IS TRUE ORDER BY order_index ASC, id ASC';
    const [rows] = await pool.query(query);
    const categories = rows.map(mapCategoryRow);

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
    if (!dto.name) {
      return res.status(400).json(ApiResponse.error('Category name is required'));
    }

    const slug = dto.slug || dto.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    let parentIdVal = dto.parentId ? parseInt(dto.parentId, 10) : null;
    if (parentIdVal) {
      const [validParent] = await pool.query('SELECT id FROM categories WHERE id = ?', [parentIdVal]);
      if (validParent.length === 0) parentIdVal = null;
    }

    const [result] = await pool.query(
      `INSERT INTO categories 
       (parent_id, name, slug, type, description, image_url, icon_url, banner_url, order_index, is_active, seo_title, meta_description, meta_keywords, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        parentIdVal,
        dto.name.trim(),
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
      updates.push('name = ?'); params.push(dto.name);
      updates.push('slug = ?'); params.push(dto.slug || dto.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
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
    try {
      await pool.query('DELETE FROM categories WHERE id = ?', [id]);
      return res.status(200).json(ApiResponse.success(null, 'Category deleted successfully'));
    } catch (dbErr) {
      if (dbErr.code === 'ER_ROW_IS_REFERENCED_2' || dbErr.errno === 1451) {
        return res.status(400).json(ApiResponse.error('Cannot delete category because existing products are assigned to it. Please reassign or delete those products first.'));
      }
      throw dbErr;
    }
  } catch (err) {
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

exports.toggleStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const active = req.query.active !== undefined ? req.query.active === 'true' : null;

    const [rows] = await pool.query('SELECT is_active FROM categories WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json(ApiResponse.error('Category not found'));
    }

    const newStatus = active !== null ? (active ? 1 : 0) : (rows[0].is_active ? 0 : 1);
    await pool.query('UPDATE categories SET is_active = ? WHERE id = ?', [newStatus, id]);

    const [updatedRows] = await pool.query('SELECT * FROM categories WHERE id = ?', [id]);
    return res.status(200).json(ApiResponse.success(mapCategoryRow(updatedRows[0]), 'Category status updated successfully'));
  } catch (err) {
    next(err);
  }
};
