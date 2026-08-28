const pool = require('../config/db');
const ApiResponse = require('../utils/apiResponse');

// DTO mapper
const mapPromoCard = (row) => ({
  id: row.id,
  title: row.title || '',
  subtitle: row.subtitle || '',
  imageUrl: row.image_url,
  imagePath: row.image_url,
  displayOrder: row.display_order || 1,
  isActive: Boolean(row.is_active),
  link: row.link || '/shop',
  createdAt: row.created_at,
  updatedAt: row.updated_at
});

// Helper to ensure table exists
const ensureTableExists = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS promo_cards (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255),
        subtitle VARCHAR(255),
        image_url LONGTEXT NOT NULL,
        display_order INT DEFAULT 1,
        is_active BOOLEAN DEFAULT TRUE,
        link VARCHAR(255) DEFAULT '/shop',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );
    `);

    const [existingPromo] = await pool.query('SELECT COUNT(*) as count FROM promo_cards');
    if (!existingPromo || existingPromo[0].count === 0) {
      const defaultPromos = [
        {
          title: 'FESTIVE SPECIAL',
          subtitle: 'UP TO 60% OFF On Bestsellers',
          image_url: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600',
          display_order: 1,
          link: '/shop?filter=bestsellers'
        }
      ];
      for (const p of defaultPromos) {
        await pool.query(
          `INSERT INTO promo_cards (title, subtitle, image_url, display_order, is_active, link) VALUES (?, ?, ?, ?, 1, ?)`,
          [p.title, p.subtitle, p.image_url, p.display_order, p.link]
        );
      }
    }
  } catch (err) {
    console.error('[promoCardController] Error ensuring table exists:', err.message);
  }
};

// GET /api/promo-cards (Public - Active only)
exports.getPromoCards = async (req, res, next) => {
  try {
    await ensureTableExists();
    const [rows] = await pool.query(
      'SELECT * FROM promo_cards WHERE is_active = 1 ORDER BY display_order ASC, id ASC'
    );
    const dtos = rows.map(mapPromoCard);
    return res.status(200).json(ApiResponse.success(dtos, 'Active promotional cards retrieved successfully'));
  } catch (err) {
    next(err);
  }
};

// GET /api/promo-cards/admin (Admin - All)
exports.getAllPromoCardsAdmin = async (req, res, next) => {
  try {
    await ensureTableExists();
    const [rows] = await pool.query(
      'SELECT * FROM promo_cards ORDER BY display_order ASC, id ASC'
    );
    const dtos = rows.map(mapPromoCard);
    return res.status(200).json(ApiResponse.success(dtos, 'All promotional cards retrieved successfully'));
  } catch (err) {
    next(err);
  }
};

// POST /api/promo-cards (Admin - Create)
exports.createPromoCard = async (req, res, next) => {
  try {
    await ensureTableExists();
    const { title, subtitle, imageUrl, imagePath, displayOrder, isActive, link } = req.body;

    const finalImage = imageUrl || imagePath || '';
    if (!finalImage) {
      return res.status(400).json(ApiResponse.error('Promotional image is required'));
    }

    const titleVal = title ? title.trim() : '';
    const subtitleVal = subtitle ? subtitle.trim() : '';
    const orderVal = displayOrder !== undefined ? parseInt(displayOrder, 10) : 1;
    const activeVal = isActive === undefined || isActive === true || isActive === 1 || isActive === 'true' ? 1 : 0;
    const linkVal = link ? link.trim() : '/shop';

    const [result] = await pool.query(
      `INSERT INTO promo_cards (title, subtitle, image_url, display_order, is_active, link)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [titleVal, subtitleVal, finalImage, orderVal, activeVal, linkVal]
    );

    const [inserted] = await pool.query('SELECT * FROM promo_cards WHERE id = ?', [result.insertId]);
    return res.status(201).json(ApiResponse.success(mapPromoCard(inserted[0]), 'Promotional card created successfully'));
  } catch (err) {
    next(err);
  }
};

// PUT /api/promo-cards/reorder (Admin - Bulk reorder)
exports.reorderPromoCards = async (req, res, next) => {
  try {
    const { items } = req.body; // Array of { id, displayOrder }
    if (Array.isArray(items)) {
      for (const item of items) {
        if (item.id !== undefined && item.displayOrder !== undefined) {
          await pool.query(
            'UPDATE promo_cards SET display_order = ? WHERE id = ?',
            [parseInt(item.displayOrder, 10), item.id]
          );
        }
      }
    }
    return res.status(200).json(ApiResponse.success(null, 'Promotional cards reordered successfully'));
  } catch (err) {
    next(err);
  }
};

// PUT /api/promo-cards/:id (Admin - Update)
exports.updatePromoCard = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, subtitle, imageUrl, imagePath, displayOrder, isActive, link } = req.body;

    const [existing] = await pool.query('SELECT * FROM promo_cards WHERE id = ?', [id]);
    if (!existing || existing.length === 0) {
      return res.status(404).json(ApiResponse.error('Promotional card not found'));
    }

    const current = existing[0];
    const titleVal = title !== undefined ? title.trim() : current.title;
    const subtitleVal = subtitle !== undefined ? subtitle.trim() : current.subtitle;
    const finalImage = imageUrl || imagePath || current.image_url;
    const orderVal = displayOrder !== undefined ? parseInt(displayOrder, 10) : current.display_order;
    const activeVal = isActive !== undefined ? (isActive === true || isActive === 1 || isActive === 'true' ? 1 : 0) : current.is_active;
    const linkVal = link !== undefined ? link.trim() : current.link;

    await pool.query(
      `UPDATE promo_cards SET 
        title = ?, subtitle = ?, image_url = ?, display_order = ?, is_active = ?, link = ?
       WHERE id = ?`,
      [titleVal, subtitleVal, finalImage, orderVal, activeVal, linkVal, id]
    );

    const [updated] = await pool.query('SELECT * FROM promo_cards WHERE id = ?', [id]);
    return res.status(200).json(ApiResponse.success(mapPromoCard(updated[0]), 'Promotional card updated successfully'));
  } catch (err) {
    next(err);
  }
};

// DELETE /api/promo-cards/:id (Admin - Delete)
exports.deletePromoCard = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [existing] = await pool.query('SELECT * FROM promo_cards WHERE id = ?', [id]);
    if (!existing || existing.length === 0) {
      return res.status(404).json(ApiResponse.error('Promotional card not found'));
    }

    await pool.query('DELETE FROM promo_cards WHERE id = ?', [id]);
    return res.status(200).json(ApiResponse.success(null, 'Promotional card deleted successfully'));
  } catch (err) {
    next(err);
  }
};

exports.deleteAllPromoCards = async (req, res, next) => {
  try {
    const [cnt] = await pool.query('SELECT COUNT(*) as c FROM promo_cards');
    const totalCount = cnt[0]?.c || 0;

    await pool.query('DELETE FROM promo_cards');

    try {
      const { logAudit } = require('../utils/auditLogger');
      await logAudit({
        adminId: req.user?.id || 1,
        action: 'CLEAR_ALL',
        targetType: 'Promo Cards',
        details: `Successfully cleared all ${totalCount} promotional cards.`
      });
    } catch (eAudit) {}

    return res.status(200).json(ApiResponse.success(
      { deletedCount: totalCount },
      `Successfully deleted ${totalCount} promotional cards.`
    ));
  } catch (err) {
    next(err);
  }
};
