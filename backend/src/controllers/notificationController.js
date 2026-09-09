const pool = require('../config/db');
const ApiResponse = require('../utils/apiResponse');

// --------------------------------------------------
// Helper function to create system notification for user
// --------------------------------------------------
exports.createEventNotification = async ({ userId, type = 'GENERAL', title = 'Notification', message, relatedOrderId = null, relatedProductId = null }) => {
  if (!userId || !message) return null;
  try {
    const [res] = await pool.query(
      `INSERT INTO notifications (user_id, type, title, message, related_order_id, related_product_id, is_read, is_active, created_at)
       VALUES (?, ?, ?, ?, ?, ?, 0, 1, NOW())`,
      [userId, type, title, message, relatedOrderId, relatedProductId]
    );
    return res.insertId;
  } catch (err) {
    console.error('Error creating event notification:', err);
    return null;
  }
};

// --------------------------------------------------
// 1. GET CUSTOMER NOTIFICATIONS (GET /api/notifications)
// --------------------------------------------------
exports.getNotifications = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Check for active admin promotional broadcasts not yet inserted for this user
    try {
      const [promos] = await pool.query(`
        SELECT * FROM admin_promotional_notifications 
        WHERE is_enabled = 1 
          AND (start_date IS NULL OR start_date <= NOW()) 
          AND (end_date IS NULL OR end_date >= NOW())
        ORDER BY created_at DESC LIMIT 10
      `);

      for (const promo of promos) {
        // Check if user already received this promo notification
        const [existing] = await pool.query(
          `SELECT id FROM notifications WHERE user_id = ? AND title = ? AND created_at >= ? LIMIT 1`,
          [userId, promo.title, promo.created_at]
        );
        if (existing.length === 0) {
          await pool.query(
            `INSERT INTO notifications (user_id, type, title, message, is_read, is_active, created_at)
             VALUES (?, 'PROMOTION', ?, ?, 0, 1, ?)`,
            [userId, promo.title, promo.message, promo.created_at]
          );
        }
      }
    } catch (ePromo) {}

    // Query notifications strictly for authenticated user
    const [rows] = await pool.query(
      `SELECT * FROM notifications 
       WHERE user_id = ? AND (is_active = 1 OR is_active IS NULL) 
       ORDER BY id DESC LIMIT 50`,
      [userId]
    );

    const notifications = rows.map(n => ({
      id: n.id,
      userId: n.user_id,
      type: n.type || 'GENERAL',
      title: n.title || 'Notification',
      message: n.message,
      relatedOrderId: n.related_order_id,
      relatedProductId: n.related_product_id,
      isRead: Boolean(n.is_read || n.read_at),
      readAt: n.read_at,
      createdAt: n.created_at
    }));

    const unreadCount = notifications.filter(n => !n.isRead).length;

    return res.status(200).json(ApiResponse.success({
      notifications,
      unreadCount
    }, 'Notifications retrieved successfully'));
  } catch (err) {
    next(err);
  }
};

// --------------------------------------------------
// 2. MARK INDIVIDUAL AS READ (PATCH/PUT /api/notifications/:id/read)
// --------------------------------------------------
exports.markAsRead = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    await pool.query(
      `UPDATE notifications SET is_read = 1, read_at = NOW() WHERE id = ? AND user_id = ?`,
      [id, userId]
    );

    return res.status(200).json(ApiResponse.success(null, 'Notification marked as read'));
  } catch (err) {
    next(err);
  }
};

// --------------------------------------------------
// 3. MARK ALL AS READ (PATCH/PUT /api/notifications/read-all)
// --------------------------------------------------
exports.markAllAsRead = async (req, res, next) => {
  try {
    const userId = req.user.id;

    await pool.query(
      `UPDATE notifications SET is_read = 1, read_at = NOW() WHERE user_id = ? AND (is_read = 0 OR read_at IS NULL)`,
      [userId]
    );

    return res.status(200).json(ApiResponse.success(null, 'All notifications marked as read'));
  } catch (err) {
    next(err);
  }
};

// --------------------------------------------------
// 4. ADMIN: GET PROMOTIONAL BROADCASTS (GET /api/notifications/admin/broadcasts)
// --------------------------------------------------
exports.getAdminBroadcasts = async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT * FROM admin_promotional_notifications ORDER BY id DESC`
    );
    return res.status(200).json(ApiResponse.success(rows, 'Promotional broadcasts fetched successfully'));
  } catch (err) {
    next(err);
  }
};

// --------------------------------------------------
// 5. ADMIN: CREATE PROMOTIONAL BROADCAST (POST /api/notifications/admin/broadcast)
// --------------------------------------------------
exports.createAdminBroadcast = async (req, res, next) => {
  try {
    const { title, message, imageUrl, targetAudience, startDate, endDate, isEnabled } = req.body;
    if (!title || !message) {
      return res.status(400).json(ApiResponse.error('Title and message are required.'));
    }

    const [insertRes] = await pool.query(
      `INSERT INTO admin_promotional_notifications (title, message, image_url, target_audience, start_date, end_date, is_enabled, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        title,
        message,
        imageUrl || null,
        targetAudience || 'ALL',
        startDate || null,
        endDate || null,
        isEnabled !== false ? 1 : 0
      ]
    );

    return res.status(201).json(ApiResponse.success({ id: insertRes.insertId }, 'Promotional notification broadcasted successfully'));
  } catch (err) {
    next(err);
  }
};

// --------------------------------------------------
// 6. ADMIN: TOGGLE BROADCAST STATUS (PUT /api/notifications/admin/broadcasts/:id/toggle)
// --------------------------------------------------
exports.toggleAdminBroadcast = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { isEnabled } = req.body;

    await pool.query(
      `UPDATE admin_promotional_notifications SET is_enabled = ? WHERE id = ?`,
      [isEnabled ? 1 : 0, id]
    );

    return res.status(200).json(ApiResponse.success(null, 'Broadcast status updated'));
  } catch (err) {
    next(err);
  }
};
