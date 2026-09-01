const pool = require('../config/db');
const ApiResponse = require('../utils/apiResponse');

// Normalize search query
const normalizeSearchTerm = (term) => {
  if (!term) return '';
  return String(term)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ');
};

// Helper: Extract User/Session Analytics Profile
const getUserBehaviorProfile = async (userId, sessionId) => {
  const profile = {
    searches: [],
    categoryIds: new Set(),
    categoryNames: new Set(),
    preferredSizes: new Map(), // size -> count
    preferredColors: new Map(), // color -> count
    prices: [],
    viewedProductIds: new Set(),
    purchasedProductIds: new Set()
  };

  try {
    // 1. Fetch Analytics Events (Search, View, AddToCart, Wishlist)
    let whereClause = 'WHERE 1=0';
    const params = [];
    if (userId) {
      whereClause = 'WHERE user_id = ? OR session_id = ?';
      params.push(userId, sessionId);
    } else if (sessionId) {
      whereClause = 'WHERE session_id = ?';
      params.push(sessionId);
    }

    const [events] = await pool.query(
      `SELECT event_type, query_text, normalized_query, product_id, category_id, category_name, price, selected_size, selected_color, created_at
       FROM user_analytics_events
       ${whereClause} AND created_at >= NOW() - INTERVAL 30 DAY
       ORDER BY created_at DESC LIMIT 200`,
      params
    );

    events.forEach(ev => {
      if (ev.normalized_query) profile.searches.push(ev.normalized_query);
      if (ev.category_id) profile.categoryIds.add(ev.category_id);
      if (ev.category_name) profile.categoryNames.add(ev.category_name.toLowerCase());
      if (ev.product_id && ev.event_type === 'VIEW') profile.viewedProductIds.add(ev.product_id);
      if (ev.price && !isNaN(parseFloat(ev.price))) profile.prices.push(parseFloat(ev.price));
      if (ev.selected_size) {
        const sz = String(ev.selected_size).toUpperCase().trim();
        profile.preferredSizes.set(sz, (profile.preferredSizes.get(sz) || 0) + 1);
      }
      if (ev.selected_color) {
        const clr = String(ev.selected_color).toLowerCase().trim();
        profile.preferredColors.set(clr, (profile.preferredColors.get(clr) || 0) + 1);
      }
    });

    // 2. Fetch Completed Order Items for Logged-In User
    if (userId) {
      const [purchases] = await pool.query(
        `SELECT oi.product_id, oi.price_at_time, oi.selected_size, oi.selected_color, p.category_id, p.name
         FROM orders o
         JOIN order_items oi ON o.id = oi.order_id
         LEFT JOIN products p ON oi.product_id = p.id
         WHERE o.user_id = ? AND o.status IN ('CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED') AND (o.payment_status = 'SUCCESS' OR o.payment_method = 'COD')
         ORDER BY o.created_at DESC LIMIT 50`,
        [userId]
      );

      purchases.forEach(p => {
        if (p.product_id) profile.purchasedProductIds.add(p.product_id);
        if (p.category_id) profile.categoryIds.add(p.category_id);
        if (p.price_at_time) profile.prices.push(parseFloat(p.price_at_time));
        if (p.selected_size) {
          const sz = String(p.selected_size).toUpperCase().trim();
          profile.preferredSizes.set(sz, (profile.preferredSizes.get(sz) || 0) + 3); // Extra weight for purchases
        }
        if (p.selected_color) {
          const clr = String(p.selected_color).toLowerCase().trim();
          profile.preferredColors.set(clr, (profile.preferredColors.get(clr) || 0) + 3);
        }
      });
    }
  } catch (e) {
    console.error('[User Profile Extraction Warning]:', e.message);
  }

  // Determine top size preference
  let topSize = null;
  let maxSzCount = 0;
  for (const [sz, cnt] of profile.preferredSizes.entries()) {
    if (cnt > maxSzCount) {
      maxSzCount = cnt;
      topSize = sz;
    }
  }

  // Determine average price preference
  let avgPrice = 0;
  if (profile.prices.length > 0) {
    const sum = profile.prices.reduce((a, b) => a + b, 0);
    avgPrice = sum / profile.prices.length;
  }

  return {
    searches: Array.from(new Set(profile.searches)),
    categoryIds: Array.from(profile.categoryIds),
    categoryNames: Array.from(profile.categoryNames),
    topSize,
    preferredColors: Array.from(profile.preferredColors.keys()),
    avgPrice,
    viewedProductIds: Array.from(profile.viewedProductIds),
    purchasedProductIds: Array.from(profile.purchasedProductIds),
    hasHistory: profile.searches.length > 0 || profile.categoryIds.size > 0 || profile.viewedProductIds.size > 0 || profile.purchasedProductIds.size > 0
  };
};

