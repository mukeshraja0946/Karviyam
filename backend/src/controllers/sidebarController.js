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
  couponCode: 'PREPAID10',
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

const DEFAULT_SHOP_BY_PRICE = [
  { id: 'p1', label: 'Under ₹499', link: '/shop?maxPrice=499', enabled: true },
  { id: 'p2', label: 'Under ₹999', link: '/shop?maxPrice=999', enabled: true },
  { id: 'p3', label: 'Under ₹1499', link: '/shop?maxPrice=1499', enabled: true },
  { id: 'p4', label: 'Under ₹1999', link: '/shop?maxPrice=1999', enabled: true },
  { id: 'p5', label: 'Under ₹2999', link: '/shop?maxPrice=2999', enabled: true },
  { id: 'p6', label: 'Under ₹3999', link: '/shop?maxPrice=3999', enabled: true }
];

const DEFAULT_QUICK_CATEGORIES = [
  { id: 'qc1', name: 'T-Shirts', link: '/shop?category=T-Shirts', enabled: true },
  { id: 'qc2', name: 'Sneakers', link: '/shop?category=Sneakers', enabled: true },
  { id: 'qc3', name: 'Kurta Sets', link: '/shop?category=Kurta+Sets', enabled: true },
  { id: 'qc4', name: 'Men', link: '/shop?category=Men', enabled: true },
  { id: 'qc5', name: 'Women', link: '/shop?category=Women', enabled: true },
  { id: 'qc6', name: 'Kids', link: '/shop?category=Kids', enabled: true },
  { id: 'qc7', name: 'Accessories', link: '/shop?category=Accessories', enabled: true },
  { id: 'qc8', name: 'Jewellery', link: '/shop?category=Jewellery', enabled: true }
];

const DEFAULT_APP_CARD = {
  enabled: true,
  title: 'DOWNLOAD KARVIYAM APP',
  subtitle: 'Shop Anytime, Anywhere',
  playStoreUrl: 'https://play.google.com/store',
  appStoreUrl: 'https://apps.apple.com',
  imageUrl: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=300'
};

const DEFAULT_BRAND_TRUST = {
  enabled: true,
  title: 'WHY KARVIYAM?',
  subtitle: 'Trusted E-Commerce Experience',
  points: ['Quality Fashion', 'Trusted Shopping', 'Secure Checkout', 'Easy Returns']
};

