const pool = require('../config/db');
const ApiResponse = require('../utils/apiResponse');
const { processBase64Images } = require('../utils/base64Helper');

const DEFAULT_SIDEBAR_NAV_ITEMS = [
  { id: 'offers', label: 'Top Offers', subtitle: 'Best discounts on site', icon: 'Flame', link: '/shop?filter=offers', badge: 'HOT', enabled: true, order: 1 },
  { id: 'arrivals', label: 'New Arrivals', subtitle: 'Fresh drops & collections', icon: 'Sparkles', link: '/shop?filter=new', badge: 'NEW', enabled: true, order: 2 },
  { id: 'bestsellers', label: 'Best Sellers', subtitle: 'Customer favorite picks', icon: 'Star', link: '/shop?filter=bestsellers', badge: 'HOT', enabled: true, order: 3 },
  { id: 'trending', label: 'Trending Now', subtitle: 'Popular style trends', icon: 'TrendingUp', link: '/shop?filter=trending', badge: '', enabled: true, order: 4 },
  { id: 'premium', label: 'Premium Store', subtitle: '925 Silver & Luxury', icon: 'Crown', link: '/shop?category=Jewellery', badge: 'NEW', enabled: true, order: 5 },
  { id: 'gifts', label: 'Gift Cards', subtitle: 'Surprise your loved ones', icon: 'Gift', link: '/contact', badge: '', enabled: true, order: 6 },
  { id: 'track', label: 'Track Order', subtitle: 'Live order tracking', icon: 'Truck', link: '/profile', badge: '', enabled: true, order: 7 },
  { id: 'support', label: 'Customer Support', subtitle: '24/7 dedicated help', icon: 'Headphones', link: '/contact', badge: '', enabled: true, order: 8 }
];

const DEFAULT_OFFER_CARD = {
  enabled: true,
  heading: 'EXTRA 10% OFF',
  subtitle: 'On Prepaid Orders',
  discountPercent: '%',
  badgeText: 'INSTANT DISCOUNT',
  link: '/shop?filter=offers',
  icon: 'Percent'
};

const DEFAULT_PROMO_CARD = {
  enabled: true,
  badge: '✨ FESTIVE SPECIAL',
  title: 'UP TO 60% OFF',
  subtitle: 'On Bestsellers',
  description: 'Limited time festive drops & trending styles.',
  buttonText: 'SHOP NOW',
  link: '/shop',
  imageUrl: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600'
};

const DEFAULT_APP_CARD = {
  enabled: true,
  title: 'DOWNLOAD KARVIYAM APP',
  subtitle: 'Shop Anytime, Anywhere',
  playStoreUrl: 'https://play.google.com/store',
  appStoreUrl: 'https://apps.apple.com',
  imageUrl: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=300'
};

const DEFAULT_INDIA_CARD = {
  enabled: true,
  badge: 'MADE IN INDIA',
  title: 'Supporting Local',
  subtitle: 'Artisans & Brands',
  buttonText: 'SHOP INDIAN →',
  link: '/shop?filter=local',
  imageUrl: ''
};

const DEFAULT_TODAY_SPECIAL = {
  enabled: true,
  badge: "TODAY'S SPECIAL DEAL",
  subtitle: 'Limited Time Only',
  productName: 'Sports Sneakers',
  description: 'Stylish & Comfortable',
  price: 1499,
  originalPrice: 2499,
  discountText: '40% OFF',
  buttonText: 'SHOP NOW →',
  link: '/shop?category=Sneakers',
  imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600',
  endTime: new Date(Date.now() + 8 * 3600 * 1000 + 26 * 60 * 1000 + 45 * 1000).toISOString()
};