// --------------------------------------------------
// 1. PERSONALIZED "RECOMMENDED FOR YOU" ALGORITHM
// --------------------------------------------------
exports.getPersonalizedRecommendations = async (req, res, next) => {
  try {
    const userId = req.user ? req.user.id : null;
    const headerSessionId = req.headers['x-session-id'] || req.headers['session-id'];
    const sessionId = req.query.sessionId || headerSessionId || (userId ? `user_${userId}` : '');
    const limit = parseInt(req.query.limit || 8);
    const excludeIds = (req.query.exclude || '').split(',').map(id => parseInt(id)).filter(id => !isNaN(id));

    const profile = await getUserBehaviorProfile(userId, sessionId);

    let [allActiveProducts] = await pool.query(
      `SELECT p.*, c.name as category_name
       FROM products p 
       LEFT JOIN categories c ON p.category_id = c.id 
       WHERE p.is_active = true AND p.stock_quantity > 0
       ORDER BY p.id DESC LIMIT 200`
    );

    if (excludeIds.length > 0) {
      allActiveProducts = allActiveProducts.filter(p => !excludeIds.includes(p.id));
    }

    if (!profile.hasHistory) {
      // New User Fallback: Top rated & recent best sellers
      const scoredFallback = allActiveProducts.sort((a, b) => {
        const scoreA = (parseFloat(a.rating) || 0) * 10 + (a.is_best_seller ? 20 : 0) + (a.is_trending ? 15 : 0);
        const scoreB = (parseFloat(b.rating) || 0) * 10 + (b.is_best_seller ? 20 : 0) + (b.is_trending ? 15 : 0);
        return scoreB - scoreA;
      });
      return res.status(200).json(ApiResponse.success(scoredFallback.slice(0, limit), 'Fallback popular recommendations fetched'));
    }

    // Score products based on user profile
    const scoredProducts = allActiveProducts.map(prod => {
      let score = 0;
      const pName = (prod.name || '').toLowerCase();
      const pCatName = (prod.category_name || prod.category_name_str || '').toLowerCase();
      const pPrice = parseFloat(prod.price || 0);

      // Search term matching (+50 pts)
      profile.searches.forEach(q => {
        if (q && (pName.includes(q) || pCatName.includes(q))) {
          score += 50;
        }
      });

      // Category matching (+40 pts)
      if (profile.categoryIds.includes(prod.category_id)) {
        score += 40;
      }
      if (profile.categoryNames.some(cn => pCatName.includes(cn))) {
        score += 30;
      }

      // Price affinity (+20 pts)
      if (profile.avgPrice > 0) {
        const priceDiffRatio = Math.abs(pPrice - profile.avgPrice) / profile.avgPrice;
        if (priceDiffRatio <= 0.3) score += 20;
        else if (priceDiffRatio <= 0.5) score += 10;
      }

      // Size availability (+30 pts)
      if (profile.topSize) {
        // If product has size attribute or tags matching top size
        const sizesAttr = (prod.sizes || prod.size_options || '').toUpperCase();
        if (!sizesAttr || sizesAttr.includes(profile.topSize)) {
          score += 30;
        }
      }

      // Color preference (+15 pts)
      if (profile.preferredColors.length > 0) {
        const prodColor = (prod.color || prod.color_name || '').toLowerCase();
        if (profile.preferredColors.some(c => prodColor.includes(c) || pName.includes(c))) {
          score += 15;
        }
      }

      // Boost items not yet purchased
      if (!profile.purchasedProductIds.includes(prod.id)) {
        score += 10;
      }

      // General quality bonus
      score += (parseFloat(prod.rating) || 0) * 2;

      return { product: prod, score };
    });

    // Sort by recommendation score descending
    scoredProducts.sort((a, b) => b.score - a.score);

    const recommendedList = scoredProducts.slice(0, limit).map(sp => sp.product);

    return res.status(200).json(ApiResponse.success(recommendedList, 'Personalized recommendations fetched successfully'));
  } catch (err) {
    next(err);
  }
};

