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
  let paymentStatus = 'Pending';
  let transactionId = null;

  const [payments] = await pool.query('SELECT * FROM payments WHERE order_id = ? ORDER BY id DESC LIMIT 1', [order.id]);
  if (payments.length > 0) {
    paymentMethod = payments[0].payment_method || 'COD';
    paymentStatus = payments[0].payment_status || 'Pending';
    transactionId = payments[0].transaction_id || null;
  }

  return {
    id: order.id,
    userId: order.user_id,
    totalAmount: parseFloat(order.total_amount || 0),
    discountAmount: parseFloat(order.discount_amount || 0),
    shippingCost: parseFloat(order.shipping_cost || 0),
    status: order.status || 'Pending',
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

exports.checkout = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const {
      items, fullName, email, phone, address, city, pincode,
      paymentMethod = 'COD', discountAmount = 0, shippingCost = 0
    } = req.body;

    let orderItemsData = items;

    // If items not directly supplied, fetch from cart
    if (!orderItemsData || orderItemsData.length === 0) {
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
        item.priceAtTime = pRows.length > 0 ? pRows[0].price : 0;
      }
      calculatedTotal += parseFloat(item.priceAtTime) * parseInt(item.quantity);
    }

    const finalTotal = Math.max(0, calculatedTotal - parseFloat(discountAmount) + parseFloat(shippingCost));

    const [orderResult] = await pool.query(
      `INSERT INTO orders 
       (user_id, total_amount, discount_amount, shipping_cost, status, full_name, email, phone, address, city, pincode, created_at)
       VALUES (?, ?, ?, ?, 'Pending', ?, ?, ?, ?, ?, ?, NOW())`,
      [
        userId,
        finalTotal,
        parseFloat(discountAmount),
        parseFloat(shippingCost),
        fullName || req.user.full_name,
        email || req.user.email,
        phone || req.user.phone,
        address || req.user.address || 'Address provided at checkout',
        city || 'City',
        pincode || '600001'
      ]
    );

    const orderId = orderResult.insertId;

    for (const item of orderItemsData) {
      await pool.query(
        `INSERT INTO order_items (order_id, product_id, quantity, price_at_time, selected_size, selected_color)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [orderId, item.productId, item.quantity, item.priceAtTime, item.selectedSize || null, item.selectedColor || null]
      );

      // Reduce product stock quantity safely
      await pool.query('UPDATE products SET stock_quantity = GREATEST(0, stock_quantity - ?) WHERE id = ?', [item.quantity, item.productId]);
    }

    // Insert payment record
    const txnId = paymentMethod === 'COD' ? `COD-${orderId}-${Date.now()}` : `TXN-${orderId}-${Date.now()}`;
    await pool.query(
      `INSERT INTO payments (order_id, transaction_id, payment_method, amount, payment_status, created_at)
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [orderId, txnId, paymentMethod, finalTotal, paymentMethod === 'COD' ? 'Pending' : 'Pending']
    );

    // Clear user cart
    const [cartRows] = await pool.query('SELECT id FROM cart WHERE user_id = ?', [userId]);
    if (cartRows.length > 0) {
      await pool.query('DELETE FROM cart_items WHERE cart_id = ?', [cartRows[0].id]);
    }
    await pool.query('DELETE FROM cart WHERE user_id = ?', [userId]);

    const [createdOrder] = await pool.query('SELECT * FROM orders WHERE id = ?', [orderId]);
    const dto = await mapOrderRowToDTO(createdOrder[0]);

    return res.status(200).json(ApiResponse.success(dto, 'Order placed successfully!'));
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
    const [orders] = await pool.query('SELECT * FROM orders WHERE id = ?', [id]);
    if (orders.length === 0) {
      return res.status(404).json(ApiResponse.error('Order not found'));
    }

    // Verify ownership unless admin
    const order = orders[0];
    if (order.user_id !== req.user.id && !req.user.roles.includes('ROLE_ADMIN')) {
      return res.status(403).json(ApiResponse.error('Access denied'));
    }

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
    if (orders.length === 0) {
      return res.status(404).json(ApiResponse.error('Order not found'));
    }

    const order = orders[0];
    if (order.status === 'Cancelled') {
      return res.status(400).json(ApiResponse.error('Order is already cancelled'));
    }

    await pool.query("UPDATE orders SET status = 'Cancelled' WHERE id = ?", [id]);
    await pool.query("UPDATE payments SET payment_status = 'Failed' WHERE order_id = ? AND payment_status = 'Pending'", [id]);

    const [updated] = await pool.query('SELECT * FROM orders WHERE id = ?', [id]);
    const dto = await mapOrderRowToDTO(updated[0]);
    return res.status(200).json(ApiResponse.success(dto, 'Order cancelled successfully'));
  } catch (err) {
    next(err);
  }
};

exports.getInvoice = async (req, res, next) => {
  try {
    const { id } = req.params;
    const html = await generateInvoiceHtml(id);
    res.setHeader('Content-Type', 'text/html');
    return res.send(html);
  } catch (err) {
    next(err);
  }
};

exports.updateOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const dto = req.body;
    const [orders] = await pool.query('SELECT * FROM orders WHERE id = ?', [id]);
    if (orders.length === 0) {
      return res.status(404).json(ApiResponse.error('Order not found'));
    }

    let updates = [];
    let params = [];

    if (dto.status !== undefined) { updates.push('status = ?'); params.push(dto.status); }
    if (dto.fullName !== undefined) { updates.push('full_name = ?'); params.push(dto.fullName); }
    if (dto.email !== undefined) { updates.push('email = ?'); params.push(dto.email); }
    if (dto.phone !== undefined) { updates.push('phone = ?'); params.push(dto.phone); }
    if (dto.address !== undefined) { updates.push('address = ?'); params.push(dto.address); }
    if (dto.city !== undefined) { updates.push('city = ?'); params.push(dto.city); }
    if (dto.pincode !== undefined) { updates.push('pincode = ?'); params.push(dto.pincode); }
    if (dto.trackingNumber !== undefined) { updates.push('tracking_number = ?'); params.push(dto.trackingNumber); }

    if (updates.length > 0) {
      params.push(id);
      await pool.query(`UPDATE orders SET ${updates.join(', ')} WHERE id = ?`, params);
    }

    if (dto.paymentStatus !== undefined) {
      await pool.query('UPDATE payments SET payment_status = ? WHERE order_id = ?', [dto.paymentStatus, id]);
    }

    const [updated] = await pool.query('SELECT * FROM orders WHERE id = ?', [id]);
    const dtoRes = await mapOrderRowToDTO(updated[0]);
    return res.status(200).json(ApiResponse.success(dtoRes, 'Order updated successfully'));
  } catch (err) {
    next(err);
  }
};

exports.deleteOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM order_items WHERE order_id = ?', [id]);
    await pool.query('DELETE FROM payments WHERE order_id = ?', [id]);
    await pool.query('DELETE FROM orders WHERE id = ?', [id]);
    return res.status(200).json(ApiResponse.success(null, 'Order deleted successfully'));
  } catch (err) {
    next(err);
  }
};
