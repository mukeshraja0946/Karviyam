const pool = require('../config/db');
const ApiResponse = require('../utils/apiResponse');
const { mapProductRowToDTO } = require('./productController');

exports.getDashboardStats = async (req, res, next) => {
  try {
    let todaySales = 0;
    let monthlySales = 0;
    let totalRevenue = 0;
    let totalOrders = 0;
    let pendingOrders = 0;
    let activeCustomers = 0;
    let totalProducts = 0;
    let outOfStock = 0;
    let totalSellers = 1;
    let recentOrdersRaw = [];
    let topProductsRaw = [];
    let lowStockRaw = [];
    let recentCustomersRaw = [];
    let dailySalesRaw = [];
    let monthlySalesChartRaw = [];

    try {
      const [[resSales]] = await pool.query(
        "SELECT COALESCE(SUM(total_amount), 0) as todaySales FROM orders WHERE status != 'Cancelled' AND (DATE(COALESCE(order_date, created_at)) = CURDATE())"
      );
      if (resSales) todaySales = resSales.todaySales || 0;
    } catch (e) {}

    try {
      const [[resMS]] = await pool.query(
        "SELECT COALESCE(SUM(total_amount), 0) as monthlySales FROM orders WHERE status != 'Cancelled' AND (MONTH(COALESCE(order_date, created_at)) = MONTH(CURDATE()) AND YEAR(COALESCE(order_date, created_at)) = YEAR(CURDATE()))"
      );
      if (resMS) monthlySales = resMS.monthlySales || 0;
    } catch (e) {}

    try {
      const [[resTR]] = await pool.query(
        "SELECT COALESCE(SUM(total_amount), 0) as totalRevenue FROM orders WHERE status != 'Cancelled'"
      );
      if (resTR) totalRevenue = resTR.totalRevenue || 0;
    } catch (e) {}

    try {
      const [[resTO]] = await pool.query("SELECT COUNT(*) as totalOrders FROM orders");
      if (resTO) totalOrders = resTO.totalOrders || 0;
    } catch (e) {}

    try {
      const [[resPO]] = await pool.query(
        "SELECT COUNT(*) as pendingOrders FROM orders WHERE LOWER(status) IN ('pending', 'processing', 'awaiting dispatch', 'placed')"
      );
      if (resPO) pendingOrders = resPO.pendingOrders || 0;
    } catch (e) {}

    try {
      const [[resAC]] = await pool.query(
        "SELECT COUNT(*) as activeCustomers FROM users WHERE LOWER(role) = 'customer' OR role IS NULL"
      );
      if (resAC) activeCustomers = resAC.activeCustomers || 0;
    } catch (e) {}

    try {
      const [[resTP]] = await pool.query("SELECT COUNT(*) as totalProducts FROM products");
      if (resTP) totalProducts = resTP.totalProducts || 0;
    } catch (e) {}

    try {
      const [[resOOS]] = await pool.query(
        "SELECT COUNT(*) as outOfStock FROM products WHERE stock_quantity <= 0 OR stock_quantity IS NULL"
      );
      if (resOOS) outOfStock = resOOS.outOfStock || 0;
    } catch (e) {}

    try {
      const [[resBrand]] = await pool.query("SELECT COUNT(*) as count FROM brands WHERE is_active = 1 OR is_active IS NULL");
      totalSellers = Math.max(1, parseInt(resBrand?.count || 0));
    } catch (e) {}

    try {
      const [resOrders] = await pool.query(
        "SELECT id, user_id, total_amount, status, payment_method, payment_status, full_name, COALESCE(order_date, created_at) as date_val FROM orders ORDER BY id DESC LIMIT 5"
      );
      if (resOrders) recentOrdersRaw = resOrders;
    } catch (e) {}

    try {
      const [resTop] = await pool.query(
        `SELECT p.id, p.name, p.price, p.stock_quantity, p.image_url, c.name as category,
                COALESCE(SUM(oi.quantity), 0) as sold,
                COALESCE(SUM(oi.quantity * oi.price_at_time), 0) as revenue
         FROM products p
         LEFT JOIN categories c ON p.category_id = c.id
         LEFT JOIN order_items oi ON p.id = oi.product_id
         GROUP BY p.id, p.name, p.price, p.stock_quantity, p.image_url, c.name
         ORDER BY sold DESC, p.id DESC
         LIMIT 5`
      );
      if (resTop) topProductsRaw = resTop;
    } catch (e) {}

    try {
      const [resLow] = await pool.query(
        "SELECT id, name, sku, stock_quantity FROM products WHERE stock_quantity <= 5 ORDER BY stock_quantity ASC LIMIT 5"
      );
      if (resLow) lowStockRaw = resLow;
    } catch (e) {}

    try {
      const [resCust] = await pool.query(
        "SELECT id, full_name, name, email, created_at FROM users WHERE LOWER(role) = 'customer' OR role IS NULL ORDER BY id DESC LIMIT 5"
      );
      if (resCust) recentCustomersRaw = resCust;
    } catch (e) {}

    try {
      const [resDS] = await pool.query(
        `SELECT DATE_FORMAT(COALESCE(order_date, created_at), '%Y-%m-%d') as day_date,
                DAYNAME(COALESCE(order_date, created_at)) as day_name,
                COALESCE(SUM(total_amount), 0) as sales
         FROM orders
         WHERE status != 'Cancelled' AND COALESCE(order_date, created_at) >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
         GROUP BY DATE_FORMAT(COALESCE(order_date, created_at), '%Y-%m-%d'), DAYNAME(COALESCE(order_date, created_at))
         ORDER BY day_date ASC`
      );
      if (resDS) dailySalesRaw = resDS;
    } catch (e) {}

    try {
      const [resMSChart] = await pool.query(
        `SELECT MONTHNAME(COALESCE(order_date, created_at)) as month_name,
                MONTH(COALESCE(order_date, created_at)) as month_num,
                COALESCE(SUM(total_amount), 0) as sales
         FROM orders
         WHERE status != 'Cancelled' AND YEAR(COALESCE(order_date, created_at)) = YEAR(CURDATE())
         GROUP BY MONTH(COALESCE(order_date, created_at)), MONTHNAME(COALESCE(order_date, created_at))
         ORDER BY month_num ASC`
      );
      if (resMSChart) monthlySalesChartRaw = resMSChart;
    } catch (e) {}

    const netProfit = parseFloat((totalRevenue * 0.31).toFixed(2));

    const stats = {
      todaySales: parseFloat(todaySales || 0),
      monthlySales: parseFloat(monthlySales || 0),
      totalRevenue: parseFloat(totalRevenue || 0),
      netProfit: netProfit,
      totalOrders: parseInt(totalOrders || 0),
      pendingOrders: parseInt(pendingOrders || 0),
      activeCustomers: parseInt(activeCustomers || 0),
      totalProducts: parseInt(totalProducts || 0),
      outOfStock: parseInt(outOfStock || 0),
      totalSellers: parseInt(totalSellers || 0),
      recentOrders: (recentOrdersRaw || []).map(o => ({
        id: `#ORD${o.id}`,
        customer: o.full_name || `Customer #${o.user_id}`,
        products: `Order #${o.id}`,
        date: new Date(o.date_val || Date.now()).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        amount: `₹${parseFloat(o.total_amount || 0).toLocaleString('en-IN')}`,
        payStatus: o.payment_status || o.payment_method || 'Paid',
        status: o.status || 'Processing',
        statusColor: o.status === 'Delivered' ? 'bg-emerald-100 text-emerald-800' : o.status === 'Shipped' ? 'bg-blue-100 text-blue-800' : o.status === 'Cancelled' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
      })),
      topProducts: (topProductsRaw || []).map(p => ({
        id: p.id,
        name: p.name,
        category: p.category || 'General',
        image: p.image_url || 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=150',
        stock: p.stock_quantity || 0,
        sold: parseInt(p.sold || 0),
        revenue: `₹${parseFloat(p.revenue || 0).toLocaleString('en-IN')}`,
        status: p.stock_quantity <= 0 ? 'Out of Stock' : p.stock_quantity <= 5 ? 'Low Stock' : 'In Stock'
      })),
      lowStockAlerts: (lowStockRaw || []).map(l => ({
        id: l.id,
        name: l.name,
        sku: l.sku || `KV-SKU-${l.id}`,
        stock: l.stock_quantity || 0,
        reorderLevel: 5
      })),
      recentCustomers: (recentCustomersRaw || []).map(c => ({
        id: c.id,
        name: c.full_name || c.name || 'Customer',
        email: c.email,
        joined: new Date(c.created_at || Date.now()).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
      })),
      chartData: {
        daily: (dailySalesRaw || []).map(d => ({ label: (d.day_name || '').slice(0, 3), sales: parseFloat(d.sales || 0) })),
        monthly: (monthlySalesChartRaw || []).map(m => ({ label: (m.month_name || '').slice(0, 3), sales: parseFloat(m.sales || 0) }))
      }
    };

    return res.status(200).json(ApiResponse.success(stats, 'Dashboard statistics fetched successfully'));
  } catch (err) {
    console.error('[AdminController] getDashboardStats error:', err);
    return res.status(200).json(ApiResponse.success({
      todaySales: 0,
      monthlySales: 0,
      totalRevenue: 0,
      netProfit: 0,
      totalOrders: 0,
      pendingOrders: 0,
      activeCustomers: 0,
      totalProducts: 0,
      outOfStock: 0,
      totalSellers: 1,
      recentOrders: [],
      topProducts: [],
      lowStockAlerts: [],
      recentCustomers: [],
      chartData: { daily: [], monthly: [] }
    }, 'Dashboard fallback statistics'));
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

    // Save color variants & dedicated image galleries
    if (Array.isArray(dto.colorVariants) && dto.colorVariants.length > 0) {
      await saveColorVariantsForProduct(productId, dto.colorVariants);
    } else if (Array.isArray(dto.images) && dto.images.length > 0) {
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
    if (rows.length > 0) {
      const fullDto = await mapProductRowToDTO(rows[0]);
      return res.status(200).json(ApiResponse.success(fullDto, 'Product created successfully'));
    }
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
    if (dto.colorVariantImages !== undefined || dto.color_variant_images !== undefined) {
      const rawCvi = dto.colorVariantImages || dto.color_variant_images;
      updates.push('color_variant_images = ?');
      params.push(typeof rawCvi === 'string' ? rawCvi : JSON.stringify(rawCvi));
    }

    if (updates.length > 0) {
      params.push(id);
      try {
        await pool.query(`UPDATE products SET ${updates.join(', ')}, updated_at = NOW() WHERE id = ?`, params);
      } catch (errQuery) {
        if (errQuery.code === 'ER_BAD_FIELD_ERROR' || (errQuery.message && errQuery.message.includes('updated_at'))) {
          try {
            await pool.query(`ALTER TABLE products ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`);
            await pool.query(`UPDATE products SET ${updates.join(', ')}, updated_at = NOW() WHERE id = ?`, params);
          } catch (e2) {
            await pool.query(`UPDATE products SET ${updates.join(', ')} WHERE id = ?`, params);
          }
        } else {
          throw errQuery;
        }
      }
    }

    // Update color variants & dedicated image galleries if provided
    let variantsToSave = dto.colorVariants || dto.color_variants || dto.colors;
    if (typeof variantsToSave === 'string') {
      try { variantsToSave = JSON.parse(variantsToSave); } catch (e) {}
    }
    if (variantsToSave && typeof variantsToSave === 'object' && !Array.isArray(variantsToSave)) {
      variantsToSave = Object.values(variantsToSave);
    }

    if (Array.isArray(variantsToSave) && variantsToSave.length > 0) {
      await saveColorVariantsForProduct(id, variantsToSave);
    } else if (dto.colorVariantImages || dto.color_variant_images) {
      try {
        const rawMap = dto.colorVariantImages || dto.color_variant_images;
        const parsedMap = typeof rawMap === 'string' ? JSON.parse(rawMap) : rawMap;
        if (parsedMap && typeof parsedMap === 'object') {
          const list = Object.values(parsedMap);
          if (list.length > 0) {
            await saveColorVariantsForProduct(id, list);
          }
        }
      } catch (eMap) {}
    }

    const [updated] = await pool.query('SELECT * FROM products WHERE id = ?', [id]);
    if (updated.length > 0) {
      const fullDto = await mapProductRowToDTO(updated[0]);
      return res.status(200).json(ApiResponse.success(fullDto, 'Product updated successfully'));
    }
    return res.status(200).json(ApiResponse.success(updated[0], 'Product updated successfully'));
  } catch (err) {
    next(err);
  }
};

const saveColorVariantsForProduct = async (productId, colorVariants) => {
  if (!productId || !Array.isArray(colorVariants)) return;

  try {
    try { await pool.query('ALTER TABLE products ADD COLUMN color_variant_images LONGTEXT'); } catch (e) {}

    await pool.query(`
      CREATE TABLE IF NOT EXISTS product_colors (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        product_id BIGINT NOT NULL,
        color_name VARCHAR(100) NOT NULL,
        hex_code VARCHAR(50),
        color_code VARCHAR(50),
        is_default BOOLEAN DEFAULT FALSE,
        main_image LONGTEXT,
        video_url LONGTEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `).catch(() => null);

    try { await pool.query('ALTER TABLE product_colors ADD COLUMN main_image LONGTEXT'); } catch (e) {}
    try { await pool.query('ALTER TABLE product_colors ADD COLUMN video_url LONGTEXT'); } catch (e) {}

    await pool.query(`
      CREATE TABLE IF NOT EXISTS product_color_images (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        product_color_id BIGINT NOT NULL,
        image_url LONGTEXT NOT NULL,
        is_main BOOLEAN DEFAULT FALSE,
        sort_order INT DEFAULT 0
      )
    `).catch(() => null);

    try { await pool.query('ALTER TABLE product_color_images ADD COLUMN is_main BOOLEAN DEFAULT FALSE'); } catch (e) {}

    // 1. Delete all existing product_color_images for this product using atomic subquery
    await pool.query(
      'DELETE FROM product_color_images WHERE product_color_id IN (SELECT id FROM product_colors WHERE product_id = ?)',
      [productId]
    ).catch(err => console.error('[DELETE product_color_images Error]:', err.message));

    // 2. Delete all existing product_colors for this product cleanly
    await pool.query(
      'DELETE FROM product_colors WHERE product_id = ?',
      [productId]
    ).catch(err => console.error('[DELETE product_colors Error]:', err.message));

    const cleanStr = (u) => {
      if (!u) return '';
      if (typeof u === 'string') return u.trim();
      if (typeof u === 'object') return (u.url || u.imageUrl || u.imagePath || u.src || '').trim();
      return String(u).trim();
    };

    const colorVariantMap = {};
    const allImages = [];
    let firstProductVideo = null;

    for (let cIdx = 0; cIdx < colorVariants.length; cIdx++) {
      const cv = colorVariants[cIdx];
      const cName = (cv.colorName || cv.color || `Color ${cIdx + 1}`).trim();
      const cCode = cv.colorCode || cv.hexCode || '#000000';
      const isDef = Boolean(cv.isDefault);
      
      const rawMain = cv.mainImage || (Array.isArray(cv.imageUrls) ? cv.imageUrls[0] : (Array.isArray(cv.images) ? cv.images[0] : null));
      const mainImg = cleanStr(rawMain);

      const rawSubs = Array.isArray(cv.subImages)
        ? cv.subImages
        : (Array.isArray(cv.imageUrls) ? cv.imageUrls.filter(i => cleanStr(i) !== mainImg) : (Array.isArray(cv.images) ? cv.images.filter(i => cleanStr(i) !== mainImg) : []));

      const subImgs = Array.isArray(rawSubs)
        ? rawSubs.map(cleanStr).filter(s => s && s !== mainImg)
        : [];

      const vUrl = cleanStr(cv.videoUrl || cv.video);
      if (vUrl && !firstProductVideo) firstProductVideo = vUrl;

      // Construct unified imageUrls array: [mainImg, ...subImgs]
      const unifiedUrls = [];
      if (mainImg) unifiedUrls.push(mainImg);
      subImgs.forEach(s => {
        if (s && !unifiedUrls.includes(s)) unifiedUrls.push(s);
      });

      if (unifiedUrls.length > 0 || mainImg || vUrl) {
        colorVariantMap[cName] = {
          colorName: cName,
          colorCode: cCode,
          hexCode: cCode,
          isDefault: isDef,
          mainImage: mainImg || unifiedUrls[0] || '',
          subImages: subImgs,
          videoUrl: vUrl || '',
          imageUrls: unifiedUrls,
          images: unifiedUrls
        };
        allImages.push(...unifiedUrls);
      }

      const [resCol] = await pool.query(
        'INSERT INTO product_colors (product_id, color_name, color_code, hex_code, is_default, main_image, video_url) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [productId, cName, cCode, cCode, isDef ? 1 : 0, mainImg || null, vUrl || null]
      );
      const colorId = resCol.insertId;

      for (let imgIdx = 0; imgIdx < subImgs.length; imgIdx++) {
        await pool.query(
          'INSERT INTO product_color_images (product_color_id, image_url, is_main, sort_order) VALUES (?, ?, ?, ?)',
          [colorId, subImgs[imgIdx], 0, imgIdx]
        );
      }
    }

    const jsonStr = JSON.stringify(colorVariantMap);
    await pool.query('UPDATE products SET color_variant_images = ? WHERE id = ?', [jsonStr, productId]).catch(() => null);

    if (firstProductVideo) {
      await pool.query('UPDATE products SET video_url = ? WHERE id = ?', [firstProductVideo, productId]).catch(() => null);
    }

    if (allImages.length > 0) {
      await pool.query('DELETE FROM product_images WHERE product_id = ?', [productId]).catch(() => null);
      const uniqueImgs = Array.from(new Set(allImages));
      for (let i = 0; i < uniqueImgs.length; i++) {
        await pool.query(
          'INSERT INTO product_images (product_id, image_url, is_main, sort_order) VALUES (?, ?, ?, ?)',
          [productId, uniqueImgs[i], i === 0 ? 1 : 0, i]
        ).catch(() => null);
      }
      
      const defaultVarObj = colorVariants.find(v => v.isDefault) || colorVariants[0];
      const defaultMainImg = defaultVarObj ? cleanStr(defaultVarObj.mainImage || (Array.isArray(defaultVarObj.imageUrls) ? defaultVarObj.imageUrls[0] : null)) : null;
      const primaryImgToSave = defaultMainImg || uniqueImgs[0];

      if (primaryImgToSave) {
        await pool.query('UPDATE products SET image_url = ? WHERE id = ?', [primaryImgToSave, productId]).catch(() => null);
      }
    }
  } catch (err) {
    console.error('[saveColorVariantsForProduct Error]:', err.message);
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
    const cleanId = String(id).replace(/[^0-9]/g, '');
    if (cleanId) {
      try { await pool.query('DELETE FROM coupons WHERE id = ?', [cleanId]); } catch (e) {}
    }
    return res.status(200).json(ApiResponse.success(null, 'Coupon deleted successfully'));
  } catch (err) {
    next(err);
  }
};

exports.updateCoupon = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { code, discountType, discountValue, minOrderAmount, active } = req.body;
    const cleanId = String(id).replace(/[^0-9]/g, '');

    if (cleanId) {
      try {
        let updates = [];
        let params = [];

        if (code !== undefined) { updates.push('code = ?'); params.push(code.trim().toUpperCase()); }
        if (discountType !== undefined) { updates.push('discount_type = ?'); params.push(discountType); }
        if (discountValue !== undefined) { updates.push('discount_value = ?'); params.push(parseFloat(discountValue)); }
        if (minOrderAmount !== undefined) { updates.push('min_order_amount = ?'); params.push(parseFloat(minOrderAmount)); }
        if (active !== undefined) { updates.push('active = ?'); params.push(active ? 1 : 0); }

        if (updates.length > 0) {
          params.push(cleanId);
          await pool.query(`UPDATE coupons SET ${updates.join(', ')} WHERE id = ?`, params);
        }
      } catch (errQuery) {}
    }

    return res.status(200).json(ApiResponse.success({ id, code, discountType, discountValue, minOrderAmount, active }, 'Coupon updated successfully'));
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
    const { fullName, email, phone } = req.body;
    const cleanId = String(id).replace(/[^0-9]/g, '');

    if (cleanId) {
      try {
        let updates = [];
        let params = [];
        if (fullName !== undefined) { updates.push('full_name = ?'); params.push(fullName); }
        if (email !== undefined) { updates.push('email = ?'); params.push(email); }
        if (phone !== undefined) { updates.push('phone = ?'); params.push(phone); }

        if (updates.length > 0) {
          params.push(cleanId);
          await pool.query(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, params);
        }
      } catch (errUser) {}
    }

    return res.status(200).json(ApiResponse.success(null, 'Customer updated successfully'));
  } catch (err) {
    next(err);
  }
};

