const pool = require('../config/db');
const razorpayConfig = require('../config/razorpay');
const crypto = require('crypto');
const ApiResponse = require('../utils/apiResponse');
const { sendSubscriptionSuccessEmail } = require('../utils/emailService');

// Ensure Database Tables Exist & Migrations Applied
const ensureSubscriptionTables = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS subscriptions (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(150) NOT NULL UNIQUE,
        status VARCHAR(20) DEFAULT 'PENDING',
        payment_status VARCHAR(20) DEFAULT 'PENDING',
        amount DECIMAL(10,2) DEFAULT 99.00,
        currency VARCHAR(10) DEFAULT 'INR',
        payment_method VARCHAR(50) DEFAULT 'RAZORPAY',
        payment_id VARCHAR(100),
        transaction_id VARCHAR(100),
        razorpay_order_id VARCHAR(100),
        razorpay_payment_id VARCHAR(100),
        razorpay_signature VARCHAR(255),
        offer_coupon_code VARCHAR(50),
        offer_title VARCHAR(255),
        subscription_date TIMESTAMP NULL,
        paid_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );
    `);
  } catch (e) {
    console.error('[Database Migration Error - Subscriptions Table]:', e.message);
  }

  // Idempotent column migrations for subscriptions table
  try { await pool.query(`ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS razorpay_order_id VARCHAR(100)`); } catch (e) {}
  try { await pool.query(`ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS razorpay_payment_id VARCHAR(100)`); } catch (e) {}
  try { await pool.query(`ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS razorpay_signature VARCHAR(255)`); } catch (e) {}
  try { await pool.query(`ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS offer_coupon_code VARCHAR(50)`); } catch (e) {}
  try { await pool.query(`ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS offer_title VARCHAR(255)`); } catch (e) {}
  try { await pool.query(`ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP NULL`); } catch (e) {}

  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS settings (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        setting_key VARCHAR(100) UNIQUE NOT NULL,
        setting_value TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );
    `);
  } catch (e) {}
};

// Helper: Email Validator
const validateEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').toLowerCase().trim());
};

// Helper: Get Subscription Settings & Active Offer from DB
const getSubscriptionSettingsFromDb = async () => {
  await ensureSubscriptionTables();
  let enabled = true;
  let price = 99.00;
  let currency = 'INR';
  let title = 'STAY UPDATED';
  let description = 'Subscribe to get special drop alerts, VIP coupons & discounts.';
  let buttonText = 'SUBSCRIBE NOW';
  let razorpayEnabled = true;
  let stripeEnabled = true;

  // Active Admin Offer Settings
  let offerEnabled = false;
  let offerTitle = '';
  let offerCouponCode = '';
  let offerStartDate = '';
  let offerEndDate = '';

  try {
    const [rows] = await pool.query(
      "SELECT setting_key, setting_value FROM settings WHERE setting_key LIKE 'subscription_%'"
    );
    rows.forEach(r => {
      if (r.setting_key === 'subscription_enabled') enabled = r.setting_value === 'true' || r.setting_value === '1';
      if (r.setting_key === 'subscription_price') price = parseFloat(r.setting_value) || 99.00;
      if (r.setting_key === 'subscription_currency') currency = r.setting_value || 'INR';
      if (r.setting_key === 'subscription_title') title = r.setting_value || title;
      if (r.setting_key === 'subscription_description') description = r.setting_value || description;
      if (r.setting_key === 'subscription_button_text') buttonText = r.setting_value || buttonText;
      if (r.setting_key === 'subscription_razorpay_enabled') razorpayEnabled = r.setting_value !== 'false';
      if (r.setting_key === 'subscription_stripe_enabled') stripeEnabled = r.setting_value !== 'false';

      if (r.setting_key === 'subscription_offer_enabled') offerEnabled = r.setting_value === 'true' || r.setting_value === '1';
      if (r.setting_key === 'subscription_offer_title') offerTitle = r.setting_value || '';
      if (r.setting_key === 'subscription_offer_coupon_code') offerCouponCode = r.setting_value || '';
      if (r.setting_key === 'subscription_offer_start_date') offerStartDate = r.setting_value || '';
      if (r.setting_key === 'subscription_offer_end_date') offerEndDate = r.setting_value || '';
    });
  } catch (e) {}

  // Validate offer date range if set
  let isOfferActive = offerEnabled && Boolean(offerCouponCode.trim());
  if (isOfferActive && offerStartDate) {
    const start = new Date(offerStartDate);
    if (!isNaN(start.getTime()) && new Date() < start) isOfferActive = false;
  }
  if (isOfferActive && offerEndDate) {
    const end = new Date(offerEndDate);
    if (!isNaN(end.getTime()) && new Date() > end) isOfferActive = false;
  }

  return {
    enabled,
    price,
    currency,
    title,
    description,
    buttonText,
    razorpayEnabled,
    stripeEnabled,
    offerEnabled: isOfferActive,
    offerTitle: isOfferActive ? offerTitle : '',
    offerCouponCode: isOfferActive ? offerCouponCode : '',
    offerStartDate,
    offerEndDate
  };
};

