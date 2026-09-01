const pool = require('../config/db');
const ApiResponse = require('../utils/apiResponse');

// Default Homepage Section Configs
const DEFAULT_HOMEPAGE_SECTIONS = [
  {
    id: 'trending',
    section_key: 'trending',
    title: 'Trending',
    subtitle: 'Popular styles customers are loving right now',
    enabled: true,
    display_type: 'horizontal', // 'horizontal' or 'grid'
    position: 1,
    limit: 8,
    view_all_text: 'View All →',
    view_all_link: '/shop?filter=trending',
    selection_mode: 'auto', // 'auto' or 'custom'
    custom_product_ids: []
  },
  {
    id: 'most_loved',
    section_key: 'most_loved',
    title: 'Most-Loved Fashion for You',
    subtitle: 'Top-rated favorites handpicked for your style',
    enabled: true,
    display_type: 'grid', // 'horizontal' or 'grid'
    position: 2,
    limit: 8,
    view_all_text: 'View All →',
    view_all_link: '/shop?filter=loved',
    selection_mode: 'auto',
    custom_product_ids: []
  },
  {
    id: 'starting_199',
    section_key: 'starting_199',
    title: 'Starting @ ₹199',
    subtitle: 'Unbeatable value on budget-friendly fashion & essentials',
    enabled: true,
    display_type: 'horizontal', // 'horizontal' or 'grid'
    position: 3,
    limit: 8,
    view_all_text: 'Explore Under ₹199 →',
    view_all_link: '/shop?max_price=199',
    selection_mode: 'auto',
    custom_product_ids: []
  }
];

