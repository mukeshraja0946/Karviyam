const crypto = require('crypto');
const pool = require('../config/db');
const razorpayConfig = require('../config/razorpay');
const ApiResponse = require('../utils/apiResponse');
const { sendSubscriptionSuccessEmail } = require('../utils/emailService');
const { logPaymentError } = require('../utils/paymentLogger');

// Helper: Get Receiving Bank/UPI Account details from DB
const getAdminBankAccountFromDb = async () => {
  try {
    const [rows] = await pool.query('SELECT * FROM bank_account_settings ORDER BY id DESC LIMIT 1');
    if (rows.length > 0 && rows[0].upi_id) {
      return {
        upiId: rows[0].upi_id,
        accountHolder: rows[0].account_holder_name || 'KARVIYAM RETAILS PRIVATE LIMITED',
        bankName: rows[0].bank_name || 'HDFC Bank'
      };
    }
  } catch (e) {}

  return {
    upiId: 'karviyam@hdfcbank',
    accountHolder: 'KARVIYAM RETAILS PRIVATE LIMITED',
    bankName: 'HDFC Bank'
  };
};

// Helper: Get Subscription Welcome Offer if active
const getSubscriptionActiveOffer = async () => {
  let offerEnabled = false;
  let offerTitle = '';
  let offerCouponCode = '';
  let offerStartDate = '';
  let offerEndDate = '';

  try {
    const [rows] = await pool.query(
      "SELECT setting_key, setting_value FROM settings WHERE setting_key LIKE 'subscription_offer_%'"
    );
    rows.forEach(r => {
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
    offerCouponCode: isOfferActive ? offerCouponCode.trim().toUpperCase() : '',
    offerTitle: isOfferActive ? offerTitle.trim() : ''
  };
};

// --------------------------------------------------
// 1. CREATE GENUINE UPI PAYMENT REQUEST
// --------------------------------------------------
exports.createUpiPaymentRequest = async (req, res, next) => {
  try {
    const { type, id, orderId, subscriptionId, upiId } = req.body;
    const targetType = (type || (subscriptionId ? 'SUBSCRIPTION' : 'ORDER')).toUpperCase();
    const targetId = id || orderId || subscriptionId;

    if (!targetId) {
      return res.status(400).json(ApiResponse.error('Order ID or Subscription ID is required.'));
    }

    const cleanUpi = upiId ? String(upiId).trim() : '';
    if (!cleanUpi || !/^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/.test(cleanUpi)) {
      return res.status(400).json(ApiResponse.error('Invalid VPA / UPI ID format. Example: customer@upi or mobile@ybl'));
    }

    const bank = await getAdminBankAccountFromDb();
    let expectedAmount = 0;
    let dbOrderId = null;
    let dbSubId = null;
    let noteText = '';

    if (targetType === 'ORDER') {
      let orderIdNum = targetId;
      if (typeof targetId === 'string') {
        const match = targetId.match(/\d+/);
        if (match) orderIdNum = parseInt(match[0]);
      }
      const [orders] = await pool.query('SELECT * FROM orders WHERE id = ? OR id = ? LIMIT 1', [targetId, orderIdNum]);
      if (orders.length === 0) {
        return res.status(404).json(ApiResponse.error('Order record not found.'));
      }
      const order = orders[0];
      dbOrderId = order.id;
      expectedAmount = parseFloat(order.total_amount || 0);
      if (expectedAmount <= 0) {
        const [items] = await pool.query('SELECT price_at_time, quantity FROM order_items WHERE order_id = ?', [order.id]);
        if (items.length > 0) {
          const itemSum = items.reduce((acc, it) => acc + (parseFloat(it.price_at_time || 0) * (parseInt(it.quantity) || 1)), 0);
          const shipCost = parseFloat(order.shipping_cost || 0);
          const disc = parseFloat(order.discount_amount || 0);
          expectedAmount = Math.max(0, itemSum + shipCost - disc);
        }
      }
      noteText = `KARVIYAM Order #${order.id}`;
    } else if (targetType === 'SUBSCRIPTION') {
      const [subs] = await pool.query('SELECT * FROM subscriptions WHERE id = ? LIMIT 1', [targetId]);
      if (subs.length === 0) {
        return res.status(404).json(ApiResponse.error('Subscription record not found.'));
      }
      const sub = subs[0];
      dbSubId = sub.id;
      expectedAmount = parseFloat(sub.amount || 99.00);
      noteText = `KARVIYAM VIP Sub #${sub.id}`;
    } else {
      return res.status(400).json(ApiResponse.error('Invalid payment target type.'));
    }

    if (expectedAmount <= 0) {
      return res.status(400).json(ApiResponse.error('Invalid payment amount. Total order amount must be greater than ₹0.00.'));
    }

    const amountInPaise = Math.round(expectedAmount * 100);
    const txnRef = `TXN-${targetType}-${targetId}-${Date.now()}`;
    let razorpayOrderId = null;

    // Create Razorpay Order if SDK instance is initialized
    if (razorpayConfig.instance) {
      try {
        const rzpOrder = await razorpayConfig.instance.orders.create({
          amount: amountInPaise,
          currency: 'INR',
          receipt: `rcpt_${targetType.toLowerCase()}_${targetId}_${Date.now()}`,
          notes: {
            targetType,
            targetId: String(targetId),
            customerUpi: cleanUpi
          }
        });
        if (rzpOrder && rzpOrder.id) {
          razorpayOrderId = rzpOrder.id;
        }
      } catch (eRzp) {
        const rzpErrObj = eRzp?.error || eRzp || {};
        logPaymentError({
          provider: 'Razorpay',
          orderId: dbOrderId,
          subscriptionId: dbSubId,
          transactionReference: txnRef,
          amount: expectedAmount,
          amountInPaise,
          vpa: cleanUpi,
          httpStatus: eRzp?.statusCode || eRzp?.status || 400,
          errorCode: rzpErrObj.code || eRzp?.code || 'RAZORPAY_ORDER_CREATE_ERROR',
          errorDescription: rzpErrObj.description || eRzp?.message || 'Razorpay order creation API failed',
          errorSource: rzpErrObj.source || null,
          errorReason: rzpErrObj.reason || null,
          rawError: eRzp
        });
      }
    }

    let paymentId;
    let existingPmt = [];
    if (dbOrderId) {
      [existingPmt] = await pool.query('SELECT id FROM payments WHERE order_id = ? LIMIT 1', [dbOrderId]);
    } else if (dbSubId) {
      [existingPmt] = await pool.query('SELECT id FROM payments WHERE subscription_id = ? LIMIT 1', [dbSubId]);
    }

    if (existingPmt.length > 0) {
      paymentId = existingPmt[0].id;
      await pool.query(
        `UPDATE payments 
         SET transaction_id = ?, razorpay_order_id = ?, payment_method = 'UPI', upi_vpa = ?, amount = ?, amount_received = 0.00, payment_status = 'PENDING', updated_at = NOW() 
         WHERE id = ?`,
        [txnRef, razorpayOrderId, cleanUpi, expectedAmount, paymentId]
      );
    } else {
      const [pmtResult] = await pool.query(
        `INSERT INTO payments (order_id, subscription_id, transaction_id, razorpay_order_id, payment_method, upi_vpa, amount, amount_received, payment_status, created_at)
         VALUES (?, ?, ?, ?, 'UPI', ?, ?, 0.00, 'PENDING', NOW())`,
        [dbOrderId, dbSubId, txnRef, razorpayOrderId, cleanUpi, expectedAmount]
      );
      paymentId = pmtResult.insertId;
    }

    // Update parent record to PENDING status
    if (dbOrderId) {
      await pool.query(
        "UPDATE orders SET payment_status = 'PENDING', status = 'Payment Pending', updated_at = NOW() WHERE id = ?",
        [dbOrderId]
      );
    }
    if (dbSubId) {
      await pool.query(
        `UPDATE subscriptions 
         SET payment_status = 'PENDING', status = 'PENDING', upi_vpa = ?, transaction_reference = ?, updated_at = NOW() 
         WHERE id = ?`,
        [cleanUpi, txnRef, dbSubId]
      );
    }

    const upiUri = `upi://pay?pa=${encodeURIComponent(bank.upiId)}&pn=${encodeURIComponent(bank.accountHolder)}&am=${expectedAmount.toFixed(2)}&cu=INR&tn=${encodeURIComponent(noteText + ' Ref:' + txnRef)}&tr=${txnRef}`;

    return res.status(200).json(ApiResponse.success({
      paymentId,
      transactionReference: txnRef,
      razorpayOrderId,
      targetType,
      targetId: targetId,
      upiId: cleanUpi,
      amount: expectedAmount,
      currency: 'INR',
      status: 'PENDING',
      receivingUpiId: bank.upiId,
      receivingAccountHolder: bank.accountHolder,
      upiUri,
      message: 'UPI payment request created. Please approve in your UPI app.'
    }, 'UPI payment request initiated successfully'));
  } catch (err) {
    logPaymentError({
      provider: 'Razorpay',
      httpStatus: 500,
      errorCode: 'UNHANDLED_BACKEND_PAYMENT_EXCEPTION',
      errorDescription: err.message || 'Internal payment processing exception',
      rawError: { stack: err.stack, message: err.message }
    });
    next(err);
  }
};

// --------------------------------------------------
// 2. GET PAYMENT STATUS & SERVER VERIFICATION
// --------------------------------------------------
exports.getPaymentStatus = async (req, res, next) => {
  try {
    const paymentIdParam = req.params.paymentId || req.query.paymentId || req.query.id;
    const orderIdParam = req.query.orderId;
    const subscriptionIdParam = req.query.subscriptionId;

    let whereClause = '';
    let whereVal = null;

    if (paymentIdParam) {
      if (!isNaN(paymentIdParam)) {
        whereClause = 'WHERE p.id = ? OR p.transaction_id = ? OR p.razorpay_order_id = ?';
        whereVal = [paymentIdParam, paymentIdParam, paymentIdParam];
      } else {
        whereClause = 'WHERE p.transaction_id = ? OR p.razorpay_order_id = ?';
        whereVal = [paymentIdParam, paymentIdParam];
      }
    } else if (orderIdParam) {
      whereClause = 'WHERE p.order_id = ?';
      whereVal = [orderIdParam];
    } else if (subscriptionIdParam) {
      whereClause = 'WHERE p.subscription_id = ?';
      whereVal = [subscriptionIdParam];
    } else {
      return res.status(400).json(ApiResponse.error('Payment ID, Order ID, or Subscription ID is required.'));
    }

    const sql = `SELECT p.* FROM payments p ${whereClause} ORDER BY p.id DESC LIMIT 1`;
    const [rows] = await pool.query(sql, Array.isArray(whereVal) ? whereVal : [whereVal]);

    if (rows.length === 0) {
      return res.status(404).json(ApiResponse.error('Payment record not found.'));
    }

    const pmt = rows[0];
    let isSuccess = pmt.payment_status === 'SUCCESS' || pmt.payment_status === 'Completed';

    // If status is PENDING, check Razorpay API directly if razorpay_order_id exists
    if (!isSuccess && pmt.razorpay_order_id && razorpayConfig.instance) {
      try {
        const rzpPayments = await razorpayConfig.instance.orders.fetchPayments(pmt.razorpay_order_id);
        if (rzpPayments && Array.isArray(rzpPayments.items) && rzpPayments.items.length > 0) {
          const captured = rzpPayments.items.find(item => item.status === 'captured');
          if (captured) {
            const receivedAmount = parseFloat(captured.amount || 0) / 100;
            const expectedAmount = parseFloat(pmt.amount || 0);

            // Server-side amount verification
            if (receivedAmount >= expectedAmount) {
              isSuccess = true;
              await pool.query(
                `UPDATE payments 
                 SET payment_status = 'SUCCESS', razorpay_payment_id = ?, amount_received = ?, updated_at = NOW() 
                 WHERE id = ?`,
                [captured.id, receivedAmount, pmt.id]
              );

              // Update Order or Subscription
              if (pmt.order_id) {
                await pool.query(
                  "UPDATE orders SET status = 'Processing', payment_status = 'Paid', updated_at = NOW() WHERE id = ?",
                  [pmt.order_id]
                );
              }
              if (pmt.subscription_id) {
                const offer = await getSubscriptionActiveOffer();
                await pool.query(
                  `UPDATE subscriptions 
                   SET status = 'ACTIVE', payment_status = 'SUCCESS', verification_status = 'VERIFIED_SUCCESS', 
                       offer_coupon_code = ?, offer_title = ?, paid_at = NOW(), verified_at = NOW(), updated_at = NOW() 
                   WHERE id = ?`,
                  [offer.offerCouponCode, offer.offerTitle, pmt.subscription_id]
                );

                // Fetch subscription row & send email
                const [sRows] = await pool.query('SELECT * FROM subscriptions WHERE id = ?', [pmt.subscription_id]);
                if (sRows.length > 0) {
                  sendSubscriptionSuccessEmail(sRows[0]).catch(e => console.error(e));
                }
              }
            }
          }
        }
      } catch (eRzpCheck) {
        console.warn('[Razorpay Live Check Exception]:', eRzpCheck.message);
      }
    }

    const currentStatus = isSuccess ? 'SUCCESS' : (pmt.payment_status || 'PENDING');

    return res.status(200).json(ApiResponse.success({
      paymentId: pmt.id,
      transactionReference: pmt.transaction_id,
      razorpayOrderId: pmt.razorpay_order_id,
      razorpayPaymentId: pmt.razorpay_payment_id,
      orderId: pmt.order_id,
      subscriptionId: pmt.subscription_id,
      amount: parseFloat(pmt.amount || 0),
      amountReceived: parseFloat(pmt.amount_received || 0),
      upiVpa: pmt.upi_vpa || '',
      status: currentStatus,
      paymentStatus: currentStatus,
      createdAt: pmt.created_at,
      updatedAt: pmt.updated_at
    }, 'Payment status retrieved successfully'));
  } catch (err) {
    next(err);
  }
};

// --------------------------------------------------
// 3. SERVER WEBHOOK LISTENER (Razorpay Webhook)
// --------------------------------------------------
exports.handlePaymentWebhook = async (req, res, next) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || razorpayConfig.keySecret;

    if (webhookSecret && signature) {
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(JSON.stringify(req.body))
        .digest('hex');

      if (expectedSignature !== signature) {
        return res.status(400).json({ status: 'error', message: 'Webhook signature mismatch' });
      }
    }

    const event = req.body?.event;
    const payload = req.body?.payload?.payment?.entity;

    if (event === 'payment.captured' && payload) {
      const rzpOrderId = payload.order_id;
      const rzpPaymentId = payload.id;
      const receivedAmount = parseFloat(payload.amount || 0) / 100;

      const [rows] = await pool.query('SELECT * FROM payments WHERE razorpay_order_id = ? OR transaction_id = ? LIMIT 1', [rzpOrderId, rzpOrderId]);
      if (rows.length > 0) {
        const pmt = rows[0];
        const expectedAmount = parseFloat(pmt.amount || 0);

        // Strict Amount Check
        if (receivedAmount >= expectedAmount && pmt.payment_status !== 'SUCCESS') {
          await pool.query(
            `UPDATE payments 
             SET payment_status = 'SUCCESS', razorpay_payment_id = ?, amount_received = ?, updated_at = NOW() 
             WHERE id = ?`,
            [rzpPaymentId, receivedAmount, pmt.id]
          );

          if (pmt.order_id) {
            await pool.query(
              "UPDATE orders SET status = 'Processing', payment_status = 'Paid', updated_at = NOW() WHERE id = ?",
              [pmt.order_id]
            );
          }

          if (pmt.subscription_id) {
            const offer = await getSubscriptionActiveOffer();
            await pool.query(
              `UPDATE subscriptions 
               SET status = 'ACTIVE', payment_status = 'SUCCESS', verification_status = 'VERIFIED_SUCCESS', 
                   offer_coupon_code = ?, offer_title = ?, paid_at = NOW(), verified_at = NOW(), updated_at = NOW() 
               WHERE id = ?`,
              [offer.offerCouponCode, offer.offerTitle, pmt.subscription_id]
            );

            const [sRows] = await pool.query('SELECT * FROM subscriptions WHERE id = ?', [pmt.subscription_id]);
            if (sRows.length > 0) {
              sendSubscriptionSuccessEmail(sRows[0]).catch(e => console.error(e));
            }
          }
        }
      }
    }

    return res.status(200).json({ status: 'ok', received: true });
  } catch (err) {
    next(err);
  }
};

