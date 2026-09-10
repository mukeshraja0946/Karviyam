const pool = require('../config/db');
const ApiResponse = require('../utils/apiResponse');

// 1. Customer: Create Return/Refund Request
exports.createReturnRequest = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json(ApiResponse.error('Authentication required'));
    }

    const { orderId, orderItemId, type = 'RETURN', reason, description, images = [] } = req.body;

    if (!orderId || !reason) {
      return res.status(400).json(ApiResponse.error('Order ID and reason are required'));
    }

    // 1. Check order ownership & status
    const [orders] = await pool.query(
      `SELECT * FROM orders WHERE id = ? AND user_id = ?`,
      [orderId, userId]
    );

    if (orders.length === 0) {
      return res.status(404).json(ApiResponse.error('Order not found or access denied'));
    }

    const order = orders[0];
    if (String(order.status).toLowerCase() === 'cancelled') {
      return res.status(400).json(ApiResponse.error('Cannot submit return request for a cancelled order'));
    }

    // 2. Check for duplicate pending/active return request
    const [existing] = await pool.query(
      `SELECT id FROM return_requests WHERE order_id = ? AND (order_item_id = ? OR order_item_id IS NULL) AND status NOT IN ('REJECTED', 'CANCELLED')`,
      [orderId, orderItemId || null]
    );

    if (existing.length > 0) {
      return res.status(400).json(ApiResponse.error('A return/refund request is already active for this item/order'));
    }

    const imagesJson = typeof images === 'string' ? images : JSON.stringify(Array.isArray(images) ? images : []);

    const [result] = await pool.query(
      `INSERT INTO return_requests 
       (order_id, order_item_id, user_id, type, reason, description, images, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'RETURN/REFUND REQUESTED', NOW())`,
      [orderId, orderItemId || null, userId, type, reason, description || '', imagesJson]
    );

    const requestId = result.insertId;

    // Create Customer Notification
    try {
      await pool.query(
        `INSERT INTO notifications (user_id, type, title, message, related_order_id, is_read, created_at)
         VALUES (?, 'RETURN_STATUS', 'Return Request Received 📦', ?, ?, 0, NOW())`,
        [userId, `Your ${type.toLowerCase()} request for Order #${orderId} has been submitted and is under review.`, orderId]
      );
    } catch (eNotif) {}

    return res.status(201).json(ApiResponse.success({
      requestId,
      orderId,
      status: 'RETURN/REFUND REQUESTED'
    }, 'Return request submitted successfully'));
  } catch (err) {
    next(err);
  }
};

// 2. Customer: Get Customer's Return Requests
exports.getCustomerReturnRequests = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json(ApiResponse.error('Authentication required'));
    }

    const [rows] = await pool.query(
      `SELECT r.*, o.order_date, o.total_amount as order_total, o.status as order_status
       FROM return_requests r
       JOIN orders o ON r.order_id = o.id
       WHERE r.user_id = ?
       ORDER BY r.id DESC`,
      [userId]
    );

    const parsed = rows.map(r => ({
      ...r,
      images: typeof r.images === 'string' ? JSON.parse(r.images || '[]') : (r.images || [])
    }));

    return res.status(200).json(ApiResponse.success(parsed, 'Return requests fetched successfully'));
  } catch (err) {
    next(err);
  }
};

// 3. Admin: Get All Return/Refund Requests
exports.getAdminReturnRequests = async (req, res, next) => {
  try {
    const { status, search } = req.query;
    let sql = `
      SELECT r.*, o.full_name as customer_name, o.email as customer_email, o.phone as customer_phone, o.total_amount as order_total
      FROM return_requests r
      LEFT JOIN orders o ON r.order_id = o.id
      WHERE 1=1
    `;
    const params = [];

    if (status && status !== 'ALL') {
      sql += ` AND r.status = ?`;
      params.push(status);
    }

    if (search && search.trim()) {
      const term = `%${search.trim()}%`;
      sql += ` AND (r.id = ? OR r.order_id = ? OR LOWER(o.full_name) LIKE LOWER(?) OR LOWER(o.email) LIKE LOWER(?) OR LOWER(r.reason) LIKE LOWER(?))`;
      params.push(isNaN(search.trim()) ? -1 : parseInt(search.trim(), 10), isNaN(search.trim()) ? -1 : parseInt(search.trim(), 10), term, term, term);
    }

    sql += ` ORDER BY r.id DESC LIMIT 100`;

    const [rows] = await pool.query(sql, params);

    const parsed = rows.map(r => ({
      ...r,
      images: typeof r.images === 'string' ? JSON.parse(r.images || '[]') : (r.images || [])
    }));

    return res.status(200).json(ApiResponse.success(parsed, 'Admin return requests fetched successfully'));
  } catch (err) {
    next(err);
  }
};

// 4. Admin: Update Return Status
exports.updateReturnStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, refundAmount, refundReference, adminNotes } = req.body;

    if (!status) {
      return res.status(400).json(ApiResponse.error('Status is required'));
    }

    const [requests] = await pool.query(`SELECT * FROM return_requests WHERE id = ?`, [id]);
    if (requests.length === 0) {
      return res.status(404).json(ApiResponse.error('Return request not found'));
    }

    const reqItem = requests[0];

    await pool.query(
      `UPDATE return_requests SET 
       status = ?, 
       refund_amount = COALESCE(?, refund_amount), 
       refund_reference = COALESCE(?, refund_reference), 
       admin_notes = COALESCE(?, admin_notes),
       updated_at = NOW()
       WHERE id = ?`,
      [status, refundAmount || null, refundReference || null, adminNotes || null, id]
    );

    // Notify Customer
    try {
      await pool.query(
        `INSERT INTO notifications (user_id, type, title, message, related_order_id, is_read, created_at)
         VALUES (?, 'RETURN_STATUS', 'Return Status Updated 🔄', ?, ?, 0, NOW())`,
        [
          reqItem.user_id,
          `Your return request #${id} for Order #${reqItem.order_id} is now: ${status}.`,
          reqItem.order_id
        ]
      );
    } catch (eNotif) {}

    return res.status(200).json(ApiResponse.success({
      id,
      status,
      refundAmount,
      refundReference,
      adminNotes
    }, 'Return status updated successfully'));
  } catch (err) {
    next(err);
  }
};
