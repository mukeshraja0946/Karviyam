const pool = require('../config/db');
const ApiResponse = require('../utils/apiResponse');

// Ensure Analytics Events Table Exists with Indexes
const ensureAnalyticsTables = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_analytics_events (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        user_id BIGINT NULL,
        session_id VARCHAR(100) NOT NULL,
        event_type VARCHAR(50) NOT NULL,
        query_text VARCHAR(255) NULL,
        normalized_query VARCHAR(255) NULL,
        product_id BIGINT NULL,
        category_id BIGINT NULL,
        category_name VARCHAR(150) NULL,
        price DECIMAL(10,2) NULL,
        selected_size VARCHAR(50) NULL,
        selected_color VARCHAR(50) NULL,
        metadata JSON NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_session (session_id),
        INDEX idx_user (user_id),
        INDEX idx_event_type (event_type),
        INDEX idx_product (product_id),
        INDEX idx_category (category_id),
        INDEX idx_created (created_at)
      );
    `);
  } catch (e) {
    console.error('[Analytics Migration Error]:', e.message);
  }
};

// Normalize search query (e.g., "T-Shirt", "T shirt", "tshirt" -> "tshirt")
const normalizeSearchTerm = (term) => {
  if (!term) return '';
  return String(term)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ');
};

// Track User Interaction Event
exports.trackEvent = async (req, res, next) => {
  try {
    await ensureAnalyticsTables();

    const userId = req.user ? req.user.id : null;
    const headerSessionId = req.headers['x-session-id'] || req.headers['session-id'];
    const bodySessionId = req.body.sessionId;
    const sessionId = String(headerSessionId || bodySessionId || (userId ? `user_${userId}` : 'anon_session')).trim();

    const {
      eventType,
      searchQuery,
      productId,
      categoryId,
      categoryName,
      price,
      selectedSize,
      selectedColor,
      metadata
    } = req.body;

    if (!eventType) {
      return res.status(400).json(ApiResponse.error('eventType is required.'));
    }

    const normQuery = searchQuery ? normalizeSearchTerm(searchQuery) : null;

    // Throttle duplicate VIEW events within 10 seconds for same session & product
    if (eventType === 'VIEW' && productId) {
      const [recentViews] = await pool.query(
        `SELECT id FROM user_analytics_events 
         WHERE session_id = ? AND event_type = 'VIEW' AND product_id = ? AND created_at >= NOW() - INTERVAL 10 SECOND 
         LIMIT 1`,
        [sessionId, productId]
      );
      if (recentViews.length > 0) {
        return res.status(200).json(ApiResponse.success(null, 'Duplicate view throttled.'));
      }
    }

    await pool.query(
      `INSERT INTO user_analytics_events 
       (user_id, session_id, event_type, query_text, normalized_query, product_id, category_id, category_name, price, selected_size, selected_color, metadata, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        userId,
        sessionId,
        String(eventType).toUpperCase(),
        searchQuery || null,
        normQuery,
        productId ? parseInt(productId) : null,
        categoryId ? parseInt(categoryId) : null,
        categoryName || null,
        price ? parseFloat(price) : null,
        selectedSize || null,
        selectedColor || null,
        metadata ? JSON.stringify(metadata) : null
      ]
    );

    return res.status(201).json(ApiResponse.success({ tracked: true }, 'Event tracked successfully'));
  } catch (err) {
    next(err);
  }
};
