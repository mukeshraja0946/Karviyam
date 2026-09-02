const pool = require('../config/db');
const ApiResponse = require('../utils/apiResponse');

// Helper to format DTO
const mapParentCategory = (row) => ({
  id: row.id,
  categoryId: row.category_id,
  name: row.name,
  imageUrl: row.image_url,
  imagePath: row.image_url,
  displayOrder: row.display_order,
  isActive: Boolean(row.is_active),
  link: row.link || '/shop',
  createdAt: row.created_at,
  updatedAt: row.updated_at
});

// Helper to ensure table exists
const ensureTableExists = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS parent_categories (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        category_id BIGINT DEFAULT NULL,
        name VARCHAR(100) NOT NULL,
        image_url LONGTEXT NOT NULL,
        display_order INT DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        link VARCHAR(255) DEFAULT '/shop',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );
    `);

    const defaultParentCats = [
      { name: 'T-SHIRTS', image_url: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=400', display_order: 1, link: '/shop?category=T-Shirts' },
      { name: 'SNEAKERS', image_url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400', display_order: 2, link: '/shop?category=Sneakers' },
      { name: 'KURTA SETS', image_url: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=400', display_order: 3, link: '/shop?category=Kurta-Sets' },
      { name: 'WOMEN', image_url: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=400', display_order: 4, link: '/shop?category=Women' },
      { name: 'MEN', image_url: 'https://images.unsplash.com/photo-1617137968427-85924c800a22?w=400', display_order: 5, link: '/shop?category=Men' },
      { name: 'KIDS & BABY', image_url: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=400', display_order: 6, link: '/shop?category=Kids' },
      { name: 'UNISEX', image_url: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=400', display_order: 7, link: '/shop?category=Unisex' },
      { name: 'JEWELS', image_url: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=400', display_order: 8, link: '/shop?category=Jewels' },
      { name: 'ACCESSORIES', image_url: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400', display_order: 9, link: '/shop?category=Accessories' },
      { name: 'KITCHEN & HOME', image_url: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=400', display_order: 10, link: '/shop?category=Kitchen' },
      { name: 'SCHOOL & OFFICE', image_url: 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=400', display_order: 11, link: '/shop?category=School' },
      { name: 'BEST SELLERS', image_url: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=400', display_order: 12, link: '/shop?category=Best-Sellers' },
      { name: 'TRENDING NOW', image_url: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=400', display_order: 13, link: '/shop?category=Trending' },
      { name: 'FOOTWEAR', image_url: 'https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=400', display_order: 14, link: '/shop?category=Footwear' },
      { name: 'ETHNIC WEAR', image_url: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=400', display_order: 15, link: '/shop?category=Ethnic-Wear' },
      { name: 'HANDBAGS', image_url: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=400', display_order: 16, link: '/shop?category=Handbags' }
    ];

    for (const cat of defaultParentCats) {
      const [chk] = await pool.query(
        `SELECT id FROM parent_categories WHERE UPPER(TRIM(name)) = ?`,
        [cat.name.trim().toUpperCase()]
      );
      if (!chk || chk.length === 0) {
        await pool.query(
          `INSERT INTO parent_categories (name, image_url, display_order, is_active, link) VALUES (?, ?, ?, 1, ?)`,
          [cat.name, cat.image_url, cat.display_order, cat.link]
        );
      }
    }

    // Heal broken/invalid text image URLs stored in MySQL database
    await pool.query(`
      UPDATE parent_categories 
      SET image_url = 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=400' 
      WHERE UPPER(TRIM(name)) = 'WOMEN' AND (image_url = 'WOMEN' OR image_url IS NULL OR image_url = '' OR (image_url NOT LIKE 'http%' AND image_url NOT LIKE '/%'))
    `).catch(() => null);

    await pool.query(`
      UPDATE parent_categories 
      SET image_url = 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=400' 
      WHERE UPPER(TRIM(name)) = 'MEN' AND (image_url = 'MEN' OR image_url IS NULL OR image_url = '' OR (image_url NOT LIKE 'http%' AND image_url NOT LIKE '/%'))
    `).catch(() => null);

    await pool.query(`
      UPDATE parent_categories 
      SET image_url = 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=400' 
      WHERE (UPPER(TRIM(name)) = 'KIDS & BABY' OR UPPER(TRIM(name)) = 'KIDS') AND (image_url LIKE '%KIDS%' OR image_url IS NULL OR image_url = '' OR (image_url NOT LIKE 'http%' AND image_url NOT LIKE '/%'))
    `).catch(() => null);

    await pool.query(`
      UPDATE parent_categories 
      SET image_url = 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=400' 
      WHERE UPPER(TRIM(name)) = 'UNISEX' AND (image_url = 'UNISEX' OR image_url IS NULL OR image_url = '' OR (image_url NOT LIKE 'http%' AND image_url NOT LIKE '/%'))
    `).catch(() => null);
  } catch (err) {
    console.error('[parentCategoryController] Error ensuring table exists:', err.message);
  }
};

// GET /api/parent-categories (Public - Enabled only)
exports.getParentCategories = async (req, res, next) => {
  try {
    await ensureTableExists();
    const [rows] = await pool.query(
      'SELECT * FROM parent_categories WHERE is_active = 1 ORDER BY display_order ASC, id ASC'
    );
    const dtos = rows.map(mapParentCategory);
    return res.status(200).json(ApiResponse.success(dtos, 'Active parent categories fetched successfully'));
  } catch (err) {
    next(err);
  }
};

// GET /api/parent-categories/admin (Admin - All)
exports.getAllParentCategoriesAdmin = async (req, res, next) => {
  try {
    await ensureTableExists();
    const [rows] = await pool.query(
      'SELECT * FROM parent_categories ORDER BY display_order ASC, id ASC'
    );
    const dtos = rows.map(mapParentCategory);
    return res.status(200).json(ApiResponse.success(dtos, 'All parent categories fetched successfully'));
  } catch (err) {
    next(err);
  }
};

// POST /api/parent-categories (Admin - Create)
exports.createParentCategory = async (req, res, next) => {
  try {
    await ensureTableExists();
    const { name, imageUrl, imagePath, displayOrder, isActive, link, categoryId } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json(ApiResponse.error('Category name is required'));
    }

    const finalImage = imageUrl || imagePath || '';
    if (!finalImage) {
      return res.status(400).json(ApiResponse.error('Category image is required'));
    }

    const orderVal = displayOrder !== undefined ? parseInt(displayOrder, 10) : 0;
    const activeVal = isActive === undefined || isActive === true || isActive === 1 || isActive === 'true' ? 1 : 0;
    const linkVal = link || `/shop?category=${encodeURIComponent(name.trim())}`;
    const catIdVal = categoryId ? parseInt(categoryId, 10) : null;

    const [result] = await pool.query(
      `INSERT INTO parent_categories (category_id, name, image_url, display_order, is_active, link)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [catIdVal, name.trim(), finalImage, orderVal, activeVal, linkVal]
    );

    const [inserted] = await pool.query('SELECT * FROM parent_categories WHERE id = ?', [result.insertId]);
    return res.status(201).json(ApiResponse.success(mapParentCategory(inserted[0]), 'Parent category created successfully'));
  } catch (err) {
    next(err);
  }
};

