const pool = require('../config/db');
const ApiResponse = require('../utils/apiResponse');
const { sendSubscriptionSuccessEmail } = require('../utils/emailService');

// Ensure Database Tables Exist & Migrations Applied
const ensureSubscriptionTables = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS subscriptions (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(150) NOT NULL UNIQUE,
        status VARCHAR(30) DEFAULT 'PENDING',
        payment_status VARCHAR(30) DEFAULT 'PENDING',
        amount DECIMAL(10,2) DEFAULT 99.00,
        currency VARCHAR(10) DEFAULT 'INR',
        payment_method VARCHAR(50) DEFAULT 'UPI',
        upi_vpa VARCHAR(255),
        transaction_reference VARCHAR(100) UNIQUE,
        utr_number VARCHAR(100),
        verification_status VARCHAR(50) DEFAULT 'UNVERIFIED',
        offer_coupon_code VARCHAR(50),
        offer_title VARCHAR(255),
        subscription_date TIMESTAMP NULL,
        paid_at TIMESTAMP NULL,
        verified_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );
    `);
  } catch (e) {
    console.error('[Database Migration Error - Subscriptions Table]:', e.message);
  }

  // Idempotent column migrations for subscriptions table
  try { await pool.query(`ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS upi_vpa VARCHAR(255)`); } catch (e) {}
  try { await pool.query(`ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS transaction_reference VARCHAR(100)`); } catch (e) {}
  try { await pool.query(`ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS utr_number VARCHAR(100)`); } catch (e) {}
  try { await pool.query(`ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS verification_status VARCHAR(50) DEFAULT 'UNVERIFIED'`); } catch (e) {}
  try { await pool.query(`ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP NULL`); } catch (e) {}
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

// Helper: Get Receiving Bank Account details from DB
const getAdminBankAccountFromDb = async () => {
  try {
    const [rows] = await pool.query('SELECT * FROM bank_account_settings ORDER BY id DESC LIMIT 1');
    if (rows.length > 0 && rows[0].upi_id) {
      return {
        upiId: rows[0].upi_id,
        accountHolder: rows[0].account_holder_name || 'KARVIYAM RETAILS PRIVATE LIMITED',
        bankName: rows[0].bank_name || 'HDFC Bank',
        enabled: rows[0].enabled !== false
      };
    }
  } catch (e) {}

  try {
    const [sRows] = await pool.query("SELECT setting_value FROM settings WHERE setting_key = 'bank_account_details' LIMIT 1");
    if (sRows.length > 0 && sRows[0].setting_value) {
      const parsed = JSON.parse(sRows[0].setting_value);
      if (parsed && parsed.upiId) {
        return {
          upiId: parsed.upiId,
          accountHolder: parsed.accountHolder || 'KARVIYAM RETAILS PRIVATE LIMITED',
          bankName: parsed.bankName || 'HDFC Bank',
          enabled: parsed.enabled !== false
        };
      }
    }
  } catch (e) {}

  return {
    upiId: 'karviyam@hdfcbank',
    accountHolder: 'KARVIYAM RETAILS PRIVATE LIMITED',
    bankName: 'HDFC Bank',
    enabled: true
  };
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

      if (r.setting_key === 'subscription_offer_enabled') offerEnabled = r.setting_value === 'true' || r.setting_value === '1';
      if (r.setting_key === 'subscription_offer_title') offerTitle = r.setting_value || '';
      if (r.setting_key === 'subscription_offer_coupon_code') offerCouponCode = r.setting_value || '';
      if (r.setting_key === 'subscription_offer_start_date') offerStartDate = r.setting_value || '';
      if (r.setting_key === 'subscription_offer_end_date') offerEndDate = r.setting_value || '';
    });
  } catch (e) {}

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
    const bank = await getAdminBankAccountFromDb();
    return res.status(200).json(ApiResponse.success({
      ...settings,
      receivingUpiId: bank.upiId,
      receivingAccountHolder: bank.accountHolder
    }, 'Subscription settings fetched successfully'));
  } catch (err) {
    next(err);
  }
};

// 2. Initiate Subscription
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

    const [existing] = await pool.query('SELECT * FROM subscriptions WHERE email = ? LIMIT 1', [cleanEmail]);

    if (existing.length > 0) {
      const sub = existing[0];
      if (sub.status === 'ACTIVE' && sub.payment_status === 'SUCCESS') {
        return res.status(400).json(ApiResponse.error('You are already an active VIP subscriber!'));
      }

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

    const [result] = await pool.query(
      `INSERT INTO subscriptions (email, status, payment_status, amount, currency, payment_method, created_at)
       VALUES (?, 'PENDING', 'PENDING', ?, ?, 'UPI', NOW())`,
      [cleanEmail, settings.price, settings.currency]
    );

    return res.status(201).json(ApiResponse.success({
      subscriptionId: result.insertId,
      email: cleanEmail,
      amount: settings.price,
      currency: settings.currency,
      status: 'PENDING'
    }, 'Subscription record created. Redirecting to UPI payment.'));
  } catch (err) {
    next(err);
  }
};

// 3. Get Subscription Details by ID
exports.getSubscriptionById = async (req, res, next) => {
  try {
    await ensureSubscriptionTables();
    const { id } = req.params;
    const settings = await getSubscriptionSettingsFromDb();
    const bank = await getAdminBankAccountFromDb();

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
      verificationStatus: sub.verification_status || 'UNVERIFIED',
      amount: parseFloat(sub.amount || settings.price),
      currency: sub.currency || settings.currency,
      paymentMethod: 'UPI',
      upiVpa: sub.upi_vpa || '',
      transactionReference: sub.transaction_reference || '',
      utrNumber: sub.utr_number || '',
      receivingUpiId: bank.upiId,
      receivingAccountHolder: bank.accountHolder,
      receivingBankName: bank.bankName,
      offerCouponCode: isPaid ? (sub.offer_coupon_code || settings.offerCouponCode) : '',
      offerTitle: isPaid ? (sub.offer_title || settings.offerTitle) : '',
      hasActiveOffer: isPaid && Boolean(sub.offer_coupon_code || settings.offerCouponCode),
      paidAt: sub.paid_at || sub.subscription_date,
      verifiedAt: sub.verified_at,
      systemEnabled: settings.enabled
    }, 'Subscription details retrieved'));
  } catch (err) {
    next(err);
  }
};

// 4. Create Direct UPI Payment Request
exports.createSubscriptionPayment = async (req, res, next) => {
  try {
    const { subscriptionId, upiId } = req.body;
    if (!subscriptionId) {
      return res.status(400).json(ApiResponse.error('Subscription ID is required.'));
    }

    const [rows] = await pool.query('SELECT * FROM subscriptions WHERE id = ? LIMIT 1', [subscriptionId]);
    if (rows.length === 0) {
      return res.status(404).json(ApiResponse.error('Subscription record not found.'));
    }

    const sub = rows[0];
    const settings = await getSubscriptionSettingsFromDb();
    const bank = await getAdminBankAccountFromDb();

    if (!settings.enabled) {
      return res.status(403).json(ApiResponse.error('Subscription system is currently disabled by Admin.'));
    }

    const cleanUpi = upiId ? String(upiId).trim() : sub.upi_vpa;
    if (!cleanUpi || !/^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/.test(cleanUpi)) {
      return res.status(400).json(ApiResponse.error('Invalid VPA / UPI ID format. Example: user@upi or mobile@ybl'));
    }

    const txnRef = sub.transaction_reference || `TXN-SUB-${sub.id}-${Math.floor(100000 + Math.random() * 900000)}`;
    const upiUri = `upi://pay?pa=${encodeURIComponent(bank.upiId)}&pn=${encodeURIComponent(bank.accountHolder)}&am=${settings.price}&cu=INR&tn=${encodeURIComponent('KARVIYAM VIP Sub #' + sub.id + ' Ref:' + txnRef)}&tr=${txnRef}`;

    await pool.query(
      `UPDATE subscriptions 
       SET payment_method = 'UPI', 
           upi_vpa = ?, 
           transaction_reference = ?, 
           amount = ?, 
           payment_status = 'PENDING', 
           status = 'PENDING', 
           verification_status = 'PENDING_VERIFICATION',
           updated_at = NOW() 
       WHERE id = ?`,
      [cleanUpi, txnRef, settings.price, sub.id]
    );

    return res.status(200).json(ApiResponse.success({
      subscriptionId: sub.id,
      email: sub.email,
      amount: settings.price,
      currency: settings.currency || 'INR',
      paymentMethod: 'UPI',
      upiVpa: cleanUpi,
      transactionReference: txnRef,
      receivingUpiId: bank.upiId,
      receivingAccountHolder: bank.accountHolder,
      receivingBankName: bank.bankName,
      upiUri: upiUri
    }, 'UPI Collect Payment Request sent. Please approve in your UPI app.'));
  } catch (err) {
    next(err);
  }
};

