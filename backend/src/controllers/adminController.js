const pool = require('../config/db');
const ApiResponse = require('../utils/apiResponse');

exports.getDashboardStats = async (req, res, next) => {
  try {
    const [[{ totalSales }]] = await pool.query("SELECT COALESCE(SUM(total_amount), 0) as totalSales FROM orders WHERE status != 'Cancelled'");
    const [[{ totalOrders }]] = await pool.query("SELECT COUNT(*) as totalOrders FROM orders");
    const [[{ totalCustomers }]] = await pool.query("SELECT COUNT(*) as totalCustomers FROM users WHERE role = 'customer' OR role IS NULL");
    const [[{ totalProducts }]] = await pool.query("SELECT COUNT(*) as totalProducts FROM products WHERE is_active = 1 OR is_active IS NULL");

    // Fetch recent 10 orders
    const [recentOrders] = await pool.query("SELECT id, user_id, total_amount, status, full_name, created_at FROM orders ORDER BY id DESC LIMIT 10");

    const stats = {
      totalSales: parseFloat(totalSales || 0),
      totalOrders: parseInt(totalOrders || 0),
      totalCustomers: parseInt(totalCustomers || 0),
      totalProducts: parseInt(totalProducts || 0),
      recentOrders: recentOrders.map(o => ({
        id: o.id,
        customerName: o.full_name || `Customer #${o.user_id}`,
        totalAmount: parseFloat(o.total_amount || 0),
        status: o.status,
        createdAt: o.created_at
      }))
    };

    return res.status(200).json(ApiResponse.success(stats, 'Dashboard statistics fetched successfully'));
  } catch (err) {
    next(err);
  }
};

exports.getAllOrders = async (req, res, next) => {
  try {
    const [orders] = await pool.query('SELECT * FROM orders ORDER BY id DESC');

    const formattedOrders = await Promise.all(orders.map(async (order) => {
      const [items] = await pool.query(
        `SELECT oi.*, p.name as product_name, p.image_url 
         FROM order_items oi 
         LEFT JOIN products p ON oi.product_id = p.id 
         WHERE oi.order_id = ?`,
        [order.id]
      );

      const [payments] = await pool.query('SELECT * FROM payments WHERE order_id = ? ORDER BY id DESC LIMIT 1', [order.id]);
      const payment = payments.length > 0 ? payments[0] : {};

      return {
        id: order.id,
        userId: order.user_id,
        fullName: order.full_name,
        email: order.email,
        phone: order.phone,
        address: order.address,
        city: order.city,
        pincode: order.pincode,
        totalAmount: parseFloat(order.total_amount || 0),
        discountAmount: parseFloat(order.discount_amount || 0),
        shippingCost: parseFloat(order.shipping_cost || 0),
        status: order.status || 'Pending',
        paymentMethod: payment.payment_method || 'COD',
        paymentStatus: payment.payment_status || 'Pending',
        transactionId: payment.transaction_id || null,
        orderItems: items.map(i => ({
          id: i.id,
          productId: i.product_id,
          productName: i.product_name,
          quantity: i.quantity,
          priceAtTime: parseFloat(i.price_at_time || 0),
          selectedSize: i.selected_size,
          selectedColor: i.selected_color,
          imageUrl: i.image_url
        })),
        createdAt: order.created_at || order.order_date
      };
    }));

    return res.status(200).json(ApiResponse.success(formattedOrders, 'All orders retrieved successfully'));
  } catch (err) {
    next(err);
  }
};

exports.updateOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const status = req.query.status || req.body.status;

    if (!status) {
      return res.status(400).json(ApiResponse.error('Status parameter is required'));
    }

    const cleanId = String(id).replace(/[^0-9]/g, '');

    if (cleanId) {
      try {
        await pool.query('UPDATE orders SET status = ? WHERE id = ?', [status, cleanId]);

        if (status.toUpperCase() === 'DELIVERED') {
          await pool.query("UPDATE payments SET payment_status = 'Completed' WHERE order_id = ?", [cleanId]);
        } else if (status.toUpperCase() === 'CANCELLED') {
          await pool.query("UPDATE payments SET payment_status = 'Failed' WHERE order_id = ? AND payment_status = 'Pending'", [cleanId]);
        }
      } catch (errQuery) {}
    }

    return res.status(200).json(ApiResponse.success({ id, status }, 'Order status updated successfully'));
  } catch (err) {
    next(err);
  }
};