// Helper: Ensure settings table exists
const ensureSettingsTable = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS settings (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        setting_key VARCHAR(100) UNIQUE NOT NULL,
        setting_value TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );
    `);
  } catch (e) {}
};

// Helper: Get Saved Section Configs
const getSectionConfigsFromDb = async () => {
  await ensureSettingsTable();
  try {
    const [rows] = await pool.query("SELECT setting_value FROM settings WHERE setting_key = 'homepage_product_sections' LIMIT 1");
    if (rows.length > 0 && rows[0].setting_value) {
      const parsed = JSON.parse(rows[0].setting_value);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Merge with defaults to ensure all keys exist
        return DEFAULT_HOMEPAGE_SECTIONS.map(def => {
          const found = parsed.find(p => p.id === def.id || p.section_key === def.section_key);
          return found ? { ...def, ...found } : def;
        });
      }
    }
  } catch (e) {}
  return DEFAULT_HOMEPAGE_SECTIONS;
};

// 1. PUBLIC: Get All Dynamic Homepage Sections with DB Products (For Desktop & Mobile)
exports.getPublicHomepageSections = async (req, res, next) => {
  try {
    const configs = await getSectionConfigsFromDb();

    // Filter active sections and sort by position
    const activeSections = configs
      .filter(sec => sec.enabled !== false)
      .sort((a, b) => (parseInt(a.position) || 0) - (parseInt(b.position) || 0));

    const resultSections = [];

    for (const sec of activeSections) {
      const limit = parseInt(sec.limit) || 8;
      let products = [];

      try {
        if (sec.selection_mode === 'custom' && Array.isArray(sec.custom_product_ids) && sec.custom_product_ids.length > 0) {
          const ids = sec.custom_product_ids.map(id => parseInt(id)).filter(id => !isNaN(id));
          if (ids.length > 0) {
            const [prods] = await pool.query(
              `SELECT * FROM products WHERE id IN (?) AND is_active = true LIMIT ?`,
              [ids, limit]
            );
            products = prods;
          }
        }

        // Fallback or Auto Mode
        if (products.length === 0) {
          if (sec.id === 'trending' || sec.section_key === 'trending') {
            const [prods] = await pool.query(
              `SELECT * FROM products WHERE is_active = true ORDER BY is_trending DESC, rating DESC, id DESC LIMIT ?`,
              [limit]
            );
            products = prods;
          } else if (sec.id === 'most_loved' || sec.section_key === 'most_loved') {
            const [prods] = await pool.query(
              `SELECT * FROM products WHERE is_active = true ORDER BY rating DESC, is_best_seller DESC, id DESC LIMIT ?`,
              [limit]
            );
            products = prods;
          } else if (sec.id === 'starting_199' || sec.section_key === 'starting_199') {
            const [prods] = await pool.query(
              `SELECT * FROM products WHERE is_active = true AND price <= 399 ORDER BY price ASC, id DESC LIMIT ?`,
              [limit]
            );
            if (prods.length >= 2) {
              products = prods;
            } else {
              const [fallbackProds] = await pool.query(
                `SELECT * FROM products WHERE is_active = true ORDER BY price ASC, id DESC LIMIT ?`,
                [limit]
              );
              products = fallbackProds;
            }
          } else {
            const [prods] = await pool.query(
              `SELECT * FROM products WHERE is_active = true ORDER BY id DESC LIMIT ?`,
              [limit]
            );
            products = prods;
          }
        }
      } catch (errProd) {
        console.warn(`[Homepage Section Product Error - ${sec.id}]:`, errProd.message);
      }

      resultSections.push({
        id: sec.id,
        section_key: sec.section_key || sec.id,
        title: sec.title,
        subtitle: sec.subtitle || '',
        enabled: sec.enabled !== false,
        display_type: sec.display_type || 'horizontal', // 'horizontal' or 'grid'
        position: parseInt(sec.position) || 1,
        view_all_text: sec.view_all_text || 'View All →',
        view_all_link: sec.view_all_link || '/shop',
        products
      });
    }

    return res.status(200).json(ApiResponse.success(resultSections, 'Homepage sections fetched successfully'));
  } catch (err) {
    next(err);
  }
};

// 2. ADMIN: Get Section Configs & Available Products List
exports.getAdminHomepageSections = async (req, res, next) => {
  try {
    const configs = await getSectionConfigsFromDb();
    
    // Sort all configs by position
    const sortedConfigs = [...configs].sort((a, b) => (parseInt(a.position) || 0) - (parseInt(b.position) || 0));

    // Fetch all active products for custom picker selection
    const [allProducts] = await pool.query(
      `SELECT id, name, price, old_price, image_url, category_name_str, rating FROM products WHERE is_active = true ORDER BY id DESC LIMIT 200`
    );

    return res.status(200).json(ApiResponse.success({
      sections: sortedConfigs,
      availableProducts: allProducts
    }, 'Admin homepage section configurations fetched'));
  } catch (err) {
    next(err);
  }
};

// 3. ADMIN: Save Homepage Section Configurations
exports.updateAdminHomepageSections = async (req, res, next) => {
  try {
    await ensureSettingsTable();
    const { sections } = req.body;

    if (!Array.isArray(sections)) {
      return res.status(400).json(ApiResponse.error('Invalid sections data format. Expected array.'));
    }

    const cleanedSections = sections.map((sec, idx) => ({
      id: sec.id || `sec_${idx + 1}`,
      section_key: sec.section_key || sec.id || `sec_${idx + 1}`,
      title: String(sec.title || '').trim() || 'Featured Section',
      subtitle: String(sec.subtitle || '').trim(),
      enabled: sec.enabled !== false,
      display_type: sec.display_type === 'grid' ? 'grid' : 'horizontal',
      position: parseInt(sec.position) || (idx + 1),
      limit: parseInt(sec.limit) || 8,
      view_all_text: String(sec.view_all_text || 'View All →').trim(),
      view_all_link: String(sec.view_all_link || '/shop').trim(),
      selection_mode: sec.selection_mode === 'custom' ? 'custom' : 'auto',
      custom_product_ids: Array.isArray(sec.custom_product_ids) ? sec.custom_product_ids : []
    }));

    const jsonValue = JSON.stringify(cleanedSections);

    await pool.query(
      `INSERT INTO settings (setting_key, setting_value) VALUES ('homepage_product_sections', ?)
       ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
      [jsonValue]
    );

    return res.status(200).json(ApiResponse.success(cleanedSections, 'Homepage section configurations saved successfully'));
  } catch (err) {
    next(err);
  }
};