const DEFAULT_FINAL_LEFT_PROMO = {
  enabled: true,
  badge: 'EXPLORE STYLES',
  title: 'SHOP MORE. SAVE MORE.',
  subtitle: 'Discover everyday fashion styles.',
  buttonText: 'EXPLORE NOW →',
  link: '/shop'
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

const DEFAULT_QUICK_DEALS = [
  { id: 'qd1', icon: '🔥', title: 'Sneakers', tag: 'Up to 50% OFF', link: '/shop?category=Sneakers', enabled: true },
  { id: 'qd2', icon: '👕', title: 'T-Shirts', tag: 'From ₹499', link: '/shop?category=T-Shirts', enabled: true },
  { id: 'qd3', icon: '👗', title: "Women's Wear", tag: 'Up to 60% OFF', link: '/shop?category=Women', enabled: true },
  { id: 'qd4', icon: '🎒', title: 'Bags & Accessories', tag: 'Starting ₹399', link: '/shop?category=Accessories', enabled: true }
];

const DEFAULT_COUPON_SAVINGS = {
  enabled: true,
  badge: 'EXTRA SAVINGS',
  title: 'UNLOCK EXTRA SAVINGS',
  subtitle: 'Use available coupons and promo codes at checkout.',
  buttonText: 'VIEW OFFERS →',
  link: '/shop?filter=offers'
};

const DEFAULT_SHOP_BY_CATEGORY_RIGHT = [
  { id: 'rc1', name: 'Men', link: '/shop?category=Men', enabled: true },
  { id: 'rc2', name: 'Women', link: '/shop?category=Women', enabled: true },
  { id: 'rc3', name: 'Kids', link: '/shop?category=Kids', enabled: true },
  { id: 'rc4', name: 'Sneakers', link: '/shop?category=Sneakers', enabled: true },
  { id: 'rc5', name: 'Jewellery', link: '/shop?category=Jewellery', enabled: true },
  { id: 'rc6', name: 'Accessories', link: '/shop?category=Accessories', enabled: true },
  { id: 'rc7', name: 'Kitchen & Home', link: '/shop?category=Kitchen', enabled: true },
  { id: 'rc8', name: 'School & Office', link: '/shop?category=School', enabled: true }
];

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

const DEFAULT_FINAL_RIGHT_PROMO = {
  enabled: true,
  badge: 'NEW COLLECTION',
  title: 'DISCOVER YOUR STYLE',
  subtitle: 'New drops. Fresh looks. Better prices.',
  buttonText: 'SHOP NOW →',
  link: '/shop'
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
    let shopByPrice = DEFAULT_SHOP_BY_PRICE;
    let quickCategories = DEFAULT_QUICK_CATEGORIES;
    let appCard = DEFAULT_APP_CARD;
    let brandTrust = DEFAULT_BRAND_TRUST;
    let finalLeftPromo = DEFAULT_FINAL_LEFT_PROMO;

    let todaySpecial = DEFAULT_TODAY_SPECIAL;
    let quickDeals = DEFAULT_QUICK_DEALS;
    let couponSavings = DEFAULT_COUPON_SAVINGS;
    let shopByCategoryRight = DEFAULT_SHOP_BY_CATEGORY_RIGHT;
    let styleInspiration = DEFAULT_STYLE_INSPIRATION;
    let finalRightPromo = DEFAULT_FINAL_RIGHT_PROMO;

    rows.forEach(r => {
      try {
        const parsed = typeof r.setting_value === 'string' ? JSON.parse(r.setting_value) : r.setting_value;
        if (r.setting_key === 'karviyam_sidebar_nav_items' && Array.isArray(parsed)) navItems = parsed;
        else if (r.setting_key === 'karviyam_sidebar_offer_card' && parsed && typeof parsed === 'object') offerCard = { ...DEFAULT_OFFER_CARD, ...parsed };
        else if (r.setting_key === 'karviyam_sidebar_promo_card' && parsed && typeof parsed === 'object') promoCard = { ...DEFAULT_PROMO_CARD, ...parsed };
        else if (r.setting_key === 'karviyam_sidebar_shop_by_price' && Array.isArray(parsed)) shopByPrice = parsed;
        else if (r.setting_key === 'karviyam_sidebar_quick_categories' && Array.isArray(parsed)) quickCategories = parsed;
        else if (r.setting_key === 'karviyam_sidebar_app_card' && parsed && typeof parsed === 'object') appCard = { ...DEFAULT_APP_CARD, ...parsed };
        else if (r.setting_key === 'karviyam_sidebar_brand_trust' && parsed && typeof parsed === 'object') brandTrust = { ...DEFAULT_BRAND_TRUST, ...parsed };
        else if (r.setting_key === 'karviyam_sidebar_final_left_promo' && parsed && typeof parsed === 'object') finalLeftPromo = { ...DEFAULT_FINAL_LEFT_PROMO, ...parsed };
        
        else if (r.setting_key === 'karviyam_sidebar_today_special' && parsed && typeof parsed === 'object') todaySpecial = { ...DEFAULT_TODAY_SPECIAL, ...parsed };
        else if (r.setting_key === 'karviyam_sidebar_quick_deals' && Array.isArray(parsed)) quickDeals = parsed;
        else if (r.setting_key === 'karviyam_sidebar_coupon_savings' && parsed && typeof parsed === 'object') couponSavings = { ...DEFAULT_COUPON_SAVINGS, ...parsed };
        else if (r.setting_key === 'karviyam_sidebar_shop_by_category_right' && Array.isArray(parsed)) shopByCategoryRight = parsed;
        else if (r.setting_key === 'karviyam_sidebar_style_inspiration' && parsed && typeof parsed === 'object') styleInspiration = { ...DEFAULT_STYLE_INSPIRATION, ...parsed };
        else if (r.setting_key === 'karviyam_sidebar_final_right_promo' && parsed && typeof parsed === 'object') finalRightPromo = { ...DEFAULT_FINAL_RIGHT_PROMO, ...parsed };
      } catch (eParse) {}
    });

    navItems = [...navItems].sort((a, b) => (parseInt(a.order) || 0) - (parseInt(b.order) || 0));

    return res.status(200).json(ApiResponse.success({
      navItems,
      offerCard,
      promoCard,
      shopByPrice,
      quickCategories,
      appCard,
      brandTrust,
      finalLeftPromo,

      todaySpecial,
      quickDeals,
      couponSavings,
      shopByCategoryRight,
      styleInspiration,
      finalRightPromo
    }, 'Sidebar configuration retrieved successfully'));
  } catch (err) {
    console.error('[getSidebarConfig Error]:', err);
    return res.status(200).json(ApiResponse.success({
      navItems: DEFAULT_SIDEBAR_NAV_ITEMS,
      offerCard: DEFAULT_OFFER_CARD,
      promoCard: DEFAULT_PROMO_CARD,
      shopByPrice: DEFAULT_SHOP_BY_PRICE,
      quickCategories: DEFAULT_QUICK_CATEGORIES,
      appCard: DEFAULT_APP_CARD,
      brandTrust: DEFAULT_BRAND_TRUST,
      finalLeftPromo: DEFAULT_FINAL_LEFT_PROMO,

      todaySpecial: DEFAULT_TODAY_SPECIAL,
      quickDeals: DEFAULT_QUICK_DEALS,
      couponSavings: DEFAULT_COUPON_SAVINGS,
      shopByCategoryRight: DEFAULT_SHOP_BY_CATEGORY_RIGHT,
      styleInspiration: DEFAULT_STYLE_INSPIRATION,
      finalRightPromo: DEFAULT_FINAL_RIGHT_PROMO
    }, 'Sidebar configuration fallback retrieved'));
  }
};

