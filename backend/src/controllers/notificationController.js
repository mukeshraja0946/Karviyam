const pool = require('../config/db');
const ApiResponse = require('../utils/apiResponse');

exports.getNotifications = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const [rows] = await pool.query('SELECT * FROM notifications WHERE user_id = ? ORDER BY id DESC LIMIT 50', [userId]);
    const notifications = rows.map(n => ({
      id: n.id,
      userId: n.user_id,
      message: n.message,
      isRead: Boolean(n.is_read),
      createdAt: n.created_at
    }));
    return res.status(200).json(ApiResponse.success(notifications, 'Notifications retrieved successfully'));
  } catch (err) {
    next(err);
  }
};

exports.markAsRead = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    await pool.query('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?', [id, userId]);
    return res.status(200).json(ApiResponse.success(null, 'Notification marked as read'));
  } catch (err) {
    next(err);
  }
};

exports.markAllAsRead = async (req, res, next) => {
  try {
    const userId = req.user.id;
    await pool.query('UPDATE notifications SET is_read = 1 WHERE user_id = ?', [userId]);
    return res.status(200).json(ApiResponse.success(null, 'All notifications marked as read'));
  } catch (err) {
    next(err);
  }
};
