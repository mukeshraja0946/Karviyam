const pool = require('../config/db');
const ApiResponse = require('../utils/apiResponse');
const recommendationController = require('./recommendationController');

// Default Homepage Section Configs covering ALL Homepage Product Sections
const DEFAULT_HOMEPAGE_SECTIONS = [
  {
    id: 'recommended',
    section_key: 'recommended',
    title: 'Recommended For You',
    subtitle: 'Handpicked selections based on your style',
    enabled: true,
    position: 1,
    desktop_layout: 'carousel_2_rows', // 'carousel', 'carousel_2_rows', 'grid'
    desktop_product_count: 6,
    desktop_max_products: 12,
    mobile_layout: 'carousel', // 'carousel', 'grid_2_col'
    mobile_product_count: 6,
    mobile_max_products: 12,
    show_view_all: true,
    view_all_text: 'View All →',
    view_all_link: '/shop',
    selection_mode: 'auto',
    custom_product_ids: []
  },
  {
    id: 'new_arrivals',
    section_key: 'new_arrivals',
    title: 'New Arrivals',
    subtitle: 'Explore the latest fashion drops & arrivals',
    enabled: true,
    position: 2,
    desktop_layout: 'carousel',
    desktop_product_count: 6,
    desktop_max_products: 12,
    mobile_layout: 'carousel',
    mobile_product_count: 6,
    mobile_max_products: 12,
    show_view_all: true,
    view_all_text: 'View All →',
    view_all_link: '/shop?filter=new',
    selection_mode: 'auto',
    custom_product_ids: []
  },
  {
    id: 'featured',
    section_key: 'featured',
    title: 'Featured Products',
    subtitle: 'Curated premium items handpicked for you',
    enabled: true,
    position: 3,
    desktop_layout: 'carousel',
    desktop_product_count: 6,
    desktop_max_products: 12,
    mobile_layout: 'carousel',
    mobile_product_count: 6,
    mobile_max_products: 12,
    show_view_all: true,
    view_all_text: 'View All →',
    view_all_link: '/shop?filter=featured',
    selection_mode: 'auto',
    custom_product_ids: []
  },
  {
    id: 'trending',
    section_key: 'trending',
    title: 'Trending Now',
    subtitle: 'Popular styles customers are loving right now',
    enabled: true,
    position: 4,
    desktop_layout: 'carousel',
    desktop_product_count: 6,
    desktop_max_products: 12,
    mobile_layout: 'grid_2_col',
    mobile_product_count: 6,
    mobile_max_products: 12,
    show_view_all: true,
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
    position: 5,
    desktop_layout: 'grid',
    desktop_product_count: 8,
    desktop_max_products: 16,
    mobile_layout: 'grid_2_col',
    mobile_product_count: 6,
    mobile_max_products: 12,
    show_view_all: true,
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
    position: 6,
    desktop_layout: 'carousel',
    desktop_product_count: 6,
    desktop_max_products: 12,
    mobile_layout: 'carousel',
    mobile_product_count: 6,
    mobile_max_products: 12,
    show_view_all: true,
    view_all_text: 'Explore Under ₹199 →',
    view_all_link: '/shop?maxPrice=399',
    selection_mode: 'auto',
    custom_product_ids: []
  },
  {
    id: 'best_sellers',
    section_key: 'best_sellers',
    title: 'Best Sellers',
    subtitle: 'Customer favorite picks & top-rated items',
    enabled: true,
    position: 7,
    desktop_layout: 'carousel',
    desktop_product_count: 6,
    desktop_max_products: 12,
    mobile_layout: 'grid_2_col',
    mobile_product_count: 6,
    mobile_max_products: 12,
    show_view_all: true,
    view_all_text: 'View All →',
    view_all_link: '/shop?filter=bestsellers',
    selection_mode: 'auto',
    custom_product_ids: []
  },
  {
    id: 'flash_picks',
    section_key: 'flash_picks',
    title: 'Flash Picks',
    subtitle: 'Limited-time deals on trending products',
    enabled: true,
    position: 8,
    desktop_layout: 'carousel',
    desktop_product_count: 6,
    desktop_max_products: 12,
    mobile_layout: 'carousel',
    mobile_product_count: 6,
    mobile_max_products: 12,
    show_view_all: true,
    view_all_text: 'View All Deals →',
    view_all_link: '/shop?filter=offers',
    selection_mode: 'auto',
    custom_product_ids: []
  },
  {
    id: 'complete_look',
    section_key: 'complete_look',
    title: 'Complete The Look',
    subtitle: 'Curated style combos matched for you',
    enabled: true,
    position: 9,
    desktop_layout: 'carousel',
    desktop_product_count: 6,
    desktop_max_products: 12,
    mobile_layout: 'carousel',
    mobile_product_count: 6,
    mobile_max_products: 12,
    show_view_all: true,
    view_all_text: 'View Combos →',
    view_all_link: '/shop?filter=combos',
    selection_mode: 'auto',
    custom_product_ids: []
  },
  {
    id: 'popular_picks',
    section_key: 'popular_picks',
    title: 'Popular Products',
    subtitle: 'Most viewed & saved items this week',
    enabled: true,
    position: 10,
    desktop_layout: 'carousel',
    desktop_product_count: 6,
    desktop_max_products: 12,
    mobile_layout: 'carousel',
    mobile_product_count: 6,
    mobile_max_products: 12,
    show_view_all: true,
    view_all_text: 'View All →',
    view_all_link: '/shop?filter=popular',
    selection_mode: 'auto',
    custom_product_ids: []
  },
  {
    id: 'top_offers',
    section_key: 'top_offers',
    title: 'Top Offers & Discounts',
    subtitle: 'Steal deals with up to 60% off',
    enabled: true,
    position: 11,
    desktop_layout: 'carousel',
    desktop_product_count: 6,
    desktop_max_products: 12,
    mobile_layout: 'carousel',
    mobile_product_count: 6,
    mobile_max_products: 12,
    show_view_all: true,
    view_all_text: 'Shop Offers →',
    view_all_link: '/shop?filter=offers',
    selection_mode: 'auto',
    custom_product_ids: []
  },
  {
    id: 'todays_deal',
    section_key: 'todays_deal',
    title: "Today's Special Deal",
    subtitle: 'Exclusive 24-hour price drop on selected items',
    enabled: true,
    position: 12,
    desktop_layout: 'carousel',
    desktop_product_count: 6,
    desktop_max_products: 12,
    mobile_layout: 'carousel',
    mobile_product_count: 6,
    mobile_max_products: 12,
    show_view_all: true,
    view_all_text: "Today's Deals →",
    view_all_link: '/shop?filter=offers',
    selection_mode: 'auto',
    custom_product_ids: []
  },
  {
    id: 'shop_by_occasion',
    section_key: 'shop_by_occasion',
    title: 'Shop by Occasion',
    subtitle: 'Outfits & accessories for every event',
    enabled: true,
    position: 13,
    desktop_layout: 'carousel',
    desktop_product_count: 6,
    desktop_max_products: 12,
    mobile_layout: 'carousel',
    mobile_product_count: 6,
    mobile_max_products: 12,
    show_view_all: true,
    view_all_text: 'Explore Occasions →',
    view_all_link: '/shop',
    selection_mode: 'auto',
    custom_product_ids: []
  },
  {
    id: 'find_your_price',
    section_key: 'find_your_price',
    title: 'Find Your Price Range',
    subtitle: 'Shop products grouped by budget',
    enabled: true,
    position: 14,
    desktop_layout: 'carousel',
    desktop_product_count: 6,
    desktop_max_products: 12,
    mobile_layout: 'carousel',
    mobile_product_count: 6,
    mobile_max_products: 12,
    show_view_all: true,
    view_all_text: 'All Price Ranges →',
    view_all_link: '/shop',
    selection_mode: 'auto',
    custom_product_ids: []
  },
  {
    id: 'premium_collection',
    section_key: 'premium_collection',
    title: 'Premium Store & 925 Silver',
    subtitle: 'Luxury high-end fashion & hallmarked silver',
    enabled: true,
    position: 15,
    desktop_layout: 'carousel',
    desktop_product_count: 6,
    desktop_max_products: 12,
    mobile_layout: 'carousel',
    mobile_product_count: 6,
    mobile_max_products: 12,
    show_view_all: true,
    view_all_text: 'Explore Premium →',
    view_all_link: '/shop?category=Jewellery',
    selection_mode: 'auto',
    custom_product_ids: []
  },
  {
    id: 'mens_collection',
    section_key: 'mens_collection',
    title: "Men's Collection",
    subtitle: 'T-Shirts, Shirts, Sneakers & Casual Wear for Men',
    enabled: false,
    position: 16,
    desktop_layout: 'carousel',
    desktop_product_count: 6,
    desktop_max_products: 12,
    mobile_layout: 'carousel',
    mobile_product_count: 6,
    mobile_max_products: 12,
    show_view_all: true,
    view_all_text: "Shop Men's →",
    view_all_link: '/shop?category=Men',
    selection_mode: 'auto',
    custom_product_ids: []
  },
  {
    id: 'womens_collection',
    section_key: 'womens_collection',
    title: "Women's Collection",
    subtitle: 'Ethic wear, Kurtas, Sarees & Western outfits',
    enabled: false,
    position: 17,
    desktop_layout: 'carousel',
    desktop_product_count: 6,
    desktop_max_products: 12,
    mobile_layout: 'carousel',
    mobile_product_count: 6,
    mobile_max_products: 12,
    show_view_all: true,
    view_all_text: "Shop Women's →",
    view_all_link: '/shop?category=Women',
    selection_mode: 'auto',
    custom_product_ids: []
  },
  {
    id: 'kids_collection',
    section_key: 'kids_collection',
    title: 'Kids & Baby Collection',
    subtitle: 'Cute prints & comfortable clothing for kids',
    enabled: false,
    position: 18,
    desktop_layout: 'carousel',
    desktop_product_count: 6,
    desktop_max_products: 12,
    mobile_layout: 'carousel',
    mobile_product_count: 6,
    mobile_max_products: 12,
    show_view_all: true,
    view_all_text: 'Shop Kids →',
    view_all_link: '/shop?category=Kids',
    selection_mode: 'auto',
    custom_product_ids: []
  },
  {
    id: 'unisex_collection',
    section_key: 'unisex_collection',
    title: 'Unisex Collection',
    subtitle: 'Streetwear & oversized fits designed for everyone',
    enabled: true,
    position: 19,
    desktop_layout: 'carousel',
    desktop_product_count: 6,
    desktop_max_products: 12,
    mobile_layout: 'carousel',
    mobile_product_count: 6,
    mobile_max_products: 12,
    show_view_all: true,
    view_all_text: 'Shop Unisex →',
    view_all_link: '/shop?category=Unisex',
    selection_mode: 'auto',
    custom_product_ids: []
  },
  {
    id: 'jewellery_collection',
    section_key: 'jewellery_collection',
    title: 'Jewellery & Jewels',
    subtitle: '925 Sterling Silver rings, pendants & accessories',
    enabled: true,
    position: 20,
    desktop_layout: 'carousel',
    desktop_product_count: 6,
    desktop_max_products: 12,
    mobile_layout: 'carousel',
    mobile_product_count: 6,
    mobile_max_products: 12,
    show_view_all: true,
    view_all_text: 'Shop Jewellery →',
    view_all_link: '/shop?category=Jewellery',
    selection_mode: 'auto',
    custom_product_ids: []
  },
  {
    id: 'accessories_collection',
    section_key: 'accessories_collection',
    title: 'Accessories Collection',
    subtitle: 'Bags, Sunglasses, Caps & Lifestyle Essentials',
    enabled: false,
    position: 21,
    desktop_layout: 'carousel',
    desktop_product_count: 6,
    desktop_max_products: 12,
    mobile_layout: 'carousel',
    mobile_product_count: 6,
    mobile_max_products: 12,
    show_view_all: true,
    view_all_text: 'Shop Accessories →',
    view_all_link: '/shop?category=Accessories',
    selection_mode: 'auto',
    custom_product_ids: []
  },
  {
    id: 'fresh_summer',
    section_key: 'fresh_summer',
    title: 'Fresh Summer Looks',
    subtitle: 'Lightweight linen & vibrant summer apparel',
    enabled: true,
    position: 22,
    desktop_layout: 'carousel',
    desktop_product_count: 6,
    desktop_max_products: 12,
    mobile_layout: 'carousel',
    mobile_product_count: 6,
    mobile_max_products: 12,
    show_view_all: true,
    view_all_text: 'Shop Summer →',
    view_all_link: '/shop?filter=summer',
    selection_mode: 'auto',
    custom_product_ids: []
  },
  {
    id: 'recently_viewed',
    section_key: 'recently_viewed',
    title: 'Recently Viewed',
    subtitle: 'Pick up right where you left off',
    enabled: true,
    position: 23,
    desktop_layout: 'carousel',
    desktop_product_count: 6,
    desktop_max_products: 12,
    mobile_layout: 'carousel',
    mobile_product_count: 6,
    mobile_max_products: 12,
    show_view_all: true,
    view_all_text: 'View All →',
    view_all_link: '/shop',
    selection_mode: 'auto',
    custom_product_ids: []
  },
  {
    id: 'related_products',
    section_key: 'related_products',
    title: 'Related & Similar Products',
    subtitle: 'Matches based on items you explored',
    enabled: true,
    position: 24,
    desktop_layout: 'carousel',
    desktop_product_count: 6,
    desktop_max_products: 12,
    mobile_layout: 'carousel',
    mobile_product_count: 6,
    mobile_max_products: 12,
    show_view_all: true,
    view_all_text: 'View All →',
    view_all_link: '/shop',
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
      .sort((a, b) => (parseInt(a.position || a.display_order) || 0) - (parseInt(b.position || b.display_order) || 0));

    const resultSections = [];
    const usedProductIds = new Set();

    for (const sec of activeSections) {
      const limit = parseInt(sec.desktop_max_products || sec.limit) || 12;
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
                  json: (payload) => { autoProducts = payload.data || []; }
                })
              };
              await recommendationController.getPersonalizedRecommendations(reqMock, resMock, () => {});
            } else if (sec.id === 'trending' || sec.section_key === 'trending') {
              const resMock = {
                status: () => ({
                  json: (payload) => { autoProducts = payload.data || []; }
                })
              };
              await recommendationController.getTrendingProducts(reqMock, resMock, () => {});
            } else if (sec.id === 'most_loved' || sec.section_key === 'most_loved') {
              const resMock = {
                status: () => ({
                  json: (payload) => { autoProducts = payload.data || []; }
                })
              };
              await recommendationController.getMostLovedProducts(reqMock, resMock, () => {});
            } else if (sec.id === 'starting_199' || sec.section_key === 'starting_199') {
              const resMock = {
                status: () => ({
                  json: (payload) => { autoProducts = payload.data || []; }
                })
              };
              await recommendationController.getStartingPriceProducts(reqMock, resMock, () => {});
            } else if (sec.id === 'new_arrivals' || sec.section_key === 'new_arrivals') {
              const [newProds] = await pool.query(
                `SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.is_active = true AND p.stock_quantity > 0 ORDER BY p.created_at DESC, p.id DESC LIMIT ?`,
                [needed]
              );
              autoProducts = newProds;
            } else if (sec.id === 'best_sellers' || sec.section_key === 'best_sellers') {
              const [bestProds] = await pool.query(
                `SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.is_active = true AND p.stock_quantity > 0 ORDER BY p.ratings_count DESC, p.id DESC LIMIT ?`,
                [needed]
              );
              autoProducts = bestProds;
            } else if (sec.id.includes('collection') || sec.id.includes('mens') || sec.id.includes('womens') || sec.id.includes('kids') || sec.id.includes('jewellery') || sec.id.includes('accessories')) {
              let catName = 'FASHION';
              if (sec.id.includes('mens')) catName = 'Men';
              else if (sec.id.includes('womens')) catName = 'Women';
              else if (sec.id.includes('kids')) catName = 'Kids';
              else if (sec.id.includes('jewellery')) catName = 'Jewellery';
              else if (sec.id.includes('accessories')) catName = 'Accessories';
              else if (sec.id.includes('unisex')) catName = 'Unisex';

              const [catProds] = await pool.query(
                `SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.is_active = true AND (c.name LIKE ? OR p.category_name_str LIKE ?) ORDER BY p.id DESC LIMIT ?`,
                [`%${catName}%`, `%${catName}%`, needed]
              );
              autoProducts = catProds;
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
        position: parseInt(sec.position || sec.display_order) || 1,
        desktop_layout: sec.desktop_layout || 'carousel',
        desktop_product_count: parseInt(sec.desktop_product_count) || 6,
        desktop_max_products: parseInt(sec.desktop_max_products) || 12,
        mobile_layout: sec.mobile_layout || 'carousel',
        mobile_product_count: parseInt(sec.mobile_product_count) || 6,
        mobile_max_products: parseInt(sec.mobile_max_products) || 12,
        show_view_all: sec.show_view_all !== false,
        view_all_text: sec.view_all_text || 'View All →',
        view_all_link: sec.view_all_link || '/shop',
        selection_mode: sec.selection_mode || 'auto',
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
    const sortedConfigs = [...configs].sort((a, b) => (parseInt(a.position || a.display_order) || 0) - (parseInt(b.position || b.display_order) || 0));

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
      position: parseInt(sec.position || sec.display_order) || (idx + 1),
      desktop_layout: ['carousel', 'carousel_2_rows', 'grid'].includes(sec.desktop_layout) ? sec.desktop_layout : 'carousel',
      desktop_product_count: parseInt(sec.desktop_product_count) || 6,
      desktop_max_products: parseInt(sec.desktop_max_products) || 12,
      mobile_layout: ['carousel', 'grid_2_col'].includes(sec.mobile_layout) ? sec.mobile_layout : 'carousel',
      mobile_product_count: parseInt(sec.mobile_product_count) || 6,
      mobile_max_products: parseInt(sec.mobile_max_products) || 12,
      show_view_all: sec.show_view_all !== false,
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