// --------------------------------------------------
// 4. SERVER-SIDE SANDBOX / TEST VERIFICATION
// --------------------------------------------------
exports.verifyPaymentSandbox = async (req, res, next) => {
  try {
    const { paymentId, transactionReference, orderId, subscriptionId, status = 'SUCCESS' } = req.body;

    let whereClause = '';
    let whereVal = null;

    if (paymentId) {
      whereClause = 'WHERE id = ?';
      whereVal = [paymentId];
    } else if (transactionReference) {
      whereClause = 'WHERE transaction_id = ? OR razorpay_order_id = ?';
      whereVal = [transactionReference, transactionReference];
    } else if (orderId) {
      whereClause = 'WHERE order_id = ?';
      whereVal = [orderId];
    } else if (subscriptionId) {
      whereClause = 'WHERE subscription_id = ?';
      whereVal = [subscriptionId];
    } else {
      return res.status(400).json(ApiResponse.error('Payment ID or transaction reference is required.'));
    }

    const [rows] = await pool.query(`SELECT * FROM payments ${whereClause} ORDER BY id DESC LIMIT 1`, whereVal);
    if (rows.length === 0) {
      return res.status(404).json(ApiResponse.error('Payment record not found.'));
    }

    const pmt = rows[0];
    const expectedAmount = parseFloat(pmt.amount || 0);

    if (String(status).toUpperCase() === 'SUCCESS') {
      await pool.query(
        `UPDATE payments SET payment_status = 'SUCCESS', amount_received = ?, updated_at = NOW() WHERE id = ?`,
        [expectedAmount, pmt.id]
      );

      if (pmt.order_id) {
        await pool.query(
          "UPDATE orders SET status = 'Processing', payment_status = 'Paid', updated_at = NOW() WHERE id = ?",
          [pmt.order_id]
        );
      }

      if (pmt.subscription_id) {
        const offer = await getSubscriptionActiveOffer();
        await pool.query(
          `UPDATE subscriptions 
           SET status = 'ACTIVE', payment_status = 'SUCCESS', verification_status = 'VERIFIED_SUCCESS', 
               offer_coupon_code = ?, offer_title = ?, paid_at = NOW(), verified_at = NOW(), updated_at = NOW() 
           WHERE id = ?`,
          [offer.offerCouponCode, offer.offerTitle, pmt.subscription_id]
        );

        const [sRows] = await pool.query('SELECT * FROM subscriptions WHERE id = ?', [pmt.subscription_id]);
        if (sRows.length > 0) {
          sendSubscriptionSuccessEmail(sRows[0]).catch(e => console.error(e));
        }
      }

      return res.status(200).json(ApiResponse.success({
        paymentId: pmt.id,
        status: 'SUCCESS',
        amountVerified: expectedAmount
      }, 'Payment verified and status updated to SUCCESS.'));
    } else {
      await pool.query(
        `UPDATE payments SET payment_status = 'FAILED', updated_at = NOW() WHERE id = ?`,
        [pmt.id]
      );
      return res.status(200).json(ApiResponse.success({
        paymentId: pmt.id,
        status: 'FAILED'
      }, 'Payment marked as FAILED.'));
    }
  } catch (err) {
    next(err);
  }
};

// Legacy support routes
exports.createRazorpayOrder = async (req, res, next) => {
  return exports.createUpiPaymentRequest(req, res, next);
};

exports.verifyRazorpayPayment = async (req, res, next) => {
  return exports.getPaymentStatus(req, res, next);
};

exports.createStripeIntent = async (req, res, next) => {
  return exports.createUpiPaymentRequest(req, res, next);
};