// --------------------------------------------------
// 2. DATA-DRIVEN "TRENDING" ALGORITHM (TIME DECAY WEIGHTS)
// --------------------------------------------------
exports.getTrendingProducts = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit || 8);
    const excludeIds = (req.query.exclude || '').split(',').map(id => parseInt(id)).filter(id => !isNaN(id));

    // Calculate recent event velocity (last 24h, 3d, 7d, 30d)
    const [eventCounts] = await pool.query(
      `SELECT product_id,
              SUM(CASE WHEN event_type = 'VIEW' AND created_at >= NOW() - INTERVAL 7 DAY THEN 1 ELSE 0 END) as view_count,
              SUM(CASE WHEN event_type = 'ADD_TO_CART' AND created_at >= NOW() - INTERVAL 7 DAY THEN 3 ELSE 0 END) as cart_count,
              SUM(CASE WHEN event_type = 'WISHLIST' AND created_at >= NOW() - INTERVAL 7 DAY THEN 2 ELSE 0 END) as wishlist_count
       FROM user_analytics_events
       WHERE product_id IS NOT NULL AND created_at >= NOW() - INTERVAL 30 DAY
       GROUP BY product_id`
    );

    const eventScoreMap = new Map();
    eventCounts.forEach(r => {
      const score = (r.view_count || 0) + (r.cart_count || 0) + (r.wishlist_count || 0);
      eventScoreMap.set(r.product_id, score);
    });

    // Calculate recent purchase velocity from completed orders
    const [purchaseCounts] = await pool.query(
      `SELECT oi.product_id,
              SUM(CASE WHEN o.created_at >= NOW() - INTERVAL 24 HOUR THEN 10 ELSE 0 END) as p_24h,
              SUM(CASE WHEN o.created_at >= NOW() - INTERVAL 3 DAY THEN 6 ELSE 0 END) as p_3d,
              SUM(CASE WHEN o.created_at >= NOW() - INTERVAL 7 DAY THEN 3 ELSE 0 END) as p_7d
       FROM orders o
       JOIN order_items oi ON o.id = oi.order_id
       WHERE o.status IN ('CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED') AND (o.payment_status = 'SUCCESS' OR o.payment_method = 'COD')
       GROUP BY oi.product_id`
    );

    const purchaseScoreMap = new Map();
    purchaseCounts.forEach(r => {
      const pScore = (r.p_24h || 0) + (r.p_3d || 0) + (r.p_7d || 0);
      purchaseScoreMap.set(r.product_id, pScore);
    });

    let [allActiveProducts] = await pool.query(
      `SELECT p.*, c.name as category_name 
       FROM products p 
       LEFT JOIN categories c ON p.category_id = c.id 
       WHERE p.is_active = true AND p.stock_quantity > 0`
    );

    if (excludeIds.length > 0) {
      allActiveProducts = allActiveProducts.filter(p => !excludeIds.includes(p.id));
    }

    const scoredProducts = allActiveProducts.map(prod => {
      const eScore = eventScoreMap.get(prod.id) || 0;
      const pScore = purchaseScoreMap.get(prod.id) || 0;
      const manualBonus = prod.is_trending ? 25 : 0;
      const ratingBonus = (parseFloat(prod.rating) || 0) * 3;

      const totalTrendingScore = (pScore * 2) + eScore + manualBonus + ratingBonus;
      return { product: prod, score: totalTrendingScore };
    });

    scoredProducts.sort((a, b) => b.score - a.score);

    const trendingList = scoredProducts.slice(0, limit).map(sp => sp.product);

    return res.status(200).json(ApiResponse.success(trendingList, 'Trending products calculated successfully'));
  } catch (err) {
    next(err);
  }
};

// --------------------------------------------------
// 3. MOST-LOVED FASHION FOR YOU
// --------------------------------------------------
exports.getMostLovedProducts = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit || 8);
    const excludeIds = (req.query.exclude || '').split(',').map(id => parseInt(id)).filter(id => !isNaN(id));

    let [products] = await pool.query(
      `SELECT p.*, c.name as category_name
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.is_active = true AND p.stock_quantity > 0
       ORDER BY p.rating DESC, p.is_best_seller DESC, p.id DESC LIMIT 100`
    );

    if (excludeIds.length > 0) {
      products = products.filter(p => !excludeIds.includes(p.id));
    }

    return res.status(200).json(ApiResponse.success(products.slice(0, limit), 'Most loved products fetched'));
  } catch (err) {
    next(err);
  }
};

// --------------------------------------------------
// 4. STARTING @ ₹199 BUDGET FINDER
// --------------------------------------------------
exports.getStartingPriceProducts = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit || 8);
    const maxPrice = parseFloat(req.query.max_price || 399);
    const excludeIds = (req.query.exclude || '').split(',').map(id => parseInt(id)).filter(id => !isNaN(id));

    let [products] = await pool.query(
      `SELECT p.*, c.name as category_name
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.is_active = true AND p.stock_quantity > 0 AND p.price <= ?
       ORDER BY p.price ASC, p.rating DESC LIMIT 100`,
      [maxPrice]
    );

    if (products.length < 4) {
      const [fallback] = await pool.query(
        `SELECT p.*, c.name as category_name
         FROM products p
         LEFT JOIN categories c ON p.category_id = c.id
         WHERE p.is_active = true AND p.stock_quantity > 0
         ORDER BY p.price ASC LIMIT 100`
      );
      products = fallback;
    }

    if (excludeIds.length > 0) {
      products = products.filter(p => !excludeIds.includes(p.id));
    }

    return res.status(200).json(ApiResponse.success(products.slice(0, limit), 'Budget products fetched'));
  } catch (err) {
    next(err);
  }
};
