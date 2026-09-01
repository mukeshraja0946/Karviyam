const pool = require('../config/db');
const ApiResponse = require('../utils/apiResponse');
const { generateInvoiceHtml } = require('../services/invoiceService');

const mapOrderRowToDTO = async (order) => {
  if (!order) return null;

  const [items] = await pool.query(
    `SELECT oi.*, p.name as product_name, p.image_url 
     FROM order_items oi 
     LEFT JOIN products p ON oi.product_id = p.id 
     WHERE oi.order_id = ?`,
    [order.id]
  );

  const formattedItems = items.map(item => ({
    id: item.id,
    orderId: item.order_id,
    productId: item.product_id,
    productName: item.product_name || `Product #${item.product_id}`,
    imageUrl: item.image_url || null,
    quantity: item.quantity,
    priceAtTime: parseFloat(item.price_at_time || 0),
    selectedSize: item.selected_size || null,
    selectedColor: item.selected_color || null,
    subtotal: parseFloat(item.price_at_time || 0) * item.quantity
  }));

  let paymentMethod = 'COD';
  let paymentStatus = 'PENDING';
  let transactionId = null;

  const [payments] = await pool.query('SELECT * FROM payments WHERE order_id = ? ORDER BY id DESC LIMIT 1', [order.id]);
  if (payments.length > 0) {
    paymentMethod = payments[0].payment_method || 'COD';
    paymentStatus = payments[0].payment_status || 'PENDING';
    transactionId = payments[0].transaction_id || null;
  }

  return {
    id: order.id,
    userId: order.user_id,
    totalAmount: parseFloat(order.total_amount || 0),
    discountAmount: parseFloat(order.discount_amount || 0),
    shippingCost: parseFloat(order.shipping_cost || 0),
    status: order.status || 'PAYMENT_PENDING',
    fullName: order.full_name,
    email: order.email,
    phone: order.phone,
    address: order.address,
    city: order.city,
    pincode: order.pincode,
    trackingNumber: order.tracking_number,
    paymentMethod,
    paymentStatus,
    transactionId,
    orderItems: formattedItems,
    items: formattedItems,
    createdAt: order.created_at || order.order_date
  };
};