// PUT /api/parent-categories/reorder (Admin - Bulk reorder)
exports.reorderParentCategories = async (req, res, next) => {
  try {
    const { items } = req.body; // Array of { id, displayOrder }
    if (Array.isArray(items)) {
      for (const item of items) {
        if (item.id !== undefined && item.displayOrder !== undefined) {
          await pool.query(
            'UPDATE parent_categories SET display_order = ? WHERE id = ?',
            [parseInt(item.displayOrder, 10), item.id]
          );
        }
      }
    }
    return res.status(200).json(ApiResponse.success(null, 'Parent categories reordered successfully'));
  } catch (err) {
    next(err);
  }
};

// PUT /api/parent-categories/:id (Admin - Update)
exports.updateParentCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, imageUrl, imagePath, displayOrder, isActive, link, categoryId } = req.body;

    const [existing] = await pool.query('SELECT * FROM parent_categories WHERE id = ?', [id]);
    if (!existing || existing.length === 0) {
      return res.status(404).json(ApiResponse.error('Parent category not found'));
    }

    const current = existing[0];
    const nameVal = name !== undefined ? name.trim() : current.name;
    const finalImage = imageUrl || imagePath || current.image_url;
    const orderVal = displayOrder !== undefined ? parseInt(displayOrder, 10) : current.display_order;
    const activeVal = isActive !== undefined ? (isActive === true || isActive === 1 || isActive === 'true' ? 1 : 0) : current.is_active;
    const linkVal = link !== undefined ? link : current.link;
    const catIdVal = categoryId !== undefined ? (categoryId ? parseInt(categoryId, 10) : null) : current.category_id;

    await pool.query(
      `UPDATE parent_categories SET 
        category_id = ?, name = ?, image_url = ?, display_order = ?, is_active = ?, link = ?
       WHERE id = ?`,
      [catIdVal, nameVal, finalImage, orderVal, activeVal, linkVal, id]
    );

    const [updated] = await pool.query('SELECT * FROM parent_categories WHERE id = ?', [id]);
    return res.status(200).json(ApiResponse.success(mapParentCategory(updated[0]), 'Parent category updated successfully'));
  } catch (err) {
    next(err);
  }
};