exports.getAdminProducts = async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT p.*, c.name as category_name, b.name as brand_name
       FROM products p 
       LEFT JOIN categories c ON p.category_id = c.id 
       LEFT JOIN brands b ON p.brand_id = b.id 
       ORDER BY p.id DESC`
    );

    const productDTOs = rows.map(p => ({
      id: p.id,
      name: p.name,
      sku: p.sku,
      barcode: p.barcode,
      description: p.description,
      price: parseFloat(p.price || 0),
      oldPrice: p.old_price ? parseFloat(p.old_price) : null,
      costPrice: p.cost_price ? parseFloat(p.cost_price) : null,
      stockQuantity: p.stock_quantity || 0,
      imageUrl: p.image_url,
      type: p.type || 'General',
      gender: p.gender || 'Unisex',
      brand: p.brand || p.brand_name || null,
      rating: parseFloat(p.rating || 4.5),
      isFeatured: Boolean(p.is_featured),
      isTrending: Boolean(p.is_trending),
      isBestSeller: Boolean(p.is_best_seller),
      isNewArrival: Boolean(p.is_new_arrival),
      isActive: p.is_active !== undefined ? Boolean(p.is_active) : true,
      categoryId: p.category_id,
      categoryName: p.category_name || null,
      createdAt: p.created_at
    }));

    return res.status(200).json(ApiResponse.success(productDTOs, 'Admin products fetched successfully'));
  } catch (err) {
    next(err);
  }
};

exports.createProduct = async (req, res, next) => {
  try {
    const dto = req.body;
    if (!dto.name || !dto.price) {
      return res.status(400).json(ApiResponse.error('Product name and price are required'));
    }

    // Validate foreign keys to prevent FK constraint failures
    let catId = dto.categoryId ? parseInt(dto.categoryId, 10) : null;
    if (catId) {
      const [validCat] = await pool.query('SELECT id FROM categories WHERE id = ?', [catId]);
      if (validCat.length === 0) catId = null;
    }
    if (!catId) {
      const [firstCat] = await pool.query('SELECT id FROM categories ORDER BY id ASC LIMIT 1');
      if (firstCat.length > 0) catId = firstCat[0].id;
      else catId = null;
    }

    let subCatId = dto.subcategoryId ? parseInt(dto.subcategoryId, 10) : null;
    if (subCatId) {
      const [validSub] = await pool.query('SELECT id FROM categories WHERE id = ?', [subCatId]);
      if (validSub.length === 0) subCatId = null;
    }

    let brandIdVal = dto.brandId ? parseInt(dto.brandId, 10) : null;
    if (brandIdVal) {
      const [validBrand] = await pool.query('SELECT id FROM brands WHERE id = ?', [brandIdVal]);
      if (validBrand.length === 0) brandIdVal = null;
    }

    const mainImg = dto.imageUrl || (Array.isArray(dto.images) && dto.images.length > 0 ? dto.images[0] : null);

    const [result] = await pool.query(
      `INSERT INTO products 
       (category_id, subcategory_id, brand_id, name, sku, barcode, description, price, old_price, cost_price, stock_quantity, image_url, video_url, type, gender, brand, rating, is_featured, is_trending, is_best_seller, is_new_arrival, is_active, size, color, fabric, fit, material, weight, tags, review, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        catId, subCatId, brandIdVal,
        dto.name, dto.sku || null, dto.barcode || null, dto.description || null,
        parseFloat(dto.price), dto.oldPrice ? parseFloat(dto.oldPrice) : null,
        dto.costPrice ? parseFloat(dto.costPrice) : null,
        dto.stockQuantity !== undefined ? parseInt(dto.stockQuantity, 10) : 10,
        mainImg, dto.videoUrl || null,
        dto.type || 'General', dto.gender || 'Unisex', dto.brand || 'Karviyam',
        dto.rating ? parseFloat(dto.rating) : 4.5,
        dto.isFeatured ? 1 : 0, dto.isTrending ? 1 : 0, dto.isBestSeller ? 1 : 0, dto.isNewArrival ? 1 : 0,
        dto.isActive !== undefined ? (dto.isActive ? 1 : 0) : 1,
        dto.size || null, dto.color || null, dto.fabric || null, dto.fit || null,
        dto.material || null, dto.weight ? parseFloat(dto.weight) : null,
        dto.tags || null, dto.review || null
      ]
    );

    const productId = result.insertId;

    // Save images if array provided
    if (Array.isArray(dto.images) && dto.images.length > 0) {
      for (let i = 0; i < dto.images.length; i++) {
        const imgUrl = dto.images[i];
        if (imgUrl) {
          try {
            await pool.query(
              'INSERT INTO product_images (product_id, image_url, is_main, sort_order) VALUES (?, ?, ?, ?)',
              [productId, imgUrl, i === 0, i]
            );
          } catch (eImg) {}
        }
      }
    }

    const [rows] = await pool.query('SELECT * FROM products WHERE id = ?', [productId]);
    return res.status(200).json(ApiResponse.success(rows[0], 'Product created successfully'));
  } catch (err) {
    next(err);
  }
};

