const pool = require('../config/db');
const ApiResponse = require('../utils/apiResponse');

exports.submitReview = async (req, res, next) => {
  try {
    const userId = req.user ? req.user.id : null;
    const { productId, rating, comment } = req.body;

    if (!productId || !rating) {
      return res.status(400).json(ApiResponse.error('Product ID and rating are required'));
    }

    const [result] = await pool.query(
      `INSERT INTO reviews (product_id, user_id, rating, comment, status, created_at)
       VALUES (?, ?, ?, ?, 'Approved', NOW())`,
      [productId, userId, parseInt(rating), comment || null]
    );

    const [rows] = await pool.query('SELECT * FROM reviews WHERE id = ?', [result.insertId]);
    return res.status(200).json(ApiResponse.success(rows[0], 'Review submitted successfully'));
  } catch (err) {
    next(err);
  }
};

exports.getProductReviews = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const [rows] = await pool.query(
      `SELECT r.*, u.full_name as user_name 
       FROM reviews r 
       LEFT JOIN users u ON r.user_id = u.id 
       WHERE r.product_id = ? AND (r.status = 'Approved' OR r.status IS NULL)
       ORDER BY r.id DESC`,
      [productId]
    );

    const dtos = rows.map(r => ({
      id: r.id,
      productId: r.product_id,
      userId: r.user_id,
      userName: r.user_name || 'Verified Buyer',
      rating: r.rating,
      comment: r.comment,
      createdAt: r.created_at
    }));

    return res.status(200).json(ApiResponse.success(dtos, 'Reviews retrieved successfully'));
  } catch (err) {
    next(err);
  }
};