// DELETE /api/parent-categories/:id (Admin - Delete card only)
exports.deleteParentCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [existing] = await pool.query('SELECT * FROM parent_categories WHERE id = ?', [id]);
    if (!existing || existing.length === 0) {
      return res.status(404).json(ApiResponse.error('Parent category not found'));
    }

    await pool.query('DELETE FROM parent_categories WHERE id = ?', [id]);
    return res.status(200).json(ApiResponse.success(null, 'Parent category deleted successfully'));
  } catch (err) {
    next(err);
  }
};

exports.deleteAllParentCategories = async (req, res, next) => {
  let conn;
  try {
    await ensureTableExists();
    conn = await pool.getConnection();
    await conn.beginTransaction();

    const [cnt] = await conn.query('SELECT COUNT(*) as c FROM parent_categories');
    const totalCount = cnt[0]?.c || 0;

    await conn.query('DELETE FROM parent_categories');

    await conn.commit();
    conn.release();
    conn = null;

    try {
      const { logAudit } = require('../utils/auditLogger');
      await logAudit({
        adminId: req.user?.id || 1,
        action: 'CLEAR_ALL_PARENT_CATEGORIES',
        targetType: 'Parent Categories',
        details: `Successfully cleared all ${totalCount} parent categories in a single bulk operation.`
      });
    } catch (eAudit) {}

    return res.status(200).json(ApiResponse.success(
      { deletedCount: totalCount },
      `Successfully deleted ${totalCount} parent categories.`
    ));
  } catch (err) {
    if (conn) {
      try { await conn.rollback(); } catch (eRb) {}
      try { conn.release(); } catch (eRel) {}
    }
    next(err);
  }
};

exports.deleteSelectedParentCategories = async (req, res, next) => {
  let conn;
  try {
    const { ids } = req.body || {};
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json(ApiResponse.error('No parent category IDs provided for batch deletion'));
    }

    await ensureTableExists();
    conn = await pool.getConnection();
    await conn.beginTransaction();

    const cleanIds = ids.map(id => String(id).trim()).filter(Boolean);
    if (cleanIds.length === 0) {
      return res.status(400).json(ApiResponse.error('Invalid parent category IDs'));
    }

    const [delRes] = await conn.query('DELETE FROM parent_categories WHERE id IN (?)', [cleanIds]);
    const deletedCount = delRes.affectedRows || cleanIds.length;

    await conn.commit();
    conn.release();
    conn = null;

    try {
      const { logAudit } = require('../utils/auditLogger');
      await logAudit({
        adminId: req.user?.id || 1,
        action: 'DELETE_BATCH',
        targetType: 'Parent Categories',
        details: `Deleted ${deletedCount} selected parent categories.`
      });
    } catch (eAudit) {}

    return res.status(200).json(ApiResponse.success(
      { deletedCount },
      `Successfully deleted ${deletedCount} selected parent categories.`
    ));
  } catch (err) {
    if (conn) {
      try { await conn.rollback(); } catch (eRb) {}
      try { conn.release(); } catch (eRel) {}
    }
    next(err);
  }
};
