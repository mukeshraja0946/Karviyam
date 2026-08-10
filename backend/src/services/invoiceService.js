const pool = require('../config/db');

async function generateInvoiceHtml(orderId) {
  const [orders] = await pool.query('SELECT * FROM orders WHERE id = ?', [orderId]);
  if (orders.length === 0) {
    throw new Error('Order not found');
  }
  const order = orders[0];

  const [items] = await pool.query(
    `SELECT oi.*, p.name as product_name 
     FROM order_items oi 
     LEFT JOIN products p ON oi.product_id = p.id 
     WHERE oi.order_id = ?`,
    [orderId]
  );

  let itemsHtml = '';
  for (const item of items) {
    const unitPrice = parseFloat(item.price_at_time || 0);
    const qty = parseInt(item.quantity || 1);
    const subtotal = unitPrice * qty;
    const prodName = item.product_name || `Product #${item.product_id}`;
    const variantInfo = [item.selected_size, item.selected_color].filter(Boolean).join(' / ');

    itemsHtml += `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">
          <strong>${prodName}</strong>
          ${variantInfo ? `<br/><small style="color: #666;">Variant: ${variantInfo}</small>` : ''}
        </td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${qty}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">₹${unitPrice.toFixed(2)}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">₹${subtotal.toFixed(2)}</td>
      </tr>
    `;
  }

  const orderDate = order.created_at ? new Date(order.created_at).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }) : 'N/A';

  const discount = parseFloat(order.discount_amount || 0);
  const shipping = parseFloat(order.shipping_cost || 0);
  const total = parseFloat(order.total_amount || 0);

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Invoice #KAR-${order.id}</title>
  <style>
    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333; margin: 0; padding: 20px; }
    .invoice-box { max-width: 800px; margin: auto; padding: 30px; border: 1px solid #eee; box-shadow: 0 0 10px rgba(0,0,0,0.05); }
    .header { display: flex; justify-content: space-between; border-bottom: 2px solid #ff9900; padding-bottom: 20px; }
    .title { font-size: 28px; font-weight: bold; color: #111; }
    .subtitle { font-size: 14px; color: #777; }
    .table-items { width: 100%; border-collapse: collapse; margin-top: 20px; }
    .table-items th { background: #f8f9fa; padding: 10px; text-align: left; font-weight: 600; }
    .summary { margin-top: 30px; text-align: right; }
    .total { font-size: 20px; font-weight: bold; color: #ff9900; }
  </style>
</head>
<body>
  <div class="invoice-box">
    <div class="header">
      <div>
        <div class="title">KARVIYAM</div>
        <div class="subtitle">Official Purchase Invoice</div>
      </div>
      <div style="text-align: right;">
        <h3>INVOICE #KAR-${order.id}</h3>
        <div>Date: ${orderDate}</div>
        <div>Status: <strong>${order.status || 'CONFIRMED'}</strong></div>
      </div>
    </div>

    <div style="margin-top: 20px;">
      <h4>Billed To:</h4>
      <p><strong>${order.full_name || 'Customer'}</strong><br/>
      ${order.address || ''} ${order.city || ''} ${order.pincode || ''}<br/>
      Phone: ${order.phone || 'N/A'}<br/>
      Email: ${order.email || 'N/A'}</p>
    </div>

    <table class="table-items">
      <thead>
        <tr>
          <th>Item Description</th>
          <th style="text-align: center;">Qty</th>
          <th style="text-align: right;">Unit Price</th>
          <th style="text-align: right;">Subtotal</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
      </tbody>
    </table>

    <div class="summary">
      <p>Discount: -₹${discount.toFixed(2)}</p>
      <p>Shipping: ₹${shipping.toFixed(2)}</p>
      <p class="total">Total Amount Paid: ₹${total.toFixed(2)}</p>
    </div>
  </div>
</body>
</html>`;
}

module.exports = {
  generateInvoiceHtml
};
