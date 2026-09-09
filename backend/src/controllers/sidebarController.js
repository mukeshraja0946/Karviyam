const pool = require('../config/db');
const ApiResponse = require('../utils/apiResponse');
const { processBase64Images } = require('../utils/base64Helper');

const DEFAULT_SIDEBAR_NAV_ITEMS = [
  { id: 'offers', label: 'Top Offers', subtitle: 'Best discounts on site', icon: 'Tag', link: '/shop?filter=offers', badge: '5% OFF', enabled: true, order: 1, pages: ['home', 'shop', 'category', 'search'] },
  { id: 'arrivals', label: 'New Arrivals', subtitle: 'Fresh drops & collections', icon: 'Clock', link: '/shop?filter=new', badge: 'NEW', enabled: true, order: 2, pages: ['home', 'shop', 'category', 'search'] },
  { id: 'bestsellers', label: 'Best Sellers', subtitle: 'Customer favorite picks', icon: 'Award', link: '/shop?filter=bestsellers', badge: 'HOT', enabled: true, order: 3, pages: ['home', 'shop', 'category', 'search'] },
  { id: 'trending', label: 'Trending Now', subtitle: 'Popular style trends', icon: 'TrendingUp', link: '/shop?filter=trending', badge: '', enabled: true, order: 4, pages: ['home', 'shop', 'category', 'search'] },
  { id: 'premium', label: 'Premium Store', subtitle: '925 Silver & Luxury', icon: 'Crown', link: '/shop?category=Jewellery', badge: 'LUXE', enabled: true, order: 5, pages: ['home', 'shop', 'category', 'search'] },
  { id: 'gifts', label: 'Gift Cards', subtitle: 'Surprise your loved ones', icon: 'Gift', link: '/contact', badge: '', enabled: true, order: 6, pages: ['home', 'shop', 'category', 'search'] },
  { id: 'track', label: 'Track Order', subtitle: 'Live order tracking', icon: 'Truck', link: '/profile', badge: '', enabled: true, order: 7, pages: ['home', 'shop', 'category', 'search'] },
  { id: 'support', label: 'Customer Support', subtitle: '24/7 dedicated help', icon: 'Headphones', link: '/contact', badge: '', enabled: true, order: 8, pages: ['home', 'shop', 'category', 'search'] }
];

const DEFAULT_OFFER_CARD = {
  enabled: true,
  heading: 'EXTRA 5% OFF',
  subtitle: 'On Prepaid Orders',
  discountPercent: '5%',
  badgeText: 'INSTANT DISCOUNT',
  link: '/shop?filter=offers',
  icon: 'Percent'
};

const DEFAULT_PROMO_CARD = {
  enabled: true,
  badge: 'FESTIVE SPECIAL',
  title: 'UP TO 60% OFF',
  subtitle: 'On Bestsellers',
  description: 'Limited time festive drops & trending styles.',
  buttonText: 'SHOP NOW',
  link: '/shop',
  imageUrl: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600'
};

const ensureSettingsTable = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS settings (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        setting_key VARCHAR(100) UNIQUE NOT NULL,
        setting_value TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );
    `);
  } catch (e) {}
};

exports.getSidebarConfig = async (req, res, next) => {
  try {
    await ensureSettingsTable();
    let rows = [];
    try {
      const [r] = await pool.query("SELECT setting_key, setting_value FROM settings WHERE setting_key IN ('karviyam_sidebar_nav_items', 'karviyam_sidebar_offer_card', 'karviyam_sidebar_promo_card')");
      rows = r || [];
    } catch (eDb) {}

    let navItems = DEFAULT_SIDEBAR_NAV_ITEMS;
    let offerCard = DEFAULT_OFFER_CARD;
    let promoCard = DEFAULT_PROMO_CARD;

    rows.forEach(r => {
      try {
        const parsed = typeof r.setting_value === 'string' ? JSON.parse(r.setting_value) : r.setting_value;
        if (r.setting_key === 'karviyam_sidebar_nav_items' && Array.isArray(parsed)) {
          navItems = parsed;
        } else if (r.setting_key === 'karviyam_sidebar_offer_card' && parsed && typeof parsed === 'object') {
          offerCard = { ...DEFAULT_OFFER_CARD, ...parsed };
        } else if (r.setting_key === 'karviyam_sidebar_promo_card' && parsed && typeof parsed === 'object') {
          promoCard = { ...DEFAULT_PROMO_CARD, ...parsed };
        }
      } catch (eParse) {}
    });

    // Ensure nav items sorted by order
    navItems = [...navItems].sort((a, b) => (parseInt(a.order) || 0) - (parseInt(b.order) || 0));

    return res.status(200).json(ApiResponse.success({
      navItems,
      offerCard,
      promoCard
    }, 'Sidebar configuration retrieved successfully'));
  } catch (err) {
    console.error('[getSidebarConfig Error]:', err);
    return res.status(200).json(ApiResponse.success({
      navItems: DEFAULT_SIDEBAR_NAV_ITEMS,
      offerCard: DEFAULT_OFFER_CARD,
      promoCard: DEFAULT_PROMO_CARD
    }, 'Sidebar configuration fallback retrieved'));
  }
};

exports.updateSidebarConfig = async (req, res, next) => {
  try {
    await ensureSettingsTable();
    let bodyData = req.body || {};

    // Process any base64 uploaded images inside body
    bodyData = await processBase64Images(bodyData);

    const { navItems, offerCard, promoCard } = bodyData;

    if (Array.isArray(navItems)) {
      const cleanedNav = navItems.map((item, idx) => ({
        ...item,
        order: idx + 1
      }));
      await pool.query(
        `INSERT INTO settings (setting_key, setting_value) VALUES (?, ?)
         ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
        ['karviyam_sidebar_nav_items', JSON.stringify(cleanedNav)]
      );
    }

    if (offerCard && typeof offerCard === 'object') {
      await pool.query(
        `INSERT INTO settings (setting_key, setting_value) VALUES (?, ?)
         ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
        ['karviyam_sidebar_offer_card', JSON.stringify(offerCard)]
      );
    }

    if (promoCard && typeof promoCard === 'object') {
      await pool.query(
        `INSERT INTO settings (setting_key, setting_value) VALUES (?, ?)
         ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
        ['karviyam_sidebar_promo_card', JSON.stringify(promoCard)]
      );
    }

    return exports.getSidebarConfig(req, res, next);
  } catch (err) {
    next(err);
  }
};