const DEFAULT_STYLE_INSPIRATION = {
  enabled: true,
  badge: 'STYLE INSPIRATION',
  title: 'Look Good.',
  subtitle: 'Feel Confident.',
  tag: 'CASUAL LOOKS',
  tagSub: 'For Everyday',
  buttonText: 'EXPLORE NOW →',
  link: '/shop',
  imageUrl: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600'
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
      const [r] = await pool.query("SELECT setting_key, setting_value FROM settings WHERE setting_key LIKE 'karviyam_sidebar_%'");
      rows = r || [];
    } catch (eDb) {}

    let navItems = DEFAULT_SIDEBAR_NAV_ITEMS;
    let offerCard = DEFAULT_OFFER_CARD;
    let promoCard = DEFAULT_PROMO_CARD;
    let appCard = DEFAULT_APP_CARD;
    let indiaCard = DEFAULT_INDIA_CARD;
    let todaySpecial = DEFAULT_TODAY_SPECIAL;
    let styleInspiration = DEFAULT_STYLE_INSPIRATION;

    rows.forEach(r => {
      try {
        const parsed = typeof r.setting_value === 'string' ? JSON.parse(r.setting_value) : r.setting_value;
        if (r.setting_key === 'karviyam_sidebar_nav_items' && Array.isArray(parsed)) {
          navItems = parsed;
        } else if (r.setting_key === 'karviyam_sidebar_offer_card' && parsed && typeof parsed === 'object') {
          offerCard = { ...DEFAULT_OFFER_CARD, ...parsed };
        } else if (r.setting_key === 'karviyam_sidebar_promo_card' && parsed && typeof parsed === 'object') {
          promoCard = { ...DEFAULT_PROMO_CARD, ...parsed };
        } else if (r.setting_key === 'karviyam_sidebar_app_card' && parsed && typeof parsed === 'object') {
          appCard = { ...DEFAULT_APP_CARD, ...parsed };
        } else if (r.setting_key === 'karviyam_sidebar_india_card' && parsed && typeof parsed === 'object') {
          indiaCard = { ...DEFAULT_INDIA_CARD, ...parsed };
        } else if (r.setting_key === 'karviyam_sidebar_today_special' && parsed && typeof parsed === 'object') {
          todaySpecial = { ...DEFAULT_TODAY_SPECIAL, ...parsed };
        } else if (r.setting_key === 'karviyam_sidebar_style_inspiration' && parsed && typeof parsed === 'object') {
          styleInspiration = { ...DEFAULT_STYLE_INSPIRATION, ...parsed };
        }
      } catch (eParse) {}
    });

    navItems = [...navItems].sort((a, b) => (parseInt(a.order) || 0) - (parseInt(b.order) || 0));

    return res.status(200).json(ApiResponse.success({
      navItems,
      offerCard,
      promoCard,
      appCard,
      indiaCard,
      todaySpecial,
      styleInspiration
    }, 'Sidebar configuration retrieved successfully'));
  } catch (err) {
    console.error('[getSidebarConfig Error]:', err);
    return res.status(200).json(ApiResponse.success({
      navItems: DEFAULT_SIDEBAR_NAV_ITEMS,
      offerCard: DEFAULT_OFFER_CARD,
      promoCard: DEFAULT_PROMO_CARD,
      appCard: DEFAULT_APP_CARD,
      indiaCard: DEFAULT_INDIA_CARD,
      todaySpecial: DEFAULT_TODAY_SPECIAL,
      styleInspiration: DEFAULT_STYLE_INSPIRATION
    }, 'Sidebar configuration fallback retrieved'));
  }
};

exports.updateSidebarConfig = async (req, res, next) => {
  try {
    await ensureSettingsTable();
    let bodyData = req.body || {};

    bodyData = await processBase64Images(bodyData);

    const { navItems, offerCard, promoCard, appCard, indiaCard, todaySpecial, styleInspiration } = bodyData;

    const saveKey = async (key, val) => {
      if (val !== undefined && val !== null) {
        await pool.query(
          `INSERT INTO settings (setting_key, setting_value) VALUES (?, ?)
           ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
          [key, JSON.stringify(val)]
        );
      }
    };

    if (Array.isArray(navItems)) {
      const cleanedNav = navItems.map((item, idx) => ({
        ...item,
        order: idx + 1
      }));
      await saveKey('karviyam_sidebar_nav_items', cleanedNav);
    }

    if (offerCard && typeof offerCard === 'object') await saveKey('karviyam_sidebar_offer_card', offerCard);
    if (promoCard && typeof promoCard === 'object') await saveKey('karviyam_sidebar_promo_card', promoCard);
    if (appCard && typeof appCard === 'object') await saveKey('karviyam_sidebar_app_card', appCard);
    if (indiaCard && typeof indiaCard === 'object') await saveKey('karviyam_sidebar_india_card', indiaCard);
    if (todaySpecial && typeof todaySpecial === 'object') await saveKey('karviyam_sidebar_today_special', todaySpecial);
    if (styleInspiration && typeof styleInspiration === 'object') await saveKey('karviyam_sidebar_style_inspiration', styleInspiration);

    return exports.getSidebarConfig(req, res, next);
  } catch (err) {
    next(err);
  }
};