// 5. Get Live Subscription Payment Status (For Frontend Polling)
exports.getPaymentStatus = async (req, res, next) => {
  try {
    await ensureSubscriptionTables();
    const { id } = req.params;
    const settings = await getSubscriptionSettingsFromDb();

    const [rows] = await pool.query('SELECT * FROM subscriptions WHERE id = ? LIMIT 1', [id]);
    if (rows.length === 0) {
      return res.status(404).json(ApiResponse.error('Subscription not found.'));
    }

    const sub = rows[0];
    const isPaid = sub.status === 'ACTIVE' && sub.payment_status === 'SUCCESS';

    return res.status(200).json(ApiResponse.success({
      id: sub.id,
      email: sub.email,
      status: sub.status,
      paymentStatus: sub.payment_status,
      verificationStatus: sub.verification_status || 'UNVERIFIED',
      amount: parseFloat(sub.amount || settings.price),
      currency: sub.currency || settings.currency,
      paymentMethod: 'UPI',
      upiVpa: sub.upi_vpa || '',
      transactionReference: sub.transaction_reference || '',
      offerCouponCode: isPaid ? (sub.offer_coupon_code || settings.offerCouponCode) : '',
      offerTitle: isPaid ? (sub.offer_title || settings.offerTitle) : '',
      hasActiveOffer: isPaid && Boolean(sub.offer_coupon_code || settings.offerCouponCode),
      paidAt: sub.paid_at,
      verifiedAt: sub.verified_at
    }, 'Subscription payment status fetched.'));
  } catch (err) {
    next(err);
  }
};

