const pool = require('../config/db');
const ApiResponse = require('../utils/apiResponse');
const recommendationController = require('./recommendationController');

// Default Homepage Section Configs
const DEFAULT_HOMEPAGE_SECTIONS = [
  {
    id: 'recommended',
    section_key: 'recommended',
    title: 'Recommended For You',
    subtitle: 'Handpicked selections based on your style',
    enabled: true,
    display_type: 'grid', // 'horizontal' or 'grid'
    position: 1,
    limit: 8,
    view_all_text: 'View All →',
    view_all_link: '/shop',
    selection_mode: 'auto', // 'auto', 'custom', or 'hybrid'
    custom_product_ids: []
  },
  {
    id: 'trending',
    section_key: 'trending',
    title: 'Trending',
    subtitle: 'Popular styles customers are loving right now',
    enabled: true,
    display_type: 'horizontal',
    position: 2,
    limit: 8,
    view_all_text: 'View All →',
    view_all_link: '/shop?filter=trending',
    selection_mode: 'auto',
    custom_product_ids: []
  },
  {
    id: 'most_loved',
    section_key: 'most_loved',
    title: 'Most-Loved Fashion for You',
    subtitle: 'Top-rated favorites handpicked for your style',
    enabled: true,
    display_type: 'grid',
    position: 3,
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
    display_type: 'horizontal',
    position: 4,
    limit: 8,
    view_all_text: 'Explore Under ₹199 →',
    view_all_link: '/shop?max_price=399',
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
        return DEFAULT_HOMEPAGE_SECTIONS.map(def => {
          const found = parsed.find(p => p.id === def.id || p.section_key === def.section_key);
          return found ? { ...def, ...found } : def;
        });
      }
    }
  } catch (e) {}
  return DEFAULT_HOMEPAGE_SECTIONS;
};

// 1. PUBLIC: Get Dynamic Recommendation-Powered Homepage Sections (Desktop & Mobile)
exports.getPublicHomepageSections = async (req, res, next) => {
  try {
    const configs = await getSectionConfigsFromDb();

    const activeSections = configs
      .filter(sec => sec.enabled !== false)
      .sort((a, b) => (parseInt(a.position) || 0) - (parseInt(b.position) || 0));

    const resultSections = [];
    const usedProductIds = new Set();

    for (const sec of activeSections) {
      const limit = parseInt(sec.limit) || 8;
      let products = [];
      let pinnedProducts = [];

      try {
        // Handle Pinned / Custom Products
        if ((sec.selection_mode === 'custom' || sec.selection_mode === 'hybrid') && Array.isArray(sec.custom_product_ids) && sec.custom_product_ids.length > 0) {
          const ids = sec.custom_product_ids.map(id => parseInt(id)).filter(id => !isNaN(id));
          if (ids.length > 0) {
            const [pinned] = await pool.query(
              `SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.id IN (?) AND p.is_active = true LIMIT ?`,
              [ids, limit]
            );
            pinnedProducts = pinned;
            pinned.forEach(p => usedProductIds.add(p.id));
          }
        }

        // If custom mode only and we have custom products
        if (sec.selection_mode === 'custom') {
          products = pinnedProducts;
        } else {
          // Automatic or Hybrid Recommendation Generation
          const needed = limit - pinnedProducts.length;

          if (needed > 0) {
            const reqMock = {
              user: req.user,
              headers: req.headers,
              query: {
                limit: needed,
                exclude: Array.from(usedProductIds).join(',')
              }
            };

            let autoProducts = [];

            if (sec.id === 'recommended' || sec.section_key === 'recommended') {
              const resMock = {
                status: () => ({
                  json: (payload) => {
                    autoProducts = payload.data || [];
                  }
                })
              };
              await recommendationController.getPersonalizedRecommendations(reqMock, resMock, () => {});
            } else if (sec.id === 'trending' || sec.section_key === 'trending') {
              const resMock = {
                status: () => ({
                  json: (payload) => {
                    autoProducts = payload.data || [];
                  }
                })
              };
              await recommendationController.getTrendingProducts(reqMock, resMock, () => {});
            } else if (sec.id === 'most_loved' || sec.section_key === 'most_loved') {
              const resMock = {
                status: () => ({
                  json: (payload) => {
                    autoProducts = payload.data || [];
                  }
                })
              };
              await recommendationController.getMostLovedProducts(reqMock, resMock, () => {});
            } else if (sec.id === 'starting_199' || sec.section_key === 'starting_199') {
              const resMock = {
                status: () => ({
                  json: (payload) => {
                    autoProducts = payload.data || [];
                  }
                })
              };
              await recommendationController.getStartingPriceProducts(reqMock, resMock, () => {});
            } else {
              const [fallbackProds] = await pool.query(
                `SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.is_active = true AND p.stock_quantity > 0 ORDER BY p.id DESC LIMIT ?`,
                [needed]
              );
              autoProducts = fallbackProds;
            }

            autoProducts.forEach(p => usedProductIds.add(p.id));
            products = [...pinnedProducts, ...autoProducts];
          } else {
            products = pinnedProducts;
          }
        }
      } catch (errProd) {
        console.warn(`[Homepage Section Recommendation Error - ${sec.id}]:`, errProd.message);
      }

      resultSections.push({
        id: sec.id,
        section_key: sec.section_key || sec.id,
        title: sec.title,
        subtitle: sec.subtitle || '',
        enabled: sec.enabled !== false,
        display_type: sec.display_type || 'horizontal',
        position: parseInt(sec.position) || 1,
        limit: limit,
        selection_mode: sec.selection_mode || 'auto',
        view_all_text: sec.view_all_text || 'View All →',
        view_all_link: sec.view_all_link || '/shop',
        products
      });
    }

    return res.status(200).json(ApiResponse.success(resultSections, 'Recommendation-powered homepage sections fetched successfully'));
  } catch (err) {
    next(err);
  }
};

// 2. ADMIN: Get Section Configs & Available Products List
exports.getAdminHomepageSections = async (req, res, next) => {
  try {
    const configs = await getSectionConfigsFromDb();
    const sortedConfigs = [...configs].sort((a, b) => (parseInt(a.position) || 0) - (parseInt(b.position) || 0));

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
      selection_mode: ['auto', 'custom', 'hybrid'].includes(sec.selection_mode) ? sec.selection_mode : 'auto',
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
