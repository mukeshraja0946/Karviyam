const pool = require('../config/db');
const ApiResponse = require('../utils/apiResponse');

// DTO Mapper
const mapBanner = (row) => ({
  id: row.id,
  badgeText: row.badge_text || 'LIMITED OFFER',
  title: row.title || '',
  description: row.description || '',
  imageUrl: row.image_url,
  imagePath: row.image_url,
  buttonText: row.button_text || 'SHOP NOW',
  link: row.link || '/shop',
  displayOrder: row.display_order || 1,
  isActive: Boolean(row.is_active),
  createdAt: row.created_at,
  updatedAt: row.updated_at
});

// Helper to ensure table exists & seed default right sidebar banner
const ensureTableExists = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS right_sidebar_banners (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        badge_text VARCHAR(255) DEFAULT 'LIMITED OFFER',
        title VARCHAR(255) NOT NULL,
        description VARCHAR(500) DEFAULT '',
        image_url LONGTEXT NOT NULL,
        button_text VARCHAR(100) DEFAULT 'SHOP NOW',
        link VARCHAR(255) DEFAULT '/shop',
        display_order INT DEFAULT 1,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );
    `);

    const [existing] = await pool.query('SELECT COUNT(*) as count FROM right_sidebar_banners');
    if (!existing || existing[0].count === 0) {
      const defaultBanners = [
        {
          badge_text: 'KARVIYAM',
          title: 'PREMIUM COLLECTION',
          description: 'Timeless styles for every occasion.',
          image_url: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=600',
          button_text: 'EXPLORE NOW',
          link: '/shop',
          display_order: 1
        }
      ];
      for (const b of defaultBanners) {
        await pool.query(
          `INSERT INTO right_sidebar_banners (badge_text, title, description, image_url, button_text, link, display_order, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
          [b.badge_text, b.title, b.description, b.image_url, b.button_text, b.link, b.display_order]
        );
      }
    }
  } catch (err) {
    console.error('[rightSidebarBannerController] Error ensuring table exists:', err.message);
  }
};

// GET /api/right-sidebar-banners (Public - Active only)
exports.getActiveBanners = async (req, res, next) => {
  try {
    await ensureTableExists();
    const [rows] = await pool.query(
      'SELECT * FROM right_sidebar_banners WHERE is_active = 1 ORDER BY display_order ASC, id ASC'
    );
    const dtos = rows.map(mapBanner);
    return res.status(200).json(ApiResponse.success(dtos, 'Active right sidebar banners retrieved successfully'));
  } catch (err) {
    next(err);
  }
};

// GET /api/right-sidebar-banners/admin (Admin - All)
exports.getAllBannersAdmin = async (req, res, next) => {
  try {
    await ensureTableExists();
    const [rows] = await pool.query(
      'SELECT * FROM right_sidebar_banners ORDER BY display_order ASC, id ASC'
    );
    const dtos = rows.map(mapBanner);
    return res.status(200).json(ApiResponse.success(dtos, 'All right sidebar banners retrieved successfully'));
  } catch (err) {
    next(err);
  }
};