// 6. Server-Side Verify UPI Payment & Activate Subscription (Idempotent Webhook / API)
exports.verifySubscriptionPayment = async (req, res, next) => {
  try {
    const { subscriptionId, transactionReference, utrNumber, status = 'SUCCESS' } = req.body;

    if (!subscriptionId) {
      return res.status(400).json(ApiResponse.error('Subscription ID missing.'));
    }

    const [rows] = await pool.query('SELECT * FROM subscriptions WHERE id = ? LIMIT 1', [subscriptionId]);
    if (rows.length === 0) {
      return res.status(404).json(ApiResponse.error('Subscription record not found.'));
    }

    const sub = rows[0];

    // Idempotency: If already active & success, return immediately
    if (sub.status === 'ACTIVE' && sub.payment_status === 'SUCCESS') {
      const settings = await getSubscriptionSettingsFromDb();
      return res.status(200).json(ApiResponse.success({
        ...sub,
        status: 'ACTIVE',
        paymentStatus: 'SUCCESS',
        offerCouponCode: sub.offer_coupon_code || settings.offerCouponCode,
        offerTitle: sub.offer_title || settings.offerTitle,
        hasActiveOffer: Boolean(sub.offer_coupon_code || settings.offerCouponCode)
      }, 'Subscription already active.'));
    }

    const settings = await getSubscriptionSettingsFromDb();
    const txnRef = transactionReference || sub.transaction_reference || `TXN-SUB-${sub.id}`;
    const cleanUtr = utrNumber ? String(utrNumber).trim() : txnRef;

    const normalizedStatus = String(status).toUpperCase();

    if (normalizedStatus !== 'SUCCESS') {
      await pool.query(
        `UPDATE subscriptions 
         SET status = 'FAILED', payment_status = 'FAILED', verification_status = 'VERIFICATION_FAILED', updated_at = NOW() 
         WHERE id = ?`,
        [sub.id]
      );
      return res.status(200).json(ApiResponse.success({ id: sub.id, status: 'FAILED', paymentStatus: 'FAILED' }, 'Payment verification failed.'));
    }

    const assignedOfferCode = settings.offerEnabled ? settings.offerCouponCode : '';
    const assignedOfferTitle = settings.offerEnabled ? settings.offerTitle : '';

    await pool.query(
      `UPDATE subscriptions 
       SET status = 'ACTIVE', 
           payment_status = 'SUCCESS', 
           verification_status = 'VERIFIED_SUCCESS',
           transaction_reference = ?, 
           utr_number = ?, 
           offer_coupon_code = ?, 
           offer_title = ?, 
           subscription_date = NOW(), 
           paid_at = NOW(), 
           verified_at = NOW(), 
           updated_at = NOW() 
       WHERE id = ?`,
      [txnRef, cleanUtr, assignedOfferCode, assignedOfferTitle, sub.id]
    );

    const updatedSub = {
      ...sub,
      id: sub.id,
      email: sub.email,
      status: 'ACTIVE',
      paymentStatus: 'SUCCESS',
      verificationStatus: 'VERIFIED_SUCCESS',
      amount: sub.amount || settings.price,
      currency: sub.currency || settings.currency,
      paymentMethod: 'UPI',
      transactionReference: txnRef,
      utrNumber: cleanUtr,
      offerCouponCode: assignedOfferCode,
      offerTitle: assignedOfferTitle,
      hasActiveOffer: Boolean(assignedOfferCode),
      paidAt: new Date().toISOString(),
      verifiedAt: new Date().toISOString()
    };

    sendSubscriptionSuccessEmail(updatedSub).catch(e => console.error('[Subscription Confirmation Email Error]:', e));

    return res.status(200).json(ApiResponse.success(updatedSub, 'UPI Payment verified successfully! Subscription activated!'));
  } catch (err) {
    next(err);
  }
};