exports.deleteCustomer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const cleanId = String(id).replace(/[^0-9]/g, '');

    if (cleanId) {
      try {
        await pool.query('DELETE FROM user_roles WHERE user_id = ?', [cleanId]);
        await pool.query('DELETE FROM user_addresses WHERE user_id = ?', [cleanId]);
        await pool.query('DELETE FROM users WHERE id = ?', [cleanId]);
      } catch (fkErr) {
        await pool.query('UPDATE users SET is_active = 0 WHERE id = ?', [cleanId]);
      }
    }

    return res.status(200).json(ApiResponse.success(null, 'Customer deleted successfully'));
  } catch (err) {
    next(err);
  }
};

exports.deleteAllCoupons = async (req, res, next) => {
  try {
    const [cnt] = await pool.query('SELECT COUNT(*) as c FROM coupons');
    const totalCount = cnt[0]?.c || 0;

    await pool.query('DELETE FROM coupons');

    try {
      const { logAudit } = require('../utils/auditLogger');
      await logAudit({
        adminId: req.user?.id || 1,
        action: 'CLEAR_ALL',
        targetType: 'Coupons',
        details: `Successfully cleared all ${totalCount} coupons.`
      });
    } catch (eAudit) {}

    return res.status(200).json(ApiResponse.success(
      { deletedCount: totalCount },
      `Successfully deleted ${totalCount} coupons.`
    ));
  } catch (err) {
    next(err);
  }
};