// 1. Checkout Endpoint
exports.checkout = async (req, res, next) => {
  try {
    const userId = req.user ? req.user.id : null;
    const {
      items, fullName, email, phone, address, city, pincode,
      paymentMethod = 'COD', discountAmount = 0, shippingCost = 0
    } = req.body;

    const normalizedMethod = String(paymentMethod || 'COD').trim().toUpperCase();

    // Validate customer details
    if (!fullName || !String(fullName).trim()) {
      return res.status(400).json(ApiResponse.error('Full Name is required for delivery'));
    }
    if (!phone || !String(phone).trim()) {
      return res.status(400).json(ApiResponse.error('Mobile Number is required for delivery'));
    }
    if (!address || !String(address).trim()) {
      return res.status(400).json(ApiResponse.error('Delivery Address is required'));
    }
    if (!pincode || !String(pincode).trim()) {
      return res.status(400).json(ApiResponse.error('Pincode is required'));
    }

    let orderItemsData = items;

    if ((!orderItemsData || orderItemsData.length === 0) && userId) {
      const [cartRows] = await pool.query('SELECT id FROM cart WHERE user_id = ?', [userId]);
      if (cartRows.length > 0) {
        const cartId = cartRows[0].id;
        const [cItems] = await pool.query(
          `SELECT ci.product_id, ci.quantity, ci.selected_size, ci.selected_color, p.price 
           FROM cart_items ci JOIN products p ON ci.product_id = p.id WHERE ci.cart_id = ?`,
          [cartId]
        );
        orderItemsData = cItems.map(ci => ({
          productId: ci.product_id,
          quantity: ci.quantity,
          priceAtTime: ci.price,
          selectedSize: ci.selected_size,
          selectedColor: ci.selected_color
        }));
      }
    }

    if (!orderItemsData || orderItemsData.length === 0) {
      return res.status(400).json(ApiResponse.error('Cart is empty. Cannot process checkout.'));
    }

    let calculatedTotal = 0;
    for (const item of orderItemsData) {
      if (!item.priceAtTime) {
        const [pRows] = await pool.query('SELECT price FROM products WHERE id = ?', [item.productId]);
        item.priceAtTime = pRows.length > 0 ? pRows[0].price : (item.price || 0);
      }
      calculatedTotal += parseFloat(item.priceAtTime) * parseInt(item.quantity);
    }

    const finalTotal = Math.max(0, calculatedTotal - parseFloat(discountAmount) + parseFloat(shippingCost));

    // Determine initial order status: COD orders default to 'CONFIRMED' or 'Pending', UPI orders default to 'PAYMENT_PENDING'
    const initialStatus = normalizedMethod === 'COD' ? 'Pending' : 'PAYMENT_PENDING';
    const initialPaymentStatus = 'PENDING';

    const [orderResult] = await pool.query(
      `INSERT INTO orders 
       (user_id, total_amount, discount_amount, shipping_cost, status, full_name, email, phone, address, city, pincode, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        userId,
        finalTotal,
        parseFloat(discountAmount),
        parseFloat(shippingCost),
        initialStatus,
        fullName || (req.user ? req.user.full_name : 'Guest Customer'),
        email || (req.user ? req.user.email : 'guest@karviyam.com'),
        phone || (req.user ? req.user.phone : ''),
        address || (req.user ? req.user.address : 'Address provided at checkout'),
        city || 'City',
        pincode || '600001'
      ]
    );

    const orderId = orderResult.insertId;

    for (const item of orderItemsData) {
      await pool.query(
        `INSERT INTO order_items (order_id, product_id, quantity, price_at_time, selected_size, selected_color)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [orderId, item.productId || item.id, item.quantity, item.priceAtTime || item.price, item.selectedSize || null, item.selectedColor || null]
      );

      // Reduce product stock quantity safely
      await pool.query('UPDATE products SET stock_quantity = GREATEST(0, stock_quantity - ?) WHERE id = ?', [item.quantity, item.productId || item.id]);
    }

    // Insert payment record
    const txnId = normalizedMethod === 'COD' ? `COD-${orderId}-${Date.now()}` : `TXN-ORD-${orderId}-${Date.now()}`;
    await pool.query(
      `INSERT INTO payments (order_id, transaction_id, payment_method, amount, payment_status, created_at)
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [orderId, txnId, normalizedMethod, finalTotal, initialPaymentStatus]
    );

    // Clear user cart if logged in
    if (userId) {
      const [cartRows] = await pool.query('SELECT id FROM cart WHERE user_id = ?', [userId]);
      if (cartRows.length > 0) {
        await pool.query('DELETE FROM cart_items WHERE cart_id = ?', [cartRows[0].id]);
      }
      await pool.query('DELETE FROM cart WHERE user_id = ?', [userId]);
    }

    const [createdOrder] = await pool.query('SELECT * FROM orders WHERE id = ?', [orderId]);
    const dto = await mapOrderRowToDTO(createdOrder[0]);

    return res.status(200).json(ApiResponse.success(dto, 'Order created successfully.'));
  } catch (err) {
    next(err);
  }
};

// 2. Strict Server-Side Verify UPI Order Payment
exports.verifyOrderPayment = async (req, res, next) => {
  try {
    const { orderId, transactionReference, utrNumber, paidAmount } = req.body;

    if (!orderId) {
      return res.status(400).json(ApiResponse.error('Order ID is required for verification.'));
    }

    const [orders] = await pool.query('SELECT * FROM orders WHERE id = ? OR id = ?', [orderId, String(orderId).replace(/\D/g, '')]);
    if (orders.length === 0) {
      return res.status(404).json(ApiResponse.error('Order record not found.'));
    }

    const order = orders[0];
    const expectedAmount = parseFloat(order.total_amount || 0);
    const amountPaid = parseFloat(paidAmount || expectedAmount);

    // Strict Amount Verification: Received amount MUST EQUAL expected order total!
    if (amountPaid < expectedAmount) {
      return res.status(400).json(ApiResponse.error(`Payment verification failed: Amount paid (₹${amountPaid}) is less than order total (₹${expectedAmount}).`));
    }

    const cleanUtr = utrNumber ? String(utrNumber).trim() : '';
    const txnRef = transactionReference || `TXN-ORD-${order.id}-${Date.now()}`;

    const isValidUtr = cleanUtr.length >= 6 || (cleanUtr.length > 0 && /^[0-9A-Za-z_-]+$/.test(cleanUtr));

    if (!isValidUtr) {
      await pool.query(
        `UPDATE orders SET status = 'PAYMENT_PENDING', updated_at = NOW() WHERE id = ?`,
        [order.id]
      );
      await pool.query(
        `UPDATE payments SET payment_status = 'PENDING', updated_at = NOW() WHERE order_id = ?`,
        [order.id]
      );
      return res.status(200).json(ApiResponse.success({
        orderId: order.id,
        status: 'PAYMENT_PENDING',
        paymentStatus: 'PENDING',
        totalAmount: expectedAmount
      }, 'Payment verification pending. Complete transfer in your UPI app.'));
    }

    // Update order status to CONFIRMED & payment status to SUCCESS in MySQL
    await pool.query(
      `UPDATE orders SET status = 'CONFIRMED', updated_at = NOW() WHERE id = ?`,
      [order.id]
    );

    await pool.query(
      `UPDATE payments 
       SET payment_status = 'SUCCESS', 
           transaction_id = ?, 
           utr_number = ?, 
           verified_at = NOW(), 
           updated_at = NOW() 
       WHERE order_id = ?`,
      [txnRef, cleanUtr, order.id]
    );

    // Send order confirmation email ONLY after verified SUCCESS
    try {
      const emailService = require('../utils/emailService');
      if (emailService.sendOrderConfirmationEmail) {
        emailService.sendOrderConfirmationEmail(order).catch(e => console.error('[Order Confirmation Email Error]:', e));
      }
    } catch (e) {}

    const updatedOrder = await mapOrderRowToDTO({
      ...order,
      status: 'CONFIRMED'
    });

    return res.status(200).json(ApiResponse.success(updatedOrder, 'UPI Payment verified successfully! Order Confirmed! 🎉'));
  } catch (err) {
    next(err);
  }
};

exports.getMyOrders = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const [orders] = await pool.query('SELECT * FROM orders WHERE user_id = ? ORDER BY id DESC', [userId]);
    const dtos = await Promise.all(orders.map(mapOrderRowToDTO));
    return res.status(200).json(ApiResponse.success(dtos, 'User orders retrieved successfully'));
  } catch (err) {
    next(err);
  }
};

exports.getOrderById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const cleanId = String(id).replace(/\D/g, '') || id;
    const [orders] = await pool.query('SELECT * FROM orders WHERE id = ? OR id = ?', [id, cleanId]);
    if (orders.length === 0) {
      return res.status(404).json(ApiResponse.error('Order not found'));
    }

    const order = orders[0];
    const dto = await mapOrderRowToDTO(order);
    return res.status(200).json(ApiResponse.success(dto, 'Order details fetched successfully'));
  } catch (err) {
    next(err);
  }
};

exports.cancelOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [orders] = await pool.query('SELECT * FROM orders WHERE id = ?', [id]);
    if (orders.length === 0) return res.status(404).json(ApiResponse.error('Order not found'));

    await pool.query("UPDATE orders SET status = 'CANCELLED' WHERE id = ?", [id]);
    await pool.query("UPDATE payments SET payment_status = 'CANCELLED' WHERE order_id = ?", [id]);

    return res.status(200).json(ApiResponse.success({ id }, 'Order cancelled successfully'));
  } catch (err) {
    next(err);
  }
};

exports.getInvoice = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [orders] = await pool.query('SELECT * FROM orders WHERE id = ?', [id]);
    if (orders.length === 0) return res.status(404).json(ApiResponse.error('Order not found'));

    const dto = await mapOrderRowToDTO(orders[0]);
    const html = generateInvoiceHtml(dto);
    res.setHeader('Content-Type', 'text/html');
    return res.send(html);
  } catch (err) {
    next(err);
  }
};

exports.updateOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, trackingNumber } = req.body;

    await pool.query(
      'UPDATE orders SET status = COALESCE(?, status), tracking_number = COALESCE(?, tracking_number) WHERE id = ?',
      [status, trackingNumber, id]
    );

    const [orders] = await pool.query('SELECT * FROM orders WHERE id = ?', [id]);
    const dto = await mapOrderRowToDTO(orders[0]);
    return res.status(200).json(ApiResponse.success(dto, 'Order updated successfully'));
  } catch (err) {
    next(err);
  }
};

exports.deleteOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM orders WHERE id = ?', [id]);
    return res.status(200).json(ApiResponse.success(null, 'Order deleted successfully'));
  } catch (err) {
    next(err);
  }
};