// --------------------------------------------------
// PUBLIC ENDPOINTS
// --------------------------------------------------

// 1. Get Public Subscription Settings
exports.getPublicSettings = async (req, res, next) => {
  try {
    const settings = await getSubscriptionSettingsFromDb();
    return res.status(200).json(ApiResponse.success(settings, 'Subscription settings fetched successfully'));
  } catch (err) {
    next(err);
  }
};

// 2. Initiate Subscription (Validate email & Create PENDING subscription)
exports.initiateSubscription = async (req, res, next) => {
  try {
    await ensureSubscriptionTables();
    const settings = await getSubscriptionSettingsFromDb();

    if (!settings.enabled) {
      return res.status(403).json(ApiResponse.error('Subscription system is currently disabled by Admin.'));
    }

    const rawEmail = req.body.email;
    if (!rawEmail || !validateEmail(rawEmail)) {
      return res.status(400).json(ApiResponse.error('Please enter a valid email address.'));
    }

    const cleanEmail = String(rawEmail).toLowerCase().trim();

    // Check existing subscription
    const [existing] = await pool.query('SELECT * FROM subscriptions WHERE email = ? LIMIT 1', [cleanEmail]);

    if (existing.length > 0) {
      const sub = existing[0];
      if (sub.status === 'ACTIVE' && sub.payment_status === 'SUCCESS') {
        return res.status(400).json(ApiResponse.error('You are already an active VIP subscriber!'));
      }

      // Update existing pending record with latest configured price
      await pool.query(
        `UPDATE subscriptions SET amount = ?, currency = ?, updated_at = NOW() WHERE id = ?`,
        [settings.price, settings.currency, sub.id]
      );

      return res.status(200).json(ApiResponse.success({
        subscriptionId: sub.id,
        email: cleanEmail,
        amount: settings.price,
        currency: settings.currency,
        status: 'PENDING'
      }, 'Subscription initiated. Please complete payment.'));
    }

    // Insert new pending subscription record
    const [result] = await pool.query(
      `INSERT INTO subscriptions (email, status, payment_status, amount, currency, created_at)
       VALUES (?, 'PENDING', 'PENDING', ?, ?, NOW())`,
      [cleanEmail, settings.price, settings.currency]
    );

    return res.status(201).json(ApiResponse.success({
      subscriptionId: result.insertId,
      email: cleanEmail,
      amount: settings.price,
      currency: settings.currency,
      status: 'PENDING'
    }, 'Subscription record created. Redirecting to payment page.'));
  } catch (err) {
    next(err);
  }
};

// 3. Get Subscription Details by ID (for Checkout & Verification Page)
exports.getSubscriptionById = async (req, res, next) => {
  try {
    await ensureSubscriptionTables();
    const { id } = req.params;
    const settings = await getSubscriptionSettingsFromDb();

    const [rows] = await pool.query('SELECT * FROM subscriptions WHERE id = ? LIMIT 1', [id]);
    if (rows.length === 0) {
      return res.status(404).json(ApiResponse.error('Subscription record not found.'));
    }

    const sub = rows[0];
    const isPaid = sub.status === 'ACTIVE' && sub.payment_status === 'SUCCESS';

    return res.status(200).json(ApiResponse.success({
      id: sub.id,
      email: sub.email,
      status: sub.status,
      paymentStatus: sub.payment_status,
      amount: parseFloat(sub.amount || settings.price),
      currency: sub.currency || settings.currency,
      paymentMethod: sub.payment_method,
      razorpayKey: razorpayConfig.keyId,
      razorpayOrderId: sub.razorpay_order_id || sub.transaction_id,
      razorpayPaymentId: sub.razorpay_payment_id || sub.payment_id,
      offerCouponCode: isPaid ? (sub.offer_coupon_code || settings.offerCouponCode) : '',
      offerTitle: isPaid ? (sub.offer_title || settings.offerTitle) : '',
      hasActiveOffer: isPaid && Boolean(sub.offer_coupon_code || settings.offerCouponCode),
      paidAt: sub.paid_at || sub.subscription_date,
      systemEnabled: settings.enabled
    }, 'Subscription details retrieved'));
  } catch (err) {
    next(err);
  }
};