exports.deleteAllReviews = async (req, res, next) => {
  try {
    let totalCount = 0;
    try {
      const [cnt] = await pool.query('SELECT COUNT(*) as c FROM reviews');
      totalCount = cnt[0]?.c || 0;
    } catch (e) {}

    try { await pool.query('DELETE FROM reviews'); } catch (e) {}
    try { await pool.query('DELETE FROM product_reviews'); } catch (e) {}

    try {
      const { logAudit } = require('../utils/auditLogger');
      await logAudit({
        adminId: req.user?.id || 1,
        action: 'CLEAR_ALL',
        targetType: 'Reviews',
        details: `Successfully cleared all ${totalCount} reviews.`
      });
    } catch (eAudit) {}

    return res.status(200).json(ApiResponse.success(
      { deletedCount: totalCount },
      `Successfully deleted ${totalCount} product reviews.`
    ));
  } catch (err) {
    next(err);
  }
};

exports.deleteAllCustomers = async (req, res, next) => {
  try {
    const [cnt] = await pool.query("SELECT COUNT(*) as c FROM users WHERE role = 'customer' OR role = 'ROLE_CUSTOMER' OR role IS NULL");
    const totalCount = cnt[0]?.c || 0;

    try { await pool.query("DELETE FROM user_addresses WHERE user_id IN (SELECT id FROM users WHERE role = 'customer' OR role = 'ROLE_CUSTOMER' OR role IS NULL)"); } catch (e) {}
    try { await pool.query("DELETE FROM user_roles WHERE user_id IN (SELECT id FROM users WHERE role = 'customer' OR role = 'ROLE_CUSTOMER' OR role IS NULL)"); } catch (e) {}
    await pool.query("DELETE FROM users WHERE role = 'customer' OR role = 'ROLE_CUSTOMER' OR role IS NULL");

    try {
      const { logAudit } = require('../utils/auditLogger');
      await logAudit({
        adminId: req.user?.id || 1,
        action: 'CLEAR_ALL',
        targetType: 'Customers',
        details: `Successfully cleared ${totalCount} customer accounts (Admin accounts protected).`
      });
    } catch (eAudit) {}

    return res.status(200).json(ApiResponse.success(
      { deletedCount: totalCount },
      `Successfully deleted ${totalCount} customer accounts. (Admin accounts protected)`
    ));
  } catch (err) {
    next(err);
  }
};

