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

// GET /api/parent-categories (Public - Enabled only)
exports.getParentCategories = async (req, res, next) => {
  try {
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