exports.updateSidebarConfig = async (req, res, next) => {
  try {
    await ensureSettingsTable();
    let bodyData = req.body || {};

    bodyData = await processBase64Images(bodyData);

    const {
      navItems,
      offerCard,
      promoCard,
      shopByPrice,
      quickCategories,
      appCard,
      brandTrust,
      finalLeftPromo,
      todaySpecial,
      quickDeals,
      couponSavings,
      shopByCategoryRight,
      styleInspiration,
      finalRightPromo
    } = bodyData;

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
      const cleanedNav = navItems.map((item, idx) => ({ ...item, order: idx + 1 }));
      await saveKey('karviyam_sidebar_nav_items', cleanedNav);
    }
    if (offerCard && typeof offerCard === 'object') await saveKey('karviyam_sidebar_offer_card', offerCard);
    if (promoCard && typeof promoCard === 'object') await saveKey('karviyam_sidebar_promo_card', promoCard);
    if (Array.isArray(shopByPrice)) await saveKey('karviyam_sidebar_shop_by_price', shopByPrice);
    if (Array.isArray(quickCategories)) await saveKey('karviyam_sidebar_quick_categories', quickCategories);
    if (appCard && typeof appCard === 'object') await saveKey('karviyam_sidebar_app_card', appCard);
    if (brandTrust && typeof brandTrust === 'object') await saveKey('karviyam_sidebar_brand_trust', brandTrust);
    if (finalLeftPromo && typeof finalLeftPromo === 'object') await saveKey('karviyam_sidebar_final_left_promo', finalLeftPromo);

    if (todaySpecial && typeof todaySpecial === 'object') await saveKey('karviyam_sidebar_today_special', todaySpecial);
    if (Array.isArray(quickDeals)) await saveKey('karviyam_sidebar_quick_deals', quickDeals);
    if (couponSavings && typeof couponSavings === 'object') await saveKey('karviyam_sidebar_coupon_savings', couponSavings);
    if (Array.isArray(shopByCategoryRight)) await saveKey('karviyam_sidebar_shop_by_category_right', shopByCategoryRight);
    if (styleInspiration && typeof styleInspiration === 'object') await saveKey('karviyam_sidebar_style_inspiration', styleInspiration);
    if (finalRightPromo && typeof finalRightPromo === 'object') await saveKey('karviyam_sidebar_final_right_promo', finalRightPromo);

    return exports.getSidebarConfig(req, res, next);
  } catch (err) {
    next(err);
  }
};
