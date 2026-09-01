const pool = require('../config/db');
const razorpayConfig = require('../config/razorpay');
const crypto = require('crypto');
const ApiResponse = require('../utils/apiResponse');
const { sendSubscriptionSuccessEmail } = require('../utils/emailService');

// Ensure Database Tables Exist
const ensureSubscriptionTables = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS subscriptions (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(150) NOT NULL UNIQUE,
        status VARCHAR(20) DEFAULT 'PENDING',
        payment_status VARCHAR(20) DEFAULT 'PENDING',
        amount DECIMAL(10,2) DEFAULT 0.00,
        currency VARCHAR(10) DEFAULT 'INR',
        payment_method VARCHAR(50) DEFAULT 'RAZORPAY',
        payment_id VARCHAR(100),
        transaction_id VARCHAR(100),
        subscription_date TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );
    `);
  } catch (e) {
    console.error('[Database Migration Error - Subscriptions Table]:', e.message);
  }

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

// Helper: Get Subscription Settings from DB
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
    });
  } catch (e) {}

  return {
    enabled,
    price,
    currency,
    title,
    description,
    buttonText,
    razorpayEnabled,
    stripeEnabled
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

// 3. Get Subscription Details by ID (for Checkout Page)
exports.getSubscriptionById = async (req, res, next) => {
  try {
    await ensureSubscriptionTables();
    const { id } = req.params;
    const settings = await getSubscriptionSettingsFromDb();

    if (!settings.enabled) {
      return res.status(403).json(ApiResponse.error('Subscriptions are currently disabled.'));
    }

    const [rows] = await pool.query('SELECT * FROM subscriptions WHERE id = ? LIMIT 1', [id]);
    if (rows.length === 0) {
      return res.status(404).json(ApiResponse.error('Subscription record not found.'));
    }

    const sub = rows[0];
    return res.status(200).json(ApiResponse.success({
      id: sub.id,
      email: sub.email,
      status: sub.status,
      paymentStatus: sub.payment_status,
      amount: parseFloat(sub.amount || settings.price),
      currency: sub.currency || settings.currency,
      paymentMethod: sub.payment_method,
      razorpayKey: razorpayConfig.keyId
    }, 'Subscription details retrieved'));
  } catch (err) {
    next(err);
  }
};

// 4. Create Online Payment Order (Razorpay / Stripe)
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
    const amountInPaise = Math.round(parseFloat(settings.price) * 100);

    if (paymentMethod.toUpperCase() === 'RAZORPAY') {
      let rzpOrderId = `rzp_sub_${sub.id}_${Date.now()}`;

      if (razorpayConfig.instance) {
        try {
          const rzpOrder = await razorpayConfig.instance.orders.create({
            amount: amountInPaise,
            currency: settings.currency || 'INR',
            receipt: `rcpt_sub_${sub.id}_${Date.now()}`
          });
          rzpOrderId = rzpOrder.id;
        } catch (eRzp) {
          console.warn('[Razorpay Order Creation Warning]: Using mock token fallback:', eRzp.message);
        }
      }

      await pool.query(
        `UPDATE subscriptions SET transaction_id = ?, payment_method = 'RAZORPAY', amount = ? WHERE id = ?`,
        [rzpOrderId, settings.price, sub.id]
      );

      return res.status(200).json(ApiResponse.success({
        orderId: rzpOrderId,
        amount: amountInPaise,
        currency: settings.currency || 'INR',
        key: razorpayConfig.keyId,
        subscriptionId: sub.id,
        email: sub.email
      }, 'Razorpay payment order generated'));
    }

    return res.status(400).json(ApiResponse.error('Unsupported online payment method.'));
  } catch (err) {
    next(err);
  }
};

// 5. Verify Online Payment & Activate Subscription
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

    // HMAC Signature Check if live key Secret configured
    let isValid = true;
    if (razorpaySignature && razorpayConfig.keySecret && razorpayConfig.keySecret !== 'rzp_test_key_secret') {
      const generatedSignature = crypto
        .createHmac('sha256', razorpayConfig.keySecret)
        .update(`${razorpayOrderId}|${razorpayPaymentId}`)
        .digest('hex');

      isValid = generatedSignature === razorpaySignature;
    }

    if (!isValid) {
      await pool.query(
        `UPDATE subscriptions SET payment_status = 'FAILED', status = 'FAILED' WHERE id = ?`,
        [sub.id]
      );
      return res.status(400).json(ApiResponse.error('Payment verification failed: Invalid transaction signature.'));
    }

    const pmtId = razorpayPaymentId || `pay_sub_${sub.id}_${Date.now()}`;

    // Update Subscription Record to ACTIVE & SUCCESS in MySQL
    await pool.query(
      `UPDATE subscriptions 
       SET status = 'ACTIVE', 
           payment_status = 'SUCCESS', 
           payment_id = ?, 
           transaction_id = ?, 
           subscription_date = NOW(), 
           updated_at = NOW() 
       WHERE id = ?`,
      [pmtId, razorpayOrderId || sub.transaction_id, sub.id]
    );

    const updatedSub = {
      ...sub,
      id: sub.id,
      email: sub.email,
      status: 'ACTIVE',
      paymentStatus: 'SUCCESS',
      amount: sub.amount,
      currency: sub.currency,
      paymentId: pmtId,
      paymentDate: new Date().toISOString()
    };

    // Automatically send Confirmation Email asynchronously
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

// 7. Admin Update Subscription Settings
exports.updateAdminSettings = async (req, res, next) => {
  try {
    await ensureSubscriptionTables();
    const { enabled, price, currency, title, description, buttonText } = req.body;

    const updates = [
      { key: 'subscription_enabled', val: String(enabled !== false) },
      { key: 'subscription_price', val: String(parseFloat(price) || 99.00) },
      { key: 'subscription_currency', val: String(currency || 'INR') },
      { key: 'subscription_title', val: String(title || 'STAY UPDATED') },
      { key: 'subscription_description', val: String(description || '') },
      { key: 'subscription_button_text', val: String(buttonText || 'SUBSCRIBE NOW') }
    ];

    for (const u of updates) {
      await pool.query(
        `INSERT INTO settings (setting_key, setting_value) VALUES (?, ?)
         ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
        [u.key, u.val]
      );
    }

    const newSettings = await getSubscriptionSettingsFromDb();
    return res.status(200).json(ApiResponse.success(newSettings, 'Subscription settings updated successfully'));
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
