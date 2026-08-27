const pool = require('../config/db');
const ApiResponse = require('../utils/apiResponse');

// Helper to format review DTO
const mapReviewDTO = (r, currentUserId = null, userVotesMap = {}) => {
  let imageList = [];
  if (r.images) {
    try {
      imageList = typeof r.images === 'string' ? JSON.parse(r.images) : r.images;
      if (!Array.isArray(imageList)) imageList = [r.images];
    } catch (e) {
      if (typeof r.images === 'string' && r.images.trim()) {
        imageList = [r.images.trim()];
      }
    }
  }

  const hasVoted = Boolean(userVotesMap[r.id]);

  return {
    id: r.id,
    productId: r.product_id,
    userId: r.user_id,
    userName: r.user_name || r.customer_name || 'Verified Customer',
    userEmail: r.user_email || null,
    title: r.title || '',
    rating: Number(r.rating || 5),
    comment: r.comment || '',
    images: imageList,
    verifiedPurchase: Boolean(r.verified_purchase),
    helpfulCount: Number(r.helpful_count || 0),
    hasVoted: hasVoted,
    reported: Boolean(r.reported),
    status: r.status || 'Approved',
    createdAt: r.created_at,
    updatedAt: r.updated_at
  };
};

// GET /api/reviews/product/:productId (Public - Fetch product reviews & summary stats)
exports.getProductReviews = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { sort = 'top', star } = req.query;
    const userId = req.user ? req.user.id : null;

    // 1. Fetch Summary Rating Stats
    const [statsRows] = await pool.query(
      `SELECT 
        COUNT(*) as total_reviews,
        AVG(rating) as avg_rating,
        SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END) as count_5,
        SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END) as count_4,
        SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END) as count_3,
        SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END) as count_2,
        SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END) as count_1
       FROM reviews 
       WHERE product_id = ? AND (status = 'Approved' OR status IS NULL OR status = '')`,
      [productId]
    );

    const totalReviews = statsRows[0]?.total_reviews ? parseInt(statsRows[0].total_reviews, 10) : 0;
    const avgRating = totalReviews > 0 ? Math.round(parseFloat(statsRows[0].avg_rating) * 10) / 10 : 0;

    const ratingDistribution = {
      5: totalReviews > 0 ? parseInt(statsRows[0].count_5 || 0, 10) : 0,
      4: totalReviews > 0 ? parseInt(statsRows[0].count_4 || 0, 10) : 0,
      3: totalReviews > 0 ? parseInt(statsRows[0].count_3 || 0, 10) : 0,
      2: totalReviews > 0 ? parseInt(statsRows[0].count_2 || 0, 10) : 0,
      1: totalReviews > 0 ? parseInt(statsRows[0].count_1 || 0, 10) : 0
    };

    // Calculate percentages
    const ratingPercentages = {
      5: totalReviews > 0 ? Math.round((ratingDistribution[5] / totalReviews) * 100) : 0,
      4: totalReviews > 0 ? Math.round((ratingDistribution[4] / totalReviews) * 100) : 0,
      3: totalReviews > 0 ? Math.round((ratingDistribution[3] / totalReviews) * 100) : 0,
      2: totalReviews > 0 ? Math.round((ratingDistribution[2] / totalReviews) * 100) : 0,
      1: totalReviews > 0 ? Math.round((ratingDistribution[1] / totalReviews) * 100) : 0
    };

    // 2. Build Query & Order By
    let orderByClause = 'ORDER BY r.helpful_count DESC, r.id DESC'; // Default 'top'
    if (sort === 'recent') {
      orderByClause = 'ORDER BY r.created_at DESC, r.id DESC';
    } else if (sort === 'highest') {
      orderByClause = 'ORDER BY r.rating DESC, r.id DESC';
    } else if (sort === 'lowest') {
      orderByClause = 'ORDER BY r.rating ASC, r.id DESC';
    } else if (sort === 'helpful') {
      orderByClause = 'ORDER BY r.helpful_count DESC, r.id DESC';
    }

    let filterClause = '';
    const queryParams = [productId];
    if (star && !isNaN(star)) {
      filterClause = ' AND r.rating = ?';
      queryParams.push(parseInt(star, 10));
    }

    const [rows] = await pool.query(
      `SELECT r.*, u.full_name as user_name, u.email as user_email
       FROM reviews r 
       LEFT JOIN users u ON r.user_id = u.id 
       WHERE r.product_id = ? AND (r.status = 'Approved' OR r.status IS NULL OR r.status = '')${filterClause}
       ${orderByClause}`,
      queryParams
    );

    // Fetch user votes if authenticated
    const userVotesMap = {};
    if (userId && rows.length > 0) {
      const reviewIds = rows.map(r => r.id);
      const [votes] = await pool.query(
        `SELECT review_id FROM review_helpful_votes WHERE user_id = ? AND review_id IN (?)`,
        [userId, reviewIds]
      );
      votes.forEach(v => {
        userVotesMap[v.review_id] = true;
      });
    }

    const reviewDTOs = rows.map(r => mapReviewDTO(r, userId, userVotesMap));

    return res.status(200).json(ApiResponse.success({
      avgRating,
      totalReviews,
      ratingDistribution,
      ratingPercentages,
      reviews: reviewDTOs
    }, 'Product reviews retrieved successfully'));
  } catch (err) {
    next(err);
  }
};