exports.deleteAllOrders = async (req, res, next) => {
  let conn;
  try {
    conn = await pool.getConnection();
    await conn.beginTransaction();

    const [cnt] = await conn.query('SELECT COUNT(*) as c FROM orders');
    const totalCount = cnt[0]?.c || 0;

    try { await conn.query('DELETE FROM order_items'); } catch (e) {}
    try { await conn.query('DELETE FROM payments'); } catch (e) {}
    await conn.query('DELETE FROM orders');

    await conn.commit();
    conn.release();
    conn = null;

    try {
      const { logAudit } = require('../utils/auditLogger');
      await logAudit({
        adminId: req.user?.id || 1,
        action: 'CLEAR_ALL_ORDERS',
        targetType: 'Orders',
        details: `Successfully cleared all ${totalCount} customer orders in a single bulk operation.`
      });
    } catch (eAudit) {}

    return res.status(200).json(ApiResponse.success(
      { deletedCount: totalCount },
      `Successfully deleted ${totalCount} orders.`
    ));
  } catch (err) {
    if (conn) {
      try { await conn.rollback(); } catch (eRb) {}
      try { conn.release(); } catch (eRel) {}
    }
    next(err);
  }
};

exports.deleteAllInventory = async (req, res, next) => {
  let conn;
  try {
    conn = await pool.getConnection();
    await conn.beginTransaction();

    const [cnt] = await conn.query('SELECT COUNT(*) as c FROM products');
    const totalCount = cnt[0]?.c || 0;

    await conn.query('UPDATE products SET stock_quantity = 0');
    try { await conn.query('UPDATE product_colors SET stock_quantity = 0'); } catch (e) {}

    await conn.commit();
    conn.release();
    conn = null;

    try {
      const { logAudit } = require('../utils/auditLogger');
      await logAudit({
        adminId: req.user?.id || 1,
        action: 'CLEAR_ALL_INVENTORY',
        targetType: 'Inventory',
        details: `Successfully reset stock levels to 0 across ${totalCount} products.`
      });
    } catch (eAudit) {}

    return res.status(200).json(ApiResponse.success(
      { deletedCount: totalCount },
      `Successfully reset inventory stock levels to 0 across all ${totalCount} products.`
    ));
  } catch (err) {
    if (conn) {
      try { await conn.rollback(); } catch (eRb) {}
      try { conn.release(); } catch (eRel) {}
    }
    next(err);
  }
};