exports.updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const dto = req.body;

    const [rows] = await pool.query('SELECT * FROM products WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json(ApiResponse.error('Product not found'));
    }

    let updates = [];
    let params = [];

    if (dto.name !== undefined) { updates.push('name = ?'); params.push(dto.name); }
    if (dto.price !== undefined) { updates.push('price = ?'); params.push(parseFloat(dto.price)); }
    if (dto.oldPrice !== undefined) { updates.push('old_price = ?'); params.push(dto.oldPrice ? parseFloat(dto.oldPrice) : null); }
    if (dto.costPrice !== undefined) { updates.push('cost_price = ?'); params.push(dto.costPrice ? parseFloat(dto.costPrice) : null); }
    if (dto.stockQuantity !== undefined) { updates.push('stock_quantity = ?'); params.push(parseInt(dto.stockQuantity)); }
    if (dto.description !== undefined) { updates.push('description = ?'); params.push(dto.description); }
    if (dto.imageUrl !== undefined) { updates.push('image_url = ?'); params.push(dto.imageUrl); }
    if (dto.type !== undefined) { updates.push('type = ?'); params.push(dto.type); }
    if (dto.gender !== undefined) { updates.push('gender = ?'); params.push(dto.gender); }
    if (dto.brand !== undefined) { updates.push('brand = ?'); params.push(dto.brand); }
    if (dto.categoryId !== undefined) { updates.push('category_id = ?'); params.push(dto.categoryId); }
    if (dto.subcategoryId !== undefined) { updates.push('subcategory_id = ?'); params.push(dto.subcategoryId); }
    if (dto.isFeatured !== undefined) { updates.push('is_featured = ?'); params.push(dto.isFeatured ? 1 : 0); }
    if (dto.isTrending !== undefined) { updates.push('is_trending = ?'); params.push(dto.isTrending ? 1 : 0); }
    if (dto.isBestSeller !== undefined) { updates.push('is_best_seller = ?'); params.push(dto.isBestSeller ? 1 : 0); }
    if (dto.isNewArrival !== undefined) { updates.push('is_new_arrival = ?'); params.push(dto.isNewArrival ? 1 : 0); }
    if (dto.isActive !== undefined) { updates.push('is_active = ?'); params.push(dto.isActive ? 1 : 0); }

    if (updates.length > 0) {
      params.push(id);
      await pool.query(`UPDATE products SET ${updates.join(', ')} WHERE id = ?`, params);
    }

    const [updated] = await pool.query('SELECT * FROM products WHERE id = ?', [id]);
    return res.status(200).json(ApiResponse.success(updated[0], 'Product updated successfully'));
  } catch (err) {
    next(err);
  }
};

exports.deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM products WHERE id = ?', [id]);
    return res.status(200).json(ApiResponse.success(null, 'Product deleted successfully'));
  } catch (err) {
    next(err);
  }
};

exports.getCoupons = async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT * FROM coupons ORDER BY id DESC');
    const coupons = rows.map(c => ({
      id: c.id,
      code: c.code,
      discountType: c.discount_type,
      discountValue: parseFloat(c.discount_value || 0),
      minOrderAmount: parseFloat(c.min_order_amount || 0),
      active: Boolean(c.active)
    }));
    return res.status(200).json(ApiResponse.success(coupons, 'Coupons fetched successfully'));
  } catch (err) {
    next(err);
  }
};