// POST /api/reviews (Submit or Update Customer Review)
exports.submitReview = async (req, res, next) => {
  try {
    const userId = req.user ? req.user.id : null;
    const { productId, rating, title, comment, images } = req.body;

    if (!userId) {
      return res.status(401).json(ApiResponse.error('Authentication required to submit a review'));
    }

    if (!productId || !rating || rating < 1 || rating > 5) {
      return res.status(400).json(ApiResponse.error('Valid product ID and star rating (1-5) are required'));
    }

    // Get user name
    const [userRows] = await pool.query('SELECT full_name, name, email FROM users WHERE id = ?', [userId]);
    const userName = userRows[0]?.full_name || userRows[0]?.name || 'Verified Customer';

    // Verify if customer actually purchased this product in an order
    let isVerifiedPurchase = false;
    let orderId = null;
    try {
      const [orderRows] = await pool.query(
        `SELECT o.id FROM orders o
         INNER JOIN order_items oi ON o.id = oi.order_id
         WHERE o.user_id = ? AND oi.product_id = ? AND o.status IN ('DELIVERED', 'COMPLETED', 'CONFIRMED', 'PROCESSING')
         ORDER BY o.id DESC LIMIT 1`,
        [userId, productId]
      );
      if (orderRows.length > 0) {
        isVerifiedPurchase = true;
        orderId = orderRows[0].id;
      }
    } catch (eOrder) {}

    // Encode images array to JSON string
    let finalImagesJson = null;
    if (images && Array.isArray(images) && images.length > 0) {
      finalImagesJson = JSON.stringify(images.filter(Boolean));
    } else if (typeof images === 'string' && images.trim()) {
      finalImagesJson = JSON.stringify([images.trim()]);
    }

    // Check if user has already reviewed this product
    const [existing] = await pool.query(
      'SELECT id FROM reviews WHERE user_id = ? AND product_id = ?',
      [userId, productId]
    );

    let reviewId = null;
    if (existing.length > 0) {
      // Update existing review
      reviewId = existing[0].id;
      await pool.query(
        `UPDATE reviews SET
          rating = ?, title = ?, comment = ?, images = ?, verified_purchase = ?, status = 'Approved', updated_at = NOW()
         WHERE id = ?`,
        [parseInt(rating, 10), title || null, comment || null, finalImagesJson, isVerifiedPurchase ? 1 : 0, reviewId]
      );
    } else {
      // Create new review
      const [result] = await pool.query(
        `INSERT INTO reviews (product_id, user_id, user_name, title, rating, comment, images, verified_purchase, order_id, status, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Approved', NOW())`,
        [productId, userId, userName, title || null, parseInt(rating, 10), comment || null, finalImagesJson, isVerifiedPurchase ? 1 : 0, orderId]
      );
      reviewId = result.insertId;
    }

    const [updatedRow] = await pool.query('SELECT * FROM reviews WHERE id = ?', [reviewId]);
    return res.status(200).json(ApiResponse.success(
      mapReviewDTO(updatedRow[0], userId),
      existing.length > 0 ? 'Your review has been updated! 🎉' : 'Thank you! Your review has been published! 🎉'
    ));
  } catch (err) {
    next(err);
  }
};