exports.deleteSelectedOrders = async (req, res, next) => {
  let conn;
  try {
    const { ids } = req.body || {};
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json(ApiResponse.error('No order IDs provided for batch deletion'));
    }

    const cleanIds = ids.map(id => String(id).trim()).filter(Boolean);
    if (cleanIds.length === 0) {
      return res.status(400).json(ApiResponse.error('Invalid order IDs'));
    }

    conn = await pool.getConnection();
    await conn.beginTransaction();

    try { await conn.query('DELETE FROM order_items WHERE order_id IN (?)', [cleanIds]); } catch (e) {}
    try { await conn.query('DELETE FROM payments WHERE order_id IN (?)', [cleanIds]); } catch (e) {}

    const [delRes] = await conn.query('DELETE FROM orders WHERE id IN (?)', [cleanIds]);
    const deletedCount = delRes.affectedRows || cleanIds.length;

    await conn.commit();
    conn.release();
    conn = null;

    try {
      const { logAudit } = require('../utils/auditLogger');
      await logAudit({
        adminId: req.user?.id || 1,
        action: 'DELETE_BATCH',
        targetType: 'Orders',
        details: `Deleted ${deletedCount} selected orders.`
      });
    } catch (eAudit) {}

    return res.status(200).json(ApiResponse.success(
      { deletedCount },
      `Successfully deleted ${deletedCount} selected orders.`
    ));
  } catch (err) {
    if (conn) {
      try { await conn.rollback(); } catch (eRb) {}
      try { conn.release(); } catch (eRel) {}
    }
    next(err);
  }
};