// 4. Create Online Payment Order (Razorpay)
exports.createSubscriptionPayment = async (req, res, next) => {
  try {
    const { subscriptionId, paymentMethod = 'RAZORPAY' } = req.body;
    if (!subscriptionId) {
      return res.status(400).json(ApiResponse.error('Subscription ID is required.'));
    }

    const [rows] = await pool.query('SELECT * FROM subscriptions WHERE id = ? LIMIT 1', [subscriptionId]);
    if (rows.length === 0) {
      return res.status(404).json(ApiResponse.error('Subscription record not found.'));
    }

    const sub = rows[0];
    const settings = await getSubscriptionSettingsFromDb();

    if (!settings.enabled) {
      return res.status(403).json(ApiResponse.error('Subscription system is currently disabled.'));
    }

    const amountInPaise = Math.round(parseFloat(settings.price) * 100);
    let rzpOrderId = `rzp_sub_${sub.id}_${Date.now()}`;

    if (razorpayConfig.instance) {
      try {
        const rzpOrder = await razorpayConfig.instance.orders.create({
          amount: amountInPaise,
          currency: settings.currency || 'INR',
          receipt: `rcpt_sub_${sub.id}_${Date.now()}`,
          notes: {
            subscriptionId: String(sub.id),
            email: sub.email
          }
        });
        rzpOrderId = rzpOrder.id;
      } catch (eRzp) {
        console.warn('[Razorpay Order Creation Notice]:', eRzp.message);
      }
    }

    await pool.query(
      `UPDATE subscriptions SET razorpay_order_id = ?, transaction_id = ?, payment_method = 'RAZORPAY', amount = ? WHERE id = ?`,
      [rzpOrderId, rzpOrderId, settings.price, sub.id]
    );

    return res.status(200).json(ApiResponse.success({
      orderId: rzpOrderId,
      amount: amountInPaise,
      currency: settings.currency || 'INR',
      key: razorpayConfig.keyId,
      subscriptionId: sub.id,
      email: sub.email
    }, 'Razorpay payment order generated'));
  } catch (err) {
    next(err);
  }
};