// POST /api/reviews/:id/helpful (Vote review as helpful)
exports.voteHelpful = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user ? req.user.id : null;

    if (!userId) {
      return res.status(401).json(ApiResponse.error('Please log in to vote on reviews'));
    }

    const [review] = await pool.query('SELECT * FROM reviews WHERE id = ?', [id]);
    if (!review || review.length === 0) {
      return res.status(404).json(ApiResponse.error('Review not found'));
    }

    // Check if user already voted
    const [voted] = await pool.query(
      'SELECT id FROM review_helpful_votes WHERE review_id = ? AND user_id = ?',
      [id, userId]
    );

    if (voted.length > 0) {
      // Unvote
      await pool.query('DELETE FROM review_helpful_votes WHERE review_id = ? AND user_id = ?', [id, userId]);
      await pool.query('UPDATE reviews SET helpful_count = GREATEST(0, helpful_count - 1) WHERE id = ?', [id]);
      return res.status(200).json(ApiResponse.success({ helpful: false }, 'Vote removed'));
    } else {
      // Add vote
      await pool.query('INSERT INTO review_helpful_votes (review_id, user_id) VALUES (?, ?)', [id, userId]);
      await pool.query('UPDATE reviews SET helpful_count = helpful_count + 1 WHERE id = ?', [id]);
      return res.status(200).json(ApiResponse.success({ helpful: true }, 'Marked as helpful! Thank you!'));
    }
  } catch (err) {
    next(err);
  }
};

// POST /api/reviews/:id/report (Report review)
exports.reportReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    await pool.query('UPDATE reviews SET reported = TRUE WHERE id = ?', [id]);
    return res.status(200).json(ApiResponse.success(null, 'Review reported for admin inspection. Thank you.'));
  } catch (err) {
    next(err);
  }
};

// GET /api/reviews/admin (Admin - Get all reviews for moderation)
exports.getAdminReviews = async (req, res, next) => {
  try {
    const { status, reported } = req.query;
    let conditions = ['1=1'];
    let params = [];

    if (status && status !== 'ALL') {
      conditions.push('r.status = ?');
      params.push(status);
    }

    if (reported === 'true') {
      conditions.push('r.reported = TRUE');
    }

    const [rows] = await pool.query(
      `SELECT r.*, p.name as product_name, p.image_url as product_image, u.full_name as user_name, u.email as user_email
       FROM reviews r
       LEFT JOIN products p ON r.product_id = p.id
       LEFT JOIN users u ON r.user_id = u.id
       WHERE ${conditions.join(' AND ')}
       ORDER BY r.id DESC`,
      params
    );

    const dtos = rows.map(r => ({
      ...mapReviewDTO(r),
      productName: r.product_name || `Product #${r.product_id}`,
      productImage: r.product_image || '',
      userEmail: r.user_email || ''
    }));

    return res.status(200).json(ApiResponse.success(dtos, 'Admin reviews retrieved successfully'));
  } catch (err) {
    next(err);
  }
};

// PUT /api/reviews/admin/:id/status (Admin - Approve or Reject review)
exports.updateReviewStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'Approved', 'Rejected', 'Pending'

    if (!['Approved', 'Rejected', 'Pending'].includes(status)) {
      return res.status(400).json(ApiResponse.error('Invalid review status'));
    }

    await pool.query('UPDATE reviews SET status = ?, reported = FALSE WHERE id = ?', [status, id]);
    return res.status(200).json(ApiResponse.success(null, `Review status updated to "${status}"`));
  } catch (err) {
    next(err);
  }
};

// DELETE /api/reviews/admin/:id (Admin - Delete review)
exports.deleteReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM reviews WHERE id = ?', [id]);
    return res.status(200).json(ApiResponse.success(null, 'Review deleted successfully'));
  } catch (err) {
    next(err);
  }
};
