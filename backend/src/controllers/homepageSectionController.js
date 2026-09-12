const pool = require('../config/db');
const ApiResponse = require('../utils/apiResponse');
const recommendationController = require('./recommendationController');

// 17 Default Homepage Section Configs
const DEFAULT_HOMEPAGE_SECTIONS = [
  {
    id: 'hero_banner',
    section_key: 'hero_banner',
    title: 'Main Hero Carousel',
    subtitle: 'Promotional banners and main drops',
    enabled: true,
    position: 1
  },
  {
    id: 'quick_categories',
    section_key: 'quick_categories',
    title: 'Quick Categories',
    subtitle: 'Explore Top Categories',
    enabled: true,
    position: 2
  },
  {
    id: 'recommended',
    section_key: 'recommended',
    title: 'Recommended For You',
    subtitle: 'Handpicked selections based on your style',
    enabled: true,
    display_type: 'grid', // 'horizontal' or 'grid'
    position: 3,
    limit: 10,
    view_all_text: 'View All →',
    view_all_link: '/shop',
    selection_mode: 'auto',
    custom_product_ids: []
  },
  {
    id: 'shop_by_collection',
    section_key: 'shop_by_collection',
    title: 'Shop By Collection',
    subtitle: 'Explore curated fashion collections for every vibe',
    enabled: true,
    position: 4,
    items: [
      { id: 'men', title: 'MEN COLLECTION', subtitle: 'Streetwear & Everyday Fits', image: 'https://images.unsplash.com/photo-1617137968427-85924c800a22?w=800', link: '/shop?category=Men', cta: 'SHOP MEN' },
      { id: 'women', title: 'WOMEN COLLECTION', subtitle: 'Ethnic & Modern Fusion', image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800', link: '/shop?category=Women', cta: 'SHOP WOMEN' },
      { id: 'sneakers', title: 'SNEAKERS & KICKS', subtitle: 'Trending Kicks & Footwear', image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800', link: '/shop?category=Sneakers', cta: 'EXPLORE SNEAKERS' },
      { id: 'jewellery', title: 'JEWELLERY & ACCESSORIES', subtitle: 'Bags, Jewels & Styling Addons', image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800', link: '/shop?category=Jewels', cta: 'SHOP ACCESSORIES' }
    ]
  },
  {
    id: 'most_loved',
    section_key: 'most_loved',
    title: 'Most-Loved Fashion',
    subtitle: 'Top-rated favorites handpicked by our community',
    enabled: true,
    display_type: 'grid',
    position: 5,
    limit: 10,
    view_all_text: 'View All →',
    view_all_link: '/shop?filter=loved',
    selection_mode: 'auto',
    custom_product_ids: []
  },
  {
    id: 'find_your_price',
    section_key: 'find_your_price',
    title: 'Find Your Price',
    subtitle: 'Shop budget-friendly fashion styles',
    enabled: true,
    position: 6
  },
  {
    id: 'trending',
    section_key: 'trending',
    title: 'Trending Now',
    subtitle: 'Popular styles customers are loving right now',
    enabled: true,
    display_type: 'horizontal',
    position: 7,
    limit: 10,
    view_all_text: 'View All →',
    view_all_link: '/shop?filter=trending',
    selection_mode: 'auto',
    custom_product_ids: []
  },
  {
    id: 'full_width_promo',
    section_key: 'full_width_promo',
    title: 'Full-Width Promotional Banner',
    subtitle: 'Festive & Seasonal Highlights',
    enabled: true,
    position: 8,
    banner: {
      badge: 'FESTIVE SALE',
      title: 'UP TO 60% OFF',
      subtitle: 'Refresh Your Wardrobe With Premium Karviyam Collections',
      ctaText: 'SHOP FESTIVE DROP',
      ctaLink: '/shop?filter=offers',
      bgImage: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1600'
    }
  },
  {
    id: 'shop_your_style',
    section_key: 'shop_your_style',
    title: 'Shop Your Style',
    subtitle: 'Find clothing tailored to your aesthetic',
    enabled: true,
    position: 9,
    styles: [
      { id: 'streetwear', name: 'STREETWEAR', image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=600', link: '/shop?style=Streetwear' },
      { id: 'casual', name: 'CASUAL', image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600', link: '/shop?style=Casual' },
      { id: 'formal', name: 'FORMAL', image: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600', link: '/shop?style=Formal' },
      { id: 'party', name: 'PARTY', image: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=600', link: '/shop?style=Party' },
      { id: 'sports', name: 'SPORTS', image: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=600', link: '/shop?style=Sports' },
      { id: 'everyday', name: 'EVERYDAY', image: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=600', link: '/shop?style=Everyday' }
    ]
  },
  {
    id: 'deals_grid',
    section_key: 'deals_grid',
    title: "Deals You Can't Miss",
    subtitle: 'Exclusive discounts & price-drop steals',
    enabled: true,
    position: 10,
    deals: [
      { id: 'deal1', title: 'UNDER ₹499', subtitle: 'Budget Essentials', discountText: 'STARTING AT ₹199', image: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=600', cta: 'SHOP UNDER ₹499', link: '/shop?max_price=499' },
      { id: 'deal2', title: 'UNDER ₹999', subtitle: 'Trendy Premium Fits', discountText: 'FLAT 50% OFF', image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=600', cta: 'SHOP UNDER ₹999', link: '/shop?max_price=999' },
      { id: 'deal3', title: 'UP TO 50% OFF', subtitle: 'Season End Sale', discountText: 'LIMITED STOCK', image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600', cta: 'VIEW SALE', link: '/shop?filter=offers' },
      { id: 'deal4', title: 'BUY MORE SAVE MORE', subtitle: 'Bundle Discounts', discountText: 'EXTRA 15% OFF', image: 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=600', cta: 'SHOP BUNDLES', link: '/shop?filter=bundles' }
    ]
  },
  {
    id: 'new_arrivals',
    section_key: 'new_arrivals',
    title: 'New Arrivals',
    subtitle: 'Fresh drops straight from our design studio',
    enabled: true,
    display_type: 'grid',
    position: 11,
    limit: 10,
    view_all_text: 'View All →',
    view_all_link: '/shop?filter=new',
    selection_mode: 'auto',
    custom_product_ids: []
  },
  {
    id: 'why_shop',
    section_key: 'why_shop',
    title: 'Why Shop With Karviyam?',
    subtitle: 'Our guarantee to every single customer',
    enabled: true,
    position: 12
  },
  {
    id: 'customer_reviews',
    section_key: 'customer_reviews',
    title: 'What Our Customers Say',
    subtitle: 'Real feedback from verified Karviyam buyers',
    enabled: true,
    position: 13
  },
  {
    id: 'style_inspiration',
    section_key: 'style_inspiration',
    title: 'Style Inspiration',
    subtitle: 'Get inspired by our curated lookbooks & outfit guides',
    enabled: true,
    position: 14,
    looks: [
      { id: 'look1', title: 'Streetwear Vibe', tag: '#STREETWEAR', image: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=600', link: '/shop?style=Streetwear' },
      { id: 'look2', title: 'Weekend Comfort', tag: '#CASUAL', image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600', link: '/shop?style=Casual' },
      { id: 'look3', title: 'Festive Glam', tag: '#ETHNIC', image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600', link: '/shop?category=Women' },
      { id: 'look4', title: 'Active Essentials', tag: '#SPORTS', image: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=600', link: '/shop?category=Sneakers' }
    ]
  },
  {
    id: 'newsletter_cta',
    section_key: 'newsletter_cta',
    title: 'GET 10% OFF YOUR FIRST ORDER',
    subtitle: 'Join the Karviyam community for exclusive drops & discounts',
    enabled: true,
    position: 15,
    discountCode: 'KARVIYAM10'
  },
  {
    id: 'final_cta',
    section_key: 'final_cta',
    title: 'READY TO REFRESH YOUR STYLE?',
    subtitle: 'Discover the latest streetwear & luxury fashion collections from Karviyam',
    enabled: true,
    position: 16,
    ctaMenText: 'SHOP MEN',
    ctaMenLink: '/shop?category=Men',
    ctaWomenText: 'SHOP WOMEN',
    ctaWomenLink: '/shop?category=Women',
    bgImage: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1600'
  },
  {
    id: 'trust_features',
    section_key: 'trust_features',
    title: 'Trust Badges & Guarantees',
    subtitle: '100% Secure Checkout & Original Products',
    enabled: true,
    position: 17
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
      const limit = parseInt(sec.limit) || 10;
      let products = [];
      let reviewsList = [];
      let pinnedProducts = [];

      try {
        if (sec.id === 'customer_reviews' || sec.section_key === 'customer_reviews') {
          const [revRows] = await pool.query(`
            SELECT r.*, p.name as product_name, p.image_url as product_image
            FROM reviews r
            LEFT JOIN products p ON r.product_id = p.id
            WHERE r.status = 'Approved'
            ORDER BY r.rating DESC, r.id DESC
            LIMIT 10
          `);
          reviewsList = revRows;
        } else if (['recommended', 'trending', 'most_loved', 'new_arrivals', 'starting_199'].includes(sec.id) || ['recommended', 'trending', 'most_loved', 'new_arrivals', 'starting_199'].includes(sec.section_key)) {
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

          if (sec.selection_mode === 'custom') {
            products = pinnedProducts;
          } else {
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
              } else if (sec.id === 'new_arrivals' || sec.section_key === 'new_arrivals') {
                const [newProds] = await pool.query(
                  `SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.is_active = true AND p.stock_quantity > 0 ORDER BY p.created_at DESC, p.id DESC LIMIT ?`,
                  [needed]
                );
                autoProducts = newProds;
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
        }
      } catch (errProd) {
        console.warn(`[Homepage Section Error - ${sec.id}]:`, errProd.message);
      }

      resultSections.push({
        ...sec,
        id: sec.id,
        section_key: sec.section_key || sec.id,
        title: sec.title,
        subtitle: sec.subtitle || '',
        enabled: sec.enabled !== false,
        display_type: sec.display_type || 'grid',
        position: parseInt(sec.position) || 1,
        limit: limit,
        selection_mode: sec.selection_mode || 'auto',
        view_all_text: sec.view_all_text || 'View All →',
        view_all_link: sec.view_all_link || '/shop',
        products,
        reviews: reviewsList
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
      ...sec,
      id: sec.id || `sec_${idx + 1}`,
      section_key: sec.section_key || sec.id || `sec_${idx + 1}`,
      title: String(sec.title || '').trim() || 'Featured Section',
      subtitle: String(sec.subtitle || '').trim(),
      enabled: sec.enabled !== false,
      display_type: sec.display_type === 'horizontal' ? 'horizontal' : 'grid',
      position: parseInt(sec.position) || (idx + 1),
      limit: parseInt(sec.limit) || 10,
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