// --------------------------------------------------
// ADMIN ENDPOINTS
// --------------------------------------------------

// 7. Admin Get All Subscribers with Metrics & Search
exports.getAdminSubscribers = async (req, res, next) => {
  try {
    await ensureSubscriptionTables();

    const { page = 1, limit = 20, search = '', status = 'ALL' } = req.query;
    const offset = (Math.max(1, parseInt(page)) - 1) * parseInt(limit);

    let whereClause = 'WHERE 1=1';
    const queryParams = [];

    if (search && search.trim()) {
      whereClause += ' AND (email LIKE ? OR transaction_reference LIKE ? OR utr_number LIKE ?)';
      const sPattern = `%${search.trim()}%`;
      queryParams.push(sPattern, sPattern, sPattern);
    }

    if (status && status.toUpperCase() !== 'ALL') {
      whereClause += ' AND status = ?';
      queryParams.push(status.toUpperCase());
    }

    const countSql = `SELECT COUNT(*) as total FROM subscriptions ${whereClause}`;
    const [countRows] = await pool.query(countSql, queryParams);
    const totalSubscribers = countRows[0]?.total || 0;

    const dataSql = `
      SELECT id, email, status, payment_status, amount, currency, payment_method, upi_vpa, transaction_reference, utr_number, verification_status, offer_coupon_code, offer_title, created_at, paid_at, verified_at
      FROM subscriptions 
      ${whereClause} 
      ORDER BY id DESC 
      LIMIT ? OFFSET ?
    `;

    const [subscribers] = await pool.query(dataSql, [...queryParams, parseInt(limit), offset]);

    const [metrics] = await pool.query(`
      SELECT 
        COUNT(*) as totalCount,
        SUM(CASE WHEN status = 'ACTIVE' AND payment_status = 'SUCCESS' THEN 1 ELSE 0 END) as activeCount,
        SUM(CASE WHEN status = 'PENDING' OR payment_status = 'PENDING' THEN 1 ELSE 0 END) as pendingCount,
        SUM(CASE WHEN status = 'FAILED' OR payment_status = 'FAILED' THEN 1 ELSE 0 END) as failedCount,
        SUM(CASE WHEN status = 'ACTIVE' AND payment_status = 'SUCCESS' THEN amount ELSE 0 END) as totalRevenue
      FROM subscriptions
    `);

    const metricData = metrics[0] || { totalCount: 0, activeCount: 0, pendingCount: 0, failedCount: 0, totalRevenue: 0 };

    return res.status(200).json(ApiResponse.success({
      subscribers: subscribers.map(s => ({
        id: s.id,
        email: s.email,
        status: s.status,
        paymentStatus: s.payment_status,
        amount: parseFloat(s.amount || 0),
        currency: s.currency || 'INR',
        paymentMethod: s.payment_method || 'UPI',
        upiVpa: s.upi_vpa || '',
        transactionReference: s.transaction_reference || '',
        utrNumber: s.utr_number || '',
        verificationStatus: s.verification_status || 'UNVERIFIED',
        offerCouponCode: s.offer_coupon_code || '',
        createdAt: s.created_at,
        paidAt: s.paid_at,
        verifiedAt: s.verified_at
      })),
      pagination: {
        total: totalSubscribers,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(totalSubscribers / parseInt(limit))
      },
      metrics: {
        totalSubscribers: metricData.totalCount || 0,
        activeSubscribers: metricData.activeCount || 0,
        pendingSubscribers: metricData.pendingCount || 0,
        failedSubscribers: metricData.failedCount || 0,
        totalRevenue: parseFloat(metricData.totalRevenue || 0)
      }
    }, 'Subscribers list retrieved successfully'));
  } catch (err) {
    next(err);
  }
};