exports.deleteSelectedCustomers = async (req, res, next) => {
  let conn;
  try {
    const { ids } = req.body || {};
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json(ApiResponse.error('No customer IDs provided for batch deletion'));
    }

    const cleanIds = ids.map(id => String(id).trim()).filter(Boolean);
    if (cleanIds.length === 0) {
      return res.status(400).json(ApiResponse.error('Invalid customer IDs'));
    }

    conn = await pool.getConnection();
    await conn.beginTransaction();

    try { await conn.query('UPDATE orders SET user_id = NULL WHERE user_id IN (?)', [cleanIds]); } catch (e) {}
    try { await conn.query('DELETE FROM cart WHERE user_id IN (?)', [cleanIds]); } catch (e) {}
    try { await conn.query('DELETE FROM wishlist WHERE user_id IN (?)', [cleanIds]); } catch (e) {}

    const [delRes] = await conn.query('DELETE FROM users WHERE id IN (?)', [cleanIds]);
    const deletedCount = delRes.affectedRows || cleanIds.length;

    await conn.commit();
    conn.release();
    conn = null;

    try {
      const { logAudit } = require('../utils/auditLogger');
      await logAudit({
        adminId: req.user?.id || 1,
        action: 'DELETE_BATCH',
        targetType: 'Customers',
        details: `Deleted ${deletedCount} selected customers.`
      });
    } catch (eAudit) {}

    return res.status(200).json(ApiResponse.success(
      { deletedCount },
      `Successfully deleted ${deletedCount} selected customers.`
    ));
  } catch (err) {
    if (conn) {
      try { await conn.rollback(); } catch (eRb) {}
      try { conn.release(); } catch (eRel) {}
    }
    next(err);
  }
};

exports.deleteProduct = (req, res, next) => {
  const productController = require('./productController');
  return productController.deleteProduct(req, res, next);
};