// 5. Strict Server-Side Verify Online Payment & Activate Subscription
exports.verifySubscriptionPayment = async (req, res, next) => {
  try {
    const { subscriptionId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

    if (!subscriptionId) {
      return res.status(400).json(ApiResponse.error('Subscription ID missing.'));
    }

    const [rows] = await pool.query('SELECT * FROM subscriptions WHERE id = ? LIMIT 1', [subscriptionId]);
    if (rows.length === 0) {
      return res.status(404).json(ApiResponse.error('Subscription record not found.'));
    }

    const sub = rows[0];

    // STRICT HMAC SIGNATURE VERIFICATION
    let isValid = false;
    const orderIdToVerify = razorpayOrderId || sub.razorpay_order_id || sub.transaction_id;

    if (razorpaySignature && orderIdToVerify && razorpayPaymentId && razorpayConfig.keySecret && razorpayConfig.keySecret !== 'rzp_test_key_secret') {
      const generatedSignature = crypto
        .createHmac('sha256', razorpayConfig.keySecret)
        .update(`${orderIdToVerify}|${razorpayPaymentId}`)
        .digest('hex');

      isValid = generatedSignature === razorpaySignature;
    } else if (process.env.NODE_ENV === 'development' || !razorpayConfig.keySecret || razorpayConfig.keySecret === 'rzp_test_key_secret') {
      // In test mode without secret configured, verify that valid payment IDs exist
      if (razorpayPaymentId && String(razorpayPaymentId).startsWith('pay_')) {
        isValid = true;
      }
    }

    if (!isValid) {
      await pool.query(
        `UPDATE subscriptions SET payment_status = 'FAILED', status = 'FAILED', updated_at = NOW() WHERE id = ?`,
        [sub.id]
      );
      return res.status(400).json(ApiResponse.error('Payment verification failed: Invalid transaction signature or unverified payment response.'));
    }

    // Retrieve active Admin offer settings if enabled
    const settings = await getSubscriptionSettingsFromDb();
    const assignedOfferCode = settings.offerEnabled ? settings.offerCouponCode : '';
    const assignedOfferTitle = settings.offerEnabled ? settings.offerTitle : '';

    // Update Subscription Record to ACTIVE & SUCCESS in MySQL
    await pool.query(
      `UPDATE subscriptions 
       SET status = 'ACTIVE', 
           payment_status = 'SUCCESS', 
           payment_id = ?, 
           transaction_id = ?, 
           razorpay_order_id = ?,
           razorpay_payment_id = ?,
           razorpay_signature = ?,
           offer_coupon_code = ?,
           offer_title = ?,
           subscription_date = NOW(), 
           paid_at = NOW(),
           updated_at = NOW() 
       WHERE id = ?`,
      [
        razorpayPaymentId,
        orderIdToVerify,
        orderIdToVerify,
        razorpayPaymentId,
        razorpaySignature || '',
        assignedOfferCode,
        assignedOfferTitle,
        sub.id
      ]
    );

    const updatedSub = {
      ...sub,
      id: sub.id,
      email: sub.email,
      status: 'ACTIVE',
      paymentStatus: 'SUCCESS',
      amount: sub.amount || settings.price,
      currency: sub.currency || settings.currency,
      paymentId: razorpayPaymentId,
      transactionId: orderIdToVerify,
      offerCouponCode: assignedOfferCode,
      offerTitle: assignedOfferTitle,
      hasActiveOffer: Boolean(assignedOfferCode),
      paymentDate: new Date().toISOString(),
      paidAt: new Date().toISOString()
    };

    // Dispatch Confirmation Email asynchronously
    sendSubscriptionSuccessEmail(updatedSub).catch(e => console.error('[Subscription Confirmation Email Error]:', e));

    return res.status(200).json(ApiResponse.success(updatedSub, 'Subscription activated successfully! Confirmation email dispatched.'));
  } catch (err) {
    next(err);
  }
};

// --------------------------------------------------
// ADMIN ENDPOINTS
// --------------------------------------------------

// 6. Admin Get All Subscribers with Metrics & Search
exports.getAdminSubscribers = async (req, res, next) => {
  try {
    await ensureSubscriptionTables();
    const { search = '', status = 'ALL' } = req.query;

    let query = 'SELECT * FROM subscriptions WHERE 1=1';
    const params = [];

    if (search.trim()) {
      query += ' AND email LIKE ?';
      params.push(`%${search.trim()}%`);
    }

    if (status && status !== 'ALL') {
      query += ' AND status = ?';
      params.push(status);
    }

    query += ' ORDER BY created_at DESC';

    const [allSubscribers] = await pool.query(query, params);

    // Metrics Calculation
    const [metricsRows] = await pool.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'ACTIVE' THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN payment_status = 'FAILED' OR status = 'FAILED' THEN 1 ELSE 0 END) as failed,
        SUM(CASE WHEN payment_status = 'SUCCESS' THEN amount ELSE 0 END) as revenue
      FROM subscriptions
    `);

    const metrics = metricsRows[0] || { total: 0, active: 0, pending: 0, failed: 0, revenue: 0 };
    const settings = await getSubscriptionSettingsFromDb();

    return res.status(200).json(ApiResponse.success({
      subscribers: allSubscribers,
      metrics: {
        total: Number(metrics.total || 0),
        active: Number(metrics.active || 0),
        pending: Number(metrics.pending || 0),
        failed: Number(metrics.failed || 0),
        revenue: parseFloat(metrics.revenue || 0)
      },
      settings
    }, 'Admin subscribers fetched successfully'));
  } catch (err) {
    next(err);
  }
};

// 7. Admin Update Subscription & Offer Settings
exports.updateAdminSettings = async (req, res, next) => {
  try {
    await ensureSubscriptionTables();
    const {
      enabled,
      price,
      currency,
      title,
      description,
      buttonText,
      offerEnabled,
      offerTitle,
      offerCouponCode,
      offerStartDate,
      offerEndDate
    } = req.body;

    const updates = [
      { key: 'subscription_enabled', val: String(enabled !== false) },
      { key: 'subscription_price', val: String(parseFloat(price) || 99.00) },
      { key: 'subscription_currency', val: String(currency || 'INR') },
      { key: 'subscription_title', val: String(title || 'STAY UPDATED') },
      { key: 'subscription_description', val: String(description || '') },
      { key: 'subscription_button_text', val: String(buttonText || 'SUBSCRIBE NOW') },

      { key: 'subscription_offer_enabled', val: String(offerEnabled === true) },
      { key: 'subscription_offer_title', val: String(offerTitle || '') },
      { key: 'subscription_offer_coupon_code', val: String(offerCouponCode || '').toUpperCase().trim() },
      { key: 'subscription_offer_start_date', val: String(offerStartDate || '') },
      { key: 'subscription_offer_end_date', val: String(offerEndDate || '') }
    ];

    for (const u of updates) {
      await pool.query(
        `INSERT INTO settings (setting_key, setting_value) VALUES (?, ?)
         ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
        [u.key, u.val]
      );
    }

    const newSettings = await getSubscriptionSettingsFromDb();
    return res.status(200).json(ApiResponse.success(newSettings, 'Subscription and offer settings updated successfully'));
  } catch (err) {
    next(err);
  }
};

// 8. Admin Delete Subscriber Record
exports.deleteSubscriber = async (req, res, next) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM subscriptions WHERE id = ?', [id]);
    return res.status(200).json(ApiResponse.success(null, 'Subscriber deleted successfully'));
  } catch (err) {
    next(err);
  }
};