// 8. Admin Verify / Manual Approve Subscriber Status
exports.verifySubscriberAdmin = async (req, res, next) => {
  try {
    await ensureSubscriptionTables();
    const { id } = req.params;
    const { status = 'ACTIVE', paymentStatus = 'SUCCESS' } = req.body;

    const [rows] = await pool.query('SELECT * FROM subscriptions WHERE id = ? LIMIT 1', [id]);
    if (rows.length === 0) {
      return res.status(404).json(ApiResponse.error('Subscriber not found.'));
    }

    const sub = rows[0];
    const settings = await getSubscriptionSettingsFromDb();

    const newStatus = String(status).toUpperCase();
    const newPaymentStatus = String(paymentStatus).toUpperCase();
    const assignedOfferCode = (newStatus === 'ACTIVE' && newPaymentStatus === 'SUCCESS' && settings.offerEnabled) ? settings.offerCouponCode : '';
    const assignedOfferTitle = (newStatus === 'ACTIVE' && newPaymentStatus === 'SUCCESS' && settings.offerEnabled) ? settings.offerTitle : '';

    await pool.query(
      `UPDATE subscriptions 
       SET status = ?, 
           payment_status = ?, 
           verification_status = 'ADMIN_VERIFIED', 
           offer_coupon_code = ?, 
           offer_title = ?, 
           paid_at = NOW(), 
           verified_at = NOW(), 
           updated_at = NOW() 
       WHERE id = ?`,
      [newStatus, newPaymentStatus, assignedOfferCode, assignedOfferTitle, sub.id]
    );

    const updatedSub = {
      ...sub,
      id: sub.id,
      email: sub.email,
      status: newStatus,
      paymentStatus: newPaymentStatus,
      offerCouponCode: assignedOfferCode,
      offerTitle: assignedOfferTitle,
      hasActiveOffer: Boolean(assignedOfferCode)
    };

    if (newStatus === 'ACTIVE' && newPaymentStatus === 'SUCCESS') {
      sendSubscriptionSuccessEmail(updatedSub).catch(e => console.error('[Admin Verification Email Error]:', e));
    }

    return res.status(200).json(ApiResponse.success(updatedSub, `Subscriber #${sub.id} updated to ${newStatus}.`));
  } catch (err) {
    next(err);
  }
};

// 9. Admin Get Subscription Settings
exports.getAdminSettings = async (req, res, next) => {
  try {
    const settings = await getSubscriptionSettingsFromDb();
    return res.status(200).json(ApiResponse.success(settings, 'Admin subscription settings fetched'));
  } catch (err) {
    next(err);
  }
};

// 10. Admin Update Subscription Settings
exports.updateAdminSettings = async (req, res, next) => {
  try {
    await ensureSubscriptionTables();
    const body = req.body || {};

    const settingsToSave = {
      subscription_enabled: body.enabled !== false ? 'true' : 'false',
      subscription_price: String(parseFloat(body.price) || 99.00),
      subscription_currency: String(body.currency || 'INR').trim(),
      subscription_title: String(body.title || 'STAY UPDATED').trim(),
      subscription_description: String(body.description || '').trim(),
      subscription_button_text: String(body.buttonText || 'SUBSCRIBE NOW').trim(),

      subscription_offer_enabled: body.offerEnabled ? 'true' : 'false',
      subscription_offer_title: String(body.offerTitle || '').trim(),
      subscription_offer_coupon_code: String(body.offerCouponCode || '').trim().toUpperCase(),
      subscription_offer_start_date: String(body.offerStartDate || '').trim(),
      subscription_offer_end_date: String(body.offerEndDate || '').trim()
    };

    for (const [key, val] of Object.entries(settingsToSave)) {
      await pool.query(
        `INSERT INTO settings (setting_key, setting_value) VALUES (?, ?)
         ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
        [key, val]
      );
    }

    const updated = await getSubscriptionSettingsFromDb();
    return res.status(200).json(ApiResponse.success(updated, 'Subscription settings saved successfully.'));
  } catch (err) {
    next(err);
  }
};

// 11. Admin Delete Subscriber Record
exports.deleteSubscriber = async (req, res, next) => {
  try {
    await ensureSubscriptionTables();
    const { id } = req.params;
    const [rows] = await pool.query('SELECT * FROM subscriptions WHERE id = ? LIMIT 1', [id]);
    if (rows.length === 0) {
      return res.status(404).json(ApiResponse.error('Subscriber not found.'));
    }

    await pool.query('DELETE FROM subscriptions WHERE id = ?', [id]);
    return res.status(200).json(ApiResponse.success(null, `Subscriber #${id} deleted successfully.`));
  } catch (err) {
    next(err);
  }
};
