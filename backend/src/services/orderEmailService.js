const pool = require('../config/db');
const { getTransporters, getEmailLogoHeader } = require('../utils/emailService');

/**
 * Helper to get a setting value from settings table
 */
const getSetting = async (key, defaultValue = 'true') => {
  try {
    const [rows] = await pool.query('SELECT setting_value FROM settings WHERE setting_key = ? LIMIT 1', [key]);
    if (rows && rows.length > 0 && rows[0].setting_value !== undefined && rows[0].setting_value !== null) {
      return String(rows[0].setting_value).trim();
    }
  } catch (e) {}
  return defaultValue;
};

/**
 * Replace template placeholders with real order values
 */
const replaceTemplatePlaceholders = (templateStr, replacements) => {
  if (!templateStr) return '';
  let str = String(templateStr);
  Object.keys(replacements).forEach(key => {
    const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'gi');
    str = str.replace(regex, replacements[key] !== undefined && replacements[key] !== null ? replacements[key] : '');
  });
  return str;
};

/**
 * Core function to trigger an order email notification
 */
const triggerOrderEmailNotification = async ({ orderId, eventType = 'ORDER_PLACED', oldStatus = null, newStatus = null, forceSend = false }) => {
  try {
    if (!orderId) return { success: false, reason: 'Missing orderId' };

    const cleanId = String(orderId).replace(/\D/g, '') || orderId;

    // 1. Fetch Order Details from Database
    const [orders] = await pool.query('SELECT * FROM orders WHERE id = ?', [cleanId]);
    if (orders.length === 0) return { success: false, reason: 'Order not found' };

    const order = orders[0];

    // Fetch order items with product details
    const [items] = await pool.query(
      `SELECT oi.*, p.name as product_name, p.sku as product_sku, p.image_url 
       FROM order_items oi 
       LEFT JOIN products p ON oi.product_id = p.id 
       WHERE oi.order_id = ?`,
      [order.id]
    );

    // Fetch payment record
    let paymentMethod = (order.payment_method || 'COD').toUpperCase();
    let paymentStatus = 'PENDING';
    const [payments] = await pool.query('SELECT * FROM payments WHERE order_id = ? ORDER BY id DESC LIMIT 1', [order.id]);
    if (payments.length > 0) {
      if (payments[0].payment_method) paymentMethod = String(payments[0].payment_method).toUpperCase();
      if (payments[0].payment_status) paymentStatus = String(payments[0].payment_status).toUpperCase();
    }

    // 2. Extract Customer Email & Customer Name
    let customerEmail = (order.email || '').trim();
    let customerName = (order.full_name || '').trim();
    let userId = order.user_id || null;

    if (!customerEmail && userId) {
      const [uRows] = await pool.query('SELECT email, full_name, name FROM users WHERE id = ?', [userId]);
      if (uRows.length > 0) {
        customerEmail = (uRows[0].email || '').trim();
        if (!customerName) customerName = (uRows[0].full_name || uRows[0].name || '').trim();
      }
    }

    if (!customerEmail) {
      console.warn(`[Order Email Warning]: Customer email unavailable — order confirmation email skipped for Order #ORD-${order.id}.`);
      await logEmailRecord({
        orderId: order.id,
        userId,
        customerEmail: 'UNAVAILABLE',
        emailType: eventType,
        statusKey: newStatus || order.status || 'ORDER_PLACED',
        subject: `Order #${order.id} Notification (Skipped)`,
        status: 'SKIPPED',
        failureReason: 'Customer email unavailable — order confirmation email skipped.'
      });
      return { success: false, reason: 'Customer email unavailable' };
    }

    customerName = customerName || 'Valued Customer';

    // 3. Admin Notification Setting Toggles Check
    const globalEnabled = (await getSetting('email_notifications_enabled', 'true')) === 'true';
    if (!globalEnabled && !forceSend) {
      console.log(`[Order Email]: Email notifications globally disabled in admin settings. Skipped for Order #ORD-${order.id}`);
      return { success: false, reason: 'Global email notifications disabled' };
    }

    // Check specific event toggle
    const currentStatusKey = (newStatus || order.status || eventType).toUpperCase();
    let toggleKey = 'enable_status_update_email';
    if (eventType === 'ORDER_PLACED') toggleKey = 'enable_order_placed_email';
    else if (currentStatusKey.includes('DELIVERED')) toggleKey = 'enable_delivered_email';
    else if (currentStatusKey.includes('OUT_FOR_DELIVERY') || currentStatusKey.includes('OUT FOR DELIVERY')) toggleKey = 'enable_out_for_delivery_email';
    else if (currentStatusKey.includes('CANCEL')) toggleKey = 'enable_cancelled_email';
    else if (currentStatusKey.includes('REFUND')) toggleKey = 'enable_refund_email';

    const eventEnabled = (await getSetting(toggleKey, 'true')) === 'true';
    if (!eventEnabled && !forceSend) {
      console.log(`[Order Email]: Event toggle ${toggleKey} disabled in admin settings. Skipped for Order #ORD-${order.id}`);
      return { success: false, reason: `Toggle ${toggleKey} disabled` };
    }

    // 4. Duplicate Email Protection Check
    const statusKeyForLog = currentStatusKey;
    const isDuplicate = await checkDuplicateEmailLog(order.id, eventType, statusKeyForLog);
    if (isDuplicate && !forceSend) {
      console.log(`[Order Email]: Duplicate notification skipped for Order #ORD-${order.id} [${eventType} - ${statusKeyForLog}]`);
      return { success: false, reason: 'Duplicate email already sent' };
    }

    // 5. Payment Status Presentation Rule
    let paymentStatusDisplay = 'Pending';
    if (paymentMethod === 'COD') {
      paymentStatusDisplay = 'Cash on Delivery / Pending Collection';
    } else if (paymentStatus === 'SUCCESS' || paymentStatus === 'PAID' || paymentStatus === 'COMPLETED' || order.status === 'CONFIRMED') {
      paymentStatusDisplay = 'PAID';
    } else {
      paymentStatusDisplay = 'Pending Payment Verification';
    }

    const paymentMethodDisplay = paymentMethod === 'COD' ? 'Cash on Delivery' : paymentMethod.includes('RAZORPAY') ? 'Razorpay / UPI' : paymentMethod;

    // Dates & Formatting
    const orderDateFormatted = order.created_at || order.order_date
      ? new Date(order.created_at || order.order_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
      : new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

    const totalAmount = parseFloat(order.total_amount || 0).toLocaleString('en-IN');
    const discountAmount = parseFloat(order.discount_amount || 0).toLocaleString('en-IN');
    const shippingCost = parseFloat(order.shipping_cost || 0) === 0 ? 'FREE' : `₹${parseFloat(order.shipping_cost || 0).toLocaleString('en-IN')}`;

    // Delivery Address Block
    const fullAddress = [
      order.address,
      order.city,
      order.state,
      order.pincode,
      order.country || 'India'
    ].filter(Boolean).join(', ');

    // 6. Build Ordered Products HTML Table
    const productListHtml = items.map(item => {
      const pName = item.product_name || `Product #${item.product_id}`;
      const pSku = item.product_sku || item.product_sku_str || `KV-PROD-${item.product_id || 'X'}`;
      const pImg = item.image_url || item.product_image || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=200';
      const sizeStr = item.selected_size ? `<span style="display:inline-block; margin-right:8px; background:#f1f5f9; padding:2px 6px; border-radius:4px; font-size:11px;">Size: ${item.selected_size}</span>` : '';
      const colorStr = item.selected_color ? `<span style="display:inline-block; background:#f1f5f9; padding:2px 6px; border-radius:4px; font-size:11px;">Color: ${item.selected_color}</span>` : '';

      return `
        <tr>
          <td style="padding: 12px 8px; border-bottom: 1px solid #f1f5f9; vertical-align: top; width: 64px;">
            <img src="${pImg}" alt="${pName}" style="width: 56px; height: 56px; object-fit: cover; border-radius: 8px; border: 1px solid #e2e8f0;" />
          </td>
          <td style="padding: 12px 8px; border-bottom: 1px solid #f1f5f9; vertical-align: top;">
            <strong style="color: #0f172a; font-size: 13.5px; display: block; margin-bottom: 3px;">${pName}</strong>
            <span style="color: #64748b; font-size: 11px; font-family: monospace; display: block; margin-bottom: 4px;">SKU: ${pSku}</span>
            <div>${sizeStr}${colorStr}</div>
          </td>
          <td align="center" style="padding: 12px 8px; border-bottom: 1px solid #f1f5f9; vertical-align: top; font-size: 13px; color: #475569; font-weight: 600;">
            x${item.quantity}
          </td>
          <td align="right" style="padding: 12px 8px; border-bottom: 1px solid #f1f5f9; vertical-align: top; font-size: 13.5px; color: #0f172a; font-weight: 700;">
            ₹${parseFloat(item.price_at_time || 0).toLocaleString('en-IN')}
          </td>
        </tr>
      `;
    }).join('');

    // 7. Load Template from DB or Fallback
    const tplKey = getTemplateKeyForEvent(eventType, currentStatusKey);
    let template = await getTemplateFromDb(tplKey);

    const replacements = {
      customer_name: customerName,
      order_id: `ORD-${order.id}`,
      order_date: orderDateFormatted,
      payment_method: paymentMethodDisplay,
      payment_status: paymentStatusDisplay,
      order_total: `₹${totalAmount}`,
      subtotal: `₹${totalAmount}`,
      discount_amount: `₹${discountAmount}`,
      shipping_cost: shippingCost,
      coupon_code: order.coupon_code || 'N/A',
      product_list_html: productListHtml,
      delivery_address: fullAddress,
      customer_phone: order.phone || 'N/A',
      current_location: order.current_location || 'Hub Processing Facility',
      courier_partner: order.courier_partner || 'Courier Partner',
      tracking_number: order.tracking_number || `TRK-${order.id}`,
      estimated_delivery: order.estimated_delivery || '3-5 Business Days',
      status_message: order.status_message || '',
      delivery_status: (order.tracking_status || order.status || 'Order Placed').toUpperCase(),
      track_order_url: `${process.env.FRONTEND_URL || 'https://karviyam.com'}/profile`,
      shop_url: `${process.env.FRONTEND_URL || 'https://karviyam.com'}/shop`
    };

    const emailSubject = replaceTemplatePlaceholders(template.subject, replacements);
    const emailHeading = replaceTemplatePlaceholders(template.heading, replacements);
    const emailBodyCustom = replaceTemplatePlaceholders(template.body_html, replacements);
    const buttonText = template.button_text || 'TRACK MY ORDER';
    const buttonUrl = template.button_url || `${process.env.FRONTEND_URL || 'https://karviyam.com'}/profile`;

    // 8. Generate Complete HTML Email
    const { logoHeaderHtml, attachments } = await getEmailLogoHeader();
    const VERIFIED_FROM_EMAIL = 'vanakkam@karviyam.com';
    const supportEmail = 'vanakkam@karviyam.com';

    const fullHtml = generateFullOrderEmailHtml({
      logoHeaderHtml,
      heading: emailHeading,
      customerName,
      orderId: order.id,
      orderDate: orderDateFormatted,
      paymentMethod: paymentMethodDisplay,
      paymentStatus: paymentStatusDisplay,
      productListHtml,
      totalAmount,
      discountAmount,
      shippingCost,
      customerPhone: order.phone,
      fullAddress,
      currentLocation: order.current_location,
      courierPartner: order.courier_partner,
      trackingNumber: order.tracking_number,
      estimatedDelivery: order.estimated_delivery,
      statusMessage: order.status_message,
      bodyHtml: emailBodyCustom,
      buttonText,
      buttonUrl,
      supportEmail
    });

    // 9. Dispatch Email via Nodemailer Transporter Cascade
    const mailOptions = {
      from: `"Karviyam" <${VERIFIED_FROM_EMAIL}>`,
      to: customerEmail,
      replyTo: VERIFIED_FROM_EMAIL,
      envelope: {
        from: VERIFIED_FROM_EMAIL,
        to: customerEmail
      },
      subject: emailSubject,
      html: fullHtml,
      attachments
    };

    const transporters = await getTransporters();
    let sentSuccess = false;
    let lastErr = null;

    for (const transporter of transporters) {
      try {
        await transporter.sendMail(mailOptions);
        sentSuccess = true;
        break;
      } catch (err) {
        lastErr = err;
        console.warn(`[Order Email Retry Warning]: ${err.message}`);
      }
    }

    if (sentSuccess) {
      console.log(`[Order Email SUCCESS]: Sent ${emailSubject} to ${customerEmail} for Order #ORD-${order.id}`);
      await logEmailRecord({
        orderId: order.id,
        userId,
        customerEmail,
        emailType: eventType,
        statusKey: statusKeyForLog,
        subject: emailSubject,
        status: 'SENT',
        failureReason: null
      });
      return { success: true, email: customerEmail };
    } else {
      const errMsg = lastErr?.message || 'Failed to send email via SMTP transporters';
      console.error(`[Order Email FAILURE]: Failed to send to ${customerEmail} for Order #ORD-${order.id}: ${errMsg}`);
      await logEmailRecord({
        orderId: order.id,
        userId,
        customerEmail,
        emailType: eventType,
        statusKey: statusKeyForLog,
        subject: emailSubject,
        status: 'FAILED',
        failureReason: errMsg
      });
      return { success: false, reason: errMsg };
    }
  } catch (err) {
    console.error('[triggerOrderEmailNotification Exception]:', err);
    return { success: false, reason: err.message };
  }
};

/**
 * Check if a duplicate email log exists for (orderId, emailType, statusKey)
 */
const checkDuplicateEmailLog = async (orderId, emailType, statusKey) => {
  try {
    const [rows] = await pool.query(
      `SELECT id FROM email_logs 
       WHERE order_id = ? AND email_type = ? AND (status_key = ? OR status_key IS NULL) AND status = 'SENT'
       LIMIT 1`,
      [orderId, emailType, statusKey]
    );
    return rows && rows.length > 0;
  } catch (e) {}
  return false;
};

/**
 * Log record in email_logs table
 */
const logEmailRecord = async ({ orderId, userId, customerEmail, emailType, statusKey, subject, status, failureReason }) => {
  try {
    await pool.query(
      `INSERT INTO email_logs (order_id, user_id, from_email, customer_email, email_type, status_key, subject, status, failure_reason, sent_at)
       VALUES (?, ?, 'vanakkam@karviyam.com', ?, ?, ?, ?, ?, ?, NOW())`,
      [orderId || null, userId || null, customerEmail || 'UNAVAILABLE', emailType, statusKey || null, subject || '', status, failureReason || null]
    );
  } catch (e) {
    console.error('[logEmailRecord Error]:', e.message);
  }
};

/**
 * Map event & status to template key
 */
const getTemplateKeyForEvent = (eventType, statusKey) => {
  const sk = String(statusKey || '').toUpperCase();
  if (eventType === 'ORDER_PLACED') return 'ORDER_PLACED';
  if (sk.includes('DELIVERED')) return 'DELIVERED';
  if (sk.includes('OUT_FOR_DELIVERY') || sk.includes('OUT FOR DELIVERY')) return 'OUT_FOR_DELIVERY';
  if (sk.includes('SHIPPED')) return 'SHIPPED';
  if (sk.includes('PACKED')) return 'PACKED';
  if (sk.includes('PROCESSING')) return 'PROCESSING';
  if (sk.includes('CANCEL')) return 'CANCELLED';
  if (sk.includes('REFUND')) return 'REFUNDED';
  return 'ORDER_PLACED';
};

/**
 * Fetch template from email_templates table or return safe default fallback
 */
const getTemplateFromDb = async (templateKey) => {
  try {
    const [rows] = await pool.query('SELECT * FROM email_templates WHERE template_key = ? AND is_enabled = 1 LIMIT 1', [templateKey]);
    if (rows && rows.length > 0) {
      return rows[0];
    }
  } catch (e) {}

  // Fallbacks
  const fallbacks = {
    ORDER_PLACED: {
      subject: 'Karviyam — Your Order #{{order_id}} Has Been Placed',
      heading: 'Order Placed Successfully',
      body_html: '<p>Hello <strong>{{customer_name}}</strong>,</p><p>Thank you for shopping with Karviyam. Your order has been successfully placed.</p>',
      button_text: 'TRACK MY ORDER',
      button_url: 'https://karviyam.com/profile'
    },
    OUT_FOR_DELIVERY: {
      subject: 'Karviyam — Your Order #{{order_id}} Is Out for Delivery',
      heading: '🚚 YOUR ORDER IS OUT FOR DELIVERY',
      body_html: '<p>Hello <strong>{{customer_name}}</strong>,</p><p>Your Karviyam order is now out for delivery to your shipping address.</p>',
      button_text: 'TRACK MY ORDER',
      button_url: 'https://karviyam.com/profile'
    },
    DELIVERED: {
      subject: 'Karviyam — Order #{{order_id}} Delivered Successfully',
      heading: '✓ Order Delivered Successfully',
      body_html: '<p>Hello <strong>{{customer_name}}</strong>,</p><p>Your Karviyam order #{{order_id}} has been delivered successfully.</p>',
      button_text: 'CONTINUE SHOPPING',
      button_url: 'https://karviyam.com/shop'
    }
  };

  return fallbacks[templateKey] || fallbacks.ORDER_PLACED;
};

/**
 * Generate complete Karviyam-branded HTML email string
 */
const generateFullOrderEmailHtml = ({
  logoHeaderHtml,
  heading,
  customerName,
  orderId,
  orderDate,
  paymentMethod,
  paymentStatus,
  productListHtml,
  totalAmount,
  discountAmount,
  shippingCost,
  customerPhone,
  fullAddress,
  currentLocation,
  courierPartner,
  trackingNumber,
  estimatedDelivery,
  statusMessage,
  bodyHtml,
  buttonText,
  buttonUrl,
  supportEmail
}) => {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${heading}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 24px 12px;">
    <tr>
      <td align="center">
        
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05);">
          
          <!-- 1. Header Logo -->
          <tr>
            <td align="center" style="padding: 18px 20px 8px 20px; border-bottom: 1px solid #f1f5f9; background-color: #ffffff;">
              ${logoHeaderHtml || '<h1 style="color:#B71C1C; margin:0; font-family:Georgia,serif; letter-spacing:3px;">KARVIYAM</h1>'}
            </td>
          </tr>

          <!-- 2. Main Content Banner -->
          <tr>
            <td style="padding: 16px 28px 32px 28px; color: #1e293b;">
              
              <div style="text-align: center; margin-bottom: 20px;">
                <span style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; color: #B71C1C; background-color: #fef2f2; border: 1px solid #fecaca; padding: 4px 12px; border-radius: 99px; display: inline-block;">
                  ✓ ORDER UPDATE
                </span>
                <h2 style="font-size: 24px; font-weight: 900; color: #0f172a; margin: 12px 0 4px 0; letter-spacing: -0.5px;">
                  ${heading}
                </h2>
                <p style="font-size: 13px; color: #64748b; margin: 0;">
                  Order ID: <strong style="color: #0f172a; font-family: monospace;">#ORD-${orderId}</strong>
                </p>
              </div>

              <!-- Custom Body Paragraphs -->
              <div style="font-size: 14px; color: #334155; line-height: 1.6; margin-bottom: 24px;">
                ${bodyHtml}
              </div>

              ${currentLocation ? `
              <!-- Delivery Location Banner -->
              <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 12px; padding: 14px 18px; margin-bottom: 24px;">
                <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #1e40af; display: block; margin-bottom: 4px;">🚚 Delivery Location Update</span>
                <strong style="font-size: 14px; color: #1e3a8a;">Current Location: ${currentLocation}</strong>
                ${courierPartner ? `<span style="font-size: 12px; color: #3b82f6; display: block; margin-top: 2px;">Courier: ${courierPartner} ${trackingNumber ? `(#${trackingNumber})` : ''}</span>` : ''}
              </div>
              ` : ''}

              <!-- 3. Order & Payment Summary Table -->
              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 18px; margin-bottom: 24px;">
                <h4 style="margin: 0 0 12px 0; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; color: #475569;">
                  ORDER INFORMATION
                </h4>
                <table width="100%" border="0" cellspacing="0" cellpadding="4" style="font-size: 13px; color: #334155;">
                  <tr>
                    <td style="color: #64748b;">Order Date:</td>
                    <td align="right"><strong>${orderDate}</strong></td>
                  </tr>
                  <tr>
                    <td style="color: #64748b;">Payment Method:</td>
                    <td align="right"><strong>${paymentMethod}</strong></td>
                  </tr>
                  <tr>
                    <td style="color: #64748b;">Payment Status:</td>
                    <td align="right"><strong style="color: ${paymentStatus === 'PAID' ? '#15803d' : '#b45309'};">${paymentStatus}</strong></td>
                  </tr>
                  ${estimatedDelivery ? `
                  <tr>
                    <td style="color: #64748b;">Estimated Delivery:</td>
                    <td align="right"><strong style="color: #0f172a;">${estimatedDelivery}</strong></td>
                  </tr>
                  ` : ''}
                </table>
              </div>

              <!-- 4. Ordered Products Table -->
              <div style="margin-bottom: 24px;">
                <h4 style="margin: 0 0 12px 0; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; color: #475569;">
                  ORDERED PRODUCTS
                </h4>
                <table width="100%" border="0" cellspacing="0" cellpadding="0" style="border-collapse: collapse;">
                  ${productListHtml}
                </table>
              </div>

              <!-- 5. Price Breakdown -->
              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 16px; margin-bottom: 24px;">
                <table width="100%" border="0" cellspacing="0" cellpadding="4" style="font-size: 13px; color: #475569;">
                  <tr>
                    <td>Subtotal</td>
                    <td align="right" style="color: #0f172a; font-weight: 600;">₹${totalAmount}</td>
                  </tr>
                  ${parseFloat(discountAmount || 0) > 0 ? `
                  <tr>
                    <td>Discount</td>
                    <td align="right" style="color: #15803d; font-weight: 600;">-₹${discountAmount}</td>
                  </tr>
                  ` : ''}
                  <tr>
                    <td>Delivery Charge</td>
                    <td align="right" style="color: #0f172a; font-weight: 600;">${shippingCost}</td>
                  </tr>
                  <tr>
                    <td colspan="2"><hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 6px 0;" /></td>
                  </tr>
                  <tr style="font-size: 15px; font-weight: 800; color: #0f172a;">
                    <td>Total Amount</td>
                    <td align="right" style="color: #B71C1C;">₹${totalAmount}</td>
                  </tr>
                </table>
              </div>

              <!-- 6. Delivery Address -->
              <div style="border: 1px solid #e2e8f0; border-radius: 14px; padding: 16px; margin-bottom: 28px; background-color: #ffffff;">
                <h4 style="margin: 0 0 8px 0; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; color: #475569;">
                  DELIVERY ADDRESS
                </h4>
                <strong style="font-size: 14px; color: #0f172a; display: block; margin-bottom: 2px;">${customerName}</strong>
                <p style="font-size: 13px; color: #475569; margin: 0 0 4px 0; line-height: 1.4;">${fullAddress}</p>
                ${customerPhone ? `<p style="font-size: 12px; color: #64748b; margin: 0;">Phone: ${customerPhone}</p>` : ''}
              </div>

              <!-- 7. Action Button -->
              <div style="text-align: center; margin-top: 24px;">
                <a href="${buttonUrl}" style="background-color: #B71C1C; color: #ffffff; text-decoration: none; font-weight: 800; font-size: 13px; padding: 14px 32px; border-radius: 12px; display: inline-block; letter-spacing: 1px; text-transform: uppercase; box-shadow: 0 4px 12px rgba(183,28,28,0.25);">
                  ${buttonText} →
                </a>
              </div>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px; background-color: #f1f5f9; text-align: center; font-size: 12px; color: #64748b;">
              <p style="margin: 0 0 6px 0;">Need help with your order? Contact us at <a href="mailto:${supportEmail}" style="color:#B71C1C; text-decoration:none; font-weight:bold;">${supportEmail}</a></p>
              <p style="margin: 0;">© ${new Date().getFullYear()} Karviyam. All rights reserved.</p>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>
  `;
};

module.exports = {
  triggerOrderEmailNotification,
  checkDuplicateEmailLog,
  logEmailRecord,
  getTemplateFromDb,
  replaceTemplatePlaceholders,
  generateFullOrderEmailHtml
};
