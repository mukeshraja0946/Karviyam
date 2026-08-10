const pool = require('../config/db');
const ApiResponse = require('../utils/apiResponse');

exports.getWishlist = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const [rows] = await pool.query(
      `SELECT w.id as wishlist_id, p.* 
       FROM wishlist w 
       JOIN products p ON w.product_id = p.id 
       WHERE w.user_id = ? 
       ORDER BY w.id DESC`,
      [userId]
    );

    const items = rows.map(p => ({
      id: p.id,
      wishlistId: p.wishlist_id,
      name: p.name,
      price: parseFloat(p.price || 0),
      oldPrice: p.old_price ? parseFloat(p.old_price) : null,
      imageUrl: p.image_url,
      rating: parseFloat(p.rating || 4.5),
      inStock: (p.stock_quantity || 0) > 0
    }));

    return res.status(200).json(ApiResponse.success(items, 'Wishlist retrieved successfully'));
  } catch (err) {
    next(err);
  }
};

exports.addToWishlist = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const productId = req.params.productId || req.body.productId;

    if (!productId) {
      return res.status(400).json(ApiResponse.error('Product ID required'));
    }

    try {
      await pool.query(
        'INSERT IGNORE INTO wishlist (user_id, product_id) VALUES (?, ?)',
        [userId, productId]
      );
    } catch (e) {
      await pool.query(
        'INSERT INTO wishlist (user_id, product_id) VALUES (?, ?)',
        [userId, productId]
      );
    }

    return exports.getWishlist(req, res, next);
  } catch (err) {
    next(err);
  }
};

exports.removeFromWishlist = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const productId = req.params.productId;

    await pool.query('DELETE FROM wishlist WHERE user_id = ? AND product_id = ?', [userId, productId]);
    return exports.getWishlist(req, res, next);
  } catch (err) {
    next(err);
  }
};

exports.toggleWishlist = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const productId = req.params.productId || req.body.productId;

    const [rows] = await pool.query('SELECT id FROM wishlist WHERE user_id = ? AND product_id = ?', [userId, productId]);
    if (rows.length > 0) {
      await pool.query('DELETE FROM wishlist WHERE id = ?', [rows[0].id]);
    } else {
      await pool.query('INSERT INTO wishlist (user_id, product_id) VALUES (?, ?)', [userId, productId]);
    }

    return exports.getWishlist(req, res, next);
  } catch (err) {
    next(err);
  }
};
