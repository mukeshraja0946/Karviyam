const pool = require('../config/db');
const ApiResponse = require('../utils/apiResponse');

exports.validateCoupon = async (req, res, next) => {
  try {
    const code = (req.query.code || req.body.code || '').trim().toUpperCase();
    const orderAmount = parseFloat(req.query.amount || req.body.amount || 0);

    if (!code) {
      return res.status(400).json(ApiResponse.error('Coupon code is required'));
    }

    const [rows] = await pool.query('SELECT * FROM coupons WHERE UPPER(code) = ? AND (active = 1 OR active IS NULL)', [code]);
    if (rows.length === 0) {
      return res.status(400).json(ApiResponse.error('Invalid or expired coupon code'));
    }

    const coupon = rows[0];
    const minAmount = parseFloat(coupon.min_order_amount || 0);
    if (orderAmount < minAmount) {
      return res.status(400).json(ApiResponse.error(`Minimum order amount of ₹${minAmount} required to use this coupon`));
    }

    let discount = 0;
    const value = parseFloat(coupon.discount_value || 0);
    if (coupon.discount_type === 'PERCENTAGE') {
      discount = (orderAmount * value) / 100;
    } else {
      discount = value;
    }

    discount = Math.min(orderAmount, discount);

    return res.status(200).json(ApiResponse.success({
      code: coupon.code,
      discountType: coupon.discount_type,
      discountValue: value,
      calculatedDiscount: parseFloat(discount.toFixed(2)),
      minOrderAmount: minAmount
    }, 'Coupon applied successfully!'));
  } catch (err) {
    next(err);
  }
};