exports.createCoupon = async (req, res, next) => {
  try {
    const { code, discountType, discountValue, minOrderAmount, active } = req.body;
    if (!code || !discountValue) {
      return res.status(400).json(ApiResponse.error('Code and discount value are required'));
    }

    const [result] = await pool.query(
      `INSERT INTO coupons (code, discount_type, discount_value, min_order_amount, active, created_at)
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [
        code.trim().toUpperCase(),
        discountType || 'PERCENTAGE',
        parseFloat(discountValue),
        minOrderAmount ? parseFloat(minOrderAmount) : 0,
        active !== undefined ? (active ? 1 : 0) : 1
      ]
    );

    const [rows] = await pool.query('SELECT * FROM coupons WHERE id = ?', [result.insertId]);
    return res.status(200).json(ApiResponse.success(rows[0], 'Coupon created successfully'));
  } catch (err) {
    next(err);
  }
};

exports.deleteCoupon = async (req, res, next) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM coupons WHERE id = ?', [id]);
    return res.status(200).json(ApiResponse.success(null, 'Coupon deleted successfully'));
  } catch (err) {
    next(err);
  }
};

exports.updateCoupon = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { code, discountType, discountValue, minOrderAmount, active } = req.body;
    let updates = [];
    let params = [];

    if (code !== undefined) { updates.push('code = ?'); params.push(code.trim().toUpperCase()); }
    if (discountType !== undefined) { updates.push('discount_type = ?'); params.push(discountType); }
    if (discountValue !== undefined) { updates.push('discount_value = ?'); params.push(parseFloat(discountValue)); }
    if (minOrderAmount !== undefined) { updates.push('min_order_amount = ?'); params.push(parseFloat(minOrderAmount)); }
    if (active !== undefined) { updates.push('active = ?'); params.push(active ? 1 : 0); }

    if (updates.length > 0) {
      params.push(id);
      await pool.query(`UPDATE coupons SET ${updates.join(', ')} WHERE id = ?`, params);
    }
    const [rows] = await pool.query('SELECT * FROM coupons WHERE id = ?', [id]);
    return res.status(200).json(ApiResponse.success(rows[0], 'Coupon updated successfully'));
  } catch (err) {
    next(err);
  }
};

exports.getReviews = async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT r.*, p.name as product_name, u.full_name as user_name 
       FROM reviews r 
       LEFT JOIN products p ON r.product_id = p.id 
       LEFT JOIN users u ON r.user_id = u.id 
       ORDER BY r.id DESC`
    );
    return res.status(200).json(ApiResponse.success(rows, 'Reviews fetched successfully'));
  } catch (err) {
    next(err);
  }
};

exports.updateReviewStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const status = req.query.status || req.body.status || 'Approved';
    await pool.query('UPDATE reviews SET status = ? WHERE id = ?', [status, id]);
    return res.status(200).json(ApiResponse.success(null, 'Review status updated successfully'));
  } catch (err) {
    next(err);
  }
};

exports.getUsers = async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT id, full_name, email, phone, address, google_id, role, created_at FROM users ORDER BY id DESC');
    const users = rows.map(u => ({
      id: u.id,
      fullName: u.full_name,
      email: u.email,
      phone: u.phone,
      address: u.address,
      googleId: u.google_id,
      role: u.role || 'customer',
      createdAt: u.created_at
    }));
    return res.status(200).json(ApiResponse.success(users, 'Users fetched successfully'));
  } catch (err) {
    next(err);
  }
};

exports.getCustomers = async (req, res, next) => {
  try {
    const [rows] = await pool.query("SELECT id, full_name, email, phone, address, created_at FROM users WHERE role = 'customer' OR role IS NULL ORDER BY id DESC");
    const customers = rows.map(u => ({
      id: u.id,
      fullName: u.full_name,
      email: u.email,
      phone: u.phone,
      address: u.address,
      createdAt: u.created_at
    }));
    return res.status(200).json(ApiResponse.success(customers, 'Customers fetched successfully'));
  } catch (err) {
    next(err);
  }
};

exports.updateCustomer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { fullName, email, phone, address, role } = req.body;
    let updates = [];
    let params = [];
    if (fullName !== undefined) { updates.push('full_name = ?'); params.push(fullName); }
    if (email !== undefined) { updates.push('email = ?'); params.push(email); }
    if (phone !== undefined) { updates.push('phone = ?'); params.push(phone); }
    if (address !== undefined) { updates.push('address = ?'); params.push(address); }
    if (role !== undefined) { updates.push('role = ?'); params.push(role); }

    if (updates.length > 0) {
      params.push(id);
      await pool.query(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, params);
    }
    return res.status(200).json(ApiResponse.success(null, 'Customer updated successfully'));
  } catch (err) {
    next(err);
  }
};

exports.deleteCustomer = async (req, res, next) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM users WHERE id = ?', [id]);
    return res.status(200).json(ApiResponse.success(null, 'Customer deleted successfully'));
  } catch (err) {
    next(err);
  }
};