// POST /api/right-sidebar-banners (Admin - Create)
exports.createBanner = async (req, res, next) => {
  try {
    await ensureTableExists();
    const { badgeText, title, description, imageUrl, imagePath, buttonText, link, displayOrder, isActive } = req.body;

    const finalImage = imageUrl || imagePath || '';
    if (!finalImage) {
      return res.status(400).json(ApiResponse.error('Banner image is required'));
    }

    const badgeVal = badgeText ? badgeText.trim() : 'LIMITED OFFER';
    const titleVal = title ? title.trim() : 'SPECIAL PROMO';
    const descVal = description ? description.trim() : '';
    const buttonVal = buttonText ? buttonText.trim() : 'SHOP NOW';
    const linkVal = link ? link.trim() : '/shop';
    const orderVal = displayOrder !== undefined ? parseInt(displayOrder, 10) : 1;
    const activeVal = isActive === undefined || isActive === true || isActive === 1 || isActive === 'true' ? 1 : 0;

    const [result] = await pool.query(
      `INSERT INTO right_sidebar_banners (badge_text, title, description, image_url, button_text, link, display_order, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [badgeVal, titleVal, descVal, finalImage, buttonVal, linkVal, orderVal, activeVal]
    );

    const [createdRows] = await pool.query('SELECT * FROM right_sidebar_banners WHERE id = ?', [result.insertId]);
    return res.status(201).json(ApiResponse.success(mapBanner(createdRows[0]), 'Right sidebar banner created successfully'));
  } catch (err) {
    next(err);
  }
};

// PUT /api/right-sidebar-banners/:id (Admin - Update)
exports.updateBanner = async (req, res, next) => {
  try {
    await ensureTableExists();
    const { id } = req.params;
    const { badgeText, title, description, imageUrl, imagePath, buttonText, link, displayOrder, isActive } = req.body;

    const [existing] = await pool.query('SELECT * FROM right_sidebar_banners WHERE id = ?', [id]);
    if (!existing || existing.length === 0) {
      return res.status(404).json(ApiResponse.error('Right sidebar banner not found'));
    }

    const current = existing[0];
    const finalBadge = badgeText !== undefined ? badgeText.trim() : current.badge_text;
    const finalTitle = title !== undefined ? title.trim() : current.title;
    const finalDesc = description !== undefined ? description.trim() : current.description;
    const finalImage = imageUrl || imagePath || current.image_url;
    const finalButton = buttonText !== undefined ? buttonText.trim() : current.button_text;
    const finalLink = link !== undefined ? link.trim() : current.link;
    const finalOrder = displayOrder !== undefined ? parseInt(displayOrder, 10) : current.display_order;
    const finalActive = isActive !== undefined ? (isActive === true || isActive === 1 || isActive === 'true' ? 1 : 0) : current.is_active;

    await pool.query(
      `UPDATE right_sidebar_banners SET badge_text = ?, title = ?, description = ?, image_url = ?, button_text = ?, link = ?, display_order = ?, is_active = ? WHERE id = ?`,
      [finalBadge, finalTitle, finalDesc, finalImage, finalButton, finalLink, finalOrder, finalActive, id]
    );

    const [updatedRows] = await pool.query('SELECT * FROM right_sidebar_banners WHERE id = ?', [id]);
    return res.status(200).json(ApiResponse.success(mapBanner(updatedRows[0]), 'Right sidebar banner updated successfully'));
  } catch (err) {
    next(err);
  }
};

// DELETE /api/right-sidebar-banners/:id (Admin - Delete)
exports.deleteBanner = async (req, res, next) => {
  try {
    await ensureTableExists();
    const { id } = req.params;
    const [existing] = await pool.query('SELECT * FROM right_sidebar_banners WHERE id = ?', [id]);
    if (!existing || existing.length === 0) {
      return res.status(404).json(ApiResponse.error('Right sidebar banner not found'));
    }

    await pool.query('DELETE FROM right_sidebar_banners WHERE id = ?', [id]);
    return res.status(200).json(ApiResponse.success({ id }, 'Right sidebar banner deleted successfully'));
  } catch (err) {
    next(err);
  }
};

// PATCH /api/right-sidebar-banners/:id/toggle (Admin - Toggle Active)
exports.toggleBannerStatus = async (req, res, next) => {
  try {
    await ensureTableExists();
    const { id } = req.params;
    const [existing] = await pool.query('SELECT * FROM right_sidebar_banners WHERE id = ?', [id]);
    if (!existing || existing.length === 0) {
      return res.status(404).json(ApiResponse.error('Right sidebar banner not found'));
    }

    const newStatus = existing[0].is_active ? 0 : 1;
    await pool.query('UPDATE right_sidebar_banners SET is_active = ? WHERE id = ?', [newStatus, id]);

    const [updatedRows] = await pool.query('SELECT * FROM right_sidebar_banners WHERE id = ?', [id]);
    return res.status(200).json(ApiResponse.success(mapBanner(updatedRows[0]), 'Banner status toggled successfully'));
  } catch (err) {
    next(err);
  }
};
