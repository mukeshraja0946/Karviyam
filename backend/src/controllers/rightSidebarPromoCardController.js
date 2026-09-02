const pool = require('../config/db');
const ApiResponse = require('../utils/apiResponse');

const DEFAULT_PROMO_CARD = {
  enabled: true,
  badge: 'NEW ARRIVALS',
  title: 'Fresh Styles',
  description: 'Just Landed!',
  buttonText: 'SHOP NOW',
  link: '/new-arrivals',
  imageUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=600',
  bgColor: '#434343',
  textColor: '#FFFFFF'
};

const ensureTableExists = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS right_sidebar_promo_card (
        id INT PRIMARY KEY DEFAULT 1,
        enabled BOOLEAN DEFAULT TRUE,
        badge VARCHAR(255) DEFAULT 'NEW ARRIVALS',
        title VARCHAR(255) DEFAULT 'Fresh Styles',
        description VARCHAR(500) DEFAULT 'Just Landed!',
        button_text VARCHAR(100) DEFAULT 'SHOP NOW',
        link VARCHAR(255) DEFAULT '/new-arrivals',
        image_url LONGTEXT NOT NULL,
        bg_color VARCHAR(50) DEFAULT '#434343',
        text_color VARCHAR(50) DEFAULT '#FFFFFF',
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );
    `);

    const [rows] = await pool.query('SELECT * FROM right_sidebar_promo_card WHERE id = 1');
    if (!rows || rows.length === 0) {
      await pool.query(
        `INSERT INTO right_sidebar_promo_card (id, enabled, badge, title, description, button_text, link, image_url, bg_color, text_color)
         VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          DEFAULT_PROMO_CARD.enabled ? 1 : 0,
          DEFAULT_PROMO_CARD.badge,
          DEFAULT_PROMO_CARD.title,
          DEFAULT_PROMO_CARD.description,
          DEFAULT_PROMO_CARD.buttonText,
          DEFAULT_PROMO_CARD.link,
          DEFAULT_PROMO_CARD.imageUrl,
          DEFAULT_PROMO_CARD.bgColor,
          DEFAULT_PROMO_CARD.textColor
        ]
      );
    }
  } catch (err) {
    console.error('[rightSidebarPromoCardController] Error ensuring table exists:', err.message);
  }
};

const mapRow = (row) => ({
  enabled: Boolean(row.enabled),
  badge: row.badge || 'NEW ARRIVALS',
  title: row.title || 'Fresh Styles',
  description: row.description || 'Just Landed!',
  buttonText: row.button_text || 'SHOP NOW',
  link: row.link || '/new-arrivals',
  imageUrl: row.image_url || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=600',
  bgColor: row.bg_color || '#434343',
  textColor: row.text_color || '#FFFFFF'
});

// GET /api/right-sidebar-promo-card
exports.getPromoCard = async (req, res, next) => {
  try {
    await ensureTableExists();
    const [rows] = await pool.query('SELECT * FROM right_sidebar_promo_card WHERE id = 1');
    const data = rows && rows.length > 0 ? mapRow(rows[0]) : DEFAULT_PROMO_CARD;
    return res.status(200).json(ApiResponse.success(data, 'Right sidebar promotional card retrieved'));
  } catch (err) {
    next(err);
  }
};

// PUT /api/right-sidebar-promo-card (Admin Update)
exports.updatePromoCard = async (req, res, next) => {
  try {
    await ensureTableExists();
    const { enabled, badge, title, description, buttonText, link, imageUrl, bgColor, textColor } = req.body;

    const enabledVal = enabled === true || enabled === 1 || enabled === 'true' ? 1 : 0;
    const badgeVal = badge !== undefined ? badge.trim() : 'NEW ARRIVALS';
    const titleVal = title !== undefined ? title.trim() : 'Fresh Styles';
    const descVal = description !== undefined ? description.trim() : 'Just Landed!';
    const buttonVal = buttonText !== undefined ? buttonText.trim() : 'SHOP NOW';
    const linkVal = link !== undefined ? link.trim() : '/new-arrivals';
    const imageVal = imageUrl ? imageUrl.trim() : 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=600';
    const bgVal = bgColor ? bgColor.trim() : '#434343';
    const textVal = textColor ? textColor.trim() : '#FFFFFF';

    await pool.query(
      `INSERT INTO right_sidebar_promo_card (id, enabled, badge, title, description, button_text, link, image_url, bg_color, text_color)
       VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
       enabled = VALUES(enabled),
       badge = VALUES(badge),
       title = VALUES(title),
       description = VALUES(description),
       button_text = VALUES(button_text),
       link = VALUES(link),
       image_url = VALUES(image_url),
       bg_color = VALUES(bg_color),
       text_color = VALUES(text_color)`,
      [enabledVal, badgeVal, titleVal, descVal, buttonVal, linkVal, imageVal, bgVal, textVal]
    );

    const [updatedRows] = await pool.query('SELECT * FROM right_sidebar_promo_card WHERE id = 1');
    const updatedData = mapRow(updatedRows[0]);
    return res.status(200).json(ApiResponse.success(updatedData, 'Right sidebar promotional card updated successfully'));
  } catch (err) {
    next(err);
  }
};
