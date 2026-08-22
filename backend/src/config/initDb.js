const pool = require('./db');
const bcrypt = require('bcryptjs');

const IMAGE_POOLS = {
  WOMEN: [
    "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800",
    "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=800",
    "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=800",
    "https://images.unsplash.com/photo-1609357605129-26f69add5d6e?w=800",
    "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800",
    "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=800",
    "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=800"
  ],
  MEN: [
    "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800",
    "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800",
    "https://images.unsplash.com/photo-1617137968427-85924c800a22?w=800",
    "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800",
    "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800"
  ],
  "KIDS & BABY": [
    "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800",
    "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=800",
    "https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=800",
    "https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=800",
    "https://images.unsplash.com/photo-1558877385-81a1c7e67d72?w=800"
  ],
  ACCESSORIES: [
    "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800",
    "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800",
    "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800",
    "https://images.unsplash.com/photo-1627123424574-724758594e93?w=800",
    "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800"
  ],
  "KITCHEN & HOME": [
    "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=800",
    "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800",
    "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=800",
    "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800",
    "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800"
  ]
};

const COLORS = ["Royal Blue", "Crimson Red", "Golden Yellow", "Emerald Green", "Pastel Pink", "Classic Black", "Ivory White", "Navy Blue", "Maroon", "Mustard"];
const BRANDS = ["Karviyam Heritage", "Karviyam Premium", "Karviyam Crafts", "Karviyam Luxe", "Karviyam Essentials", "Karviyam Style"];

async function initDb() {
  try {
    // 1. Roles table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS roles (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(50) NOT NULL UNIQUE
      );
    `);

    // 2. Users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        full_name VARCHAR(100) NOT NULL,
        name VARCHAR(100),
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        phone VARCHAR(20),
        address TEXT,
        google_id VARCHAR(255),
        login_provider VARCHAR(50) DEFAULT 'EMAIL',
        profile_photo VARCHAR(500),
        role VARCHAR(50) DEFAULT 'customer',
        status VARCHAR(50) DEFAULT 'Active',
        enabled BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );
    `);

    try { await pool.query(`ALTER TABLE users ADD COLUMN name VARCHAR(100) AFTER full_name`); } catch (e) {}
    try { await pool.query(`ALTER TABLE users ADD COLUMN role VARCHAR(50) DEFAULT 'customer'`); } catch (e) {}
    try { await pool.query(`ALTER TABLE users ADD COLUMN status VARCHAR(50) DEFAULT 'Active'`); } catch (e) {}
    try { await pool.query(`ALTER TABLE users ADD COLUMN enabled BOOLEAN DEFAULT TRUE`); } catch (e) {}
    try { await pool.query(`ALTER TABLE users ADD COLUMN login_provider VARCHAR(50) DEFAULT 'EMAIL'`); } catch (e) {}
    try { await pool.query(`ALTER TABLE users ADD COLUMN profile_photo VARCHAR(500)`); } catch (e) {}

    // 3. User roles join table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_roles (
        user_id BIGINT NOT NULL,
        role_id BIGINT NOT NULL,
        PRIMARY KEY (user_id, role_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
      );
    `);

    // 4. Categories table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        parent_id BIGINT DEFAULT NULL,
        name VARCHAR(100) NOT NULL,
        slug VARCHAR(150),
        type VARCHAR(50),
        description TEXT,
        image_url LONGTEXT,
        icon_url LONGTEXT,
        banner_url LONGTEXT,
        order_index INT DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        seo_title VARCHAR(150),
        meta_description TEXT,
        meta_keywords VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE CASCADE
      );
    `);

    try {
      await pool.query(`ALTER TABLE categories MODIFY COLUMN image_url LONGTEXT`);
      await pool.query(`ALTER TABLE categories MODIFY COLUMN icon_url LONGTEXT`);
      await pool.query(`ALTER TABLE categories MODIFY COLUMN banner_url LONGTEXT`);
    } catch (e) {}

    // 5. Brands table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS brands (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        slug VARCHAR(150),
        logo_url VARCHAR(500),
        description TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 6. Products table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS products (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        category_id BIGINT,
        category_name_str VARCHAR(100),
        subcategory_id BIGINT,
        brand_id BIGINT,
        name VARCHAR(255) NOT NULL,
        sku VARCHAR(100) UNIQUE,
        barcode VARCHAR(100),
        description TEXT,
        price DECIMAL(10,2) NOT NULL,
        old_price DECIMAL(10,2),
        cost_price DECIMAL(10,2),
        discount_percentage DECIMAL(5,2),
        stock_quantity INT DEFAULT 0,
        image_url VARCHAR(500),
        video_url VARCHAR(500),
        type VARCHAR(50) DEFAULT 'General',
        gender VARCHAR(20) DEFAULT 'Unisex',
        brand VARCHAR(100),
        rating DECIMAL(3,2) DEFAULT 4.50,
        is_featured BOOLEAN DEFAULT FALSE,
        is_trending BOOLEAN DEFAULT FALSE,
        is_best_seller BOOLEAN DEFAULT FALSE,
        is_new_arrival BOOLEAN DEFAULT FALSE,
        is_active BOOLEAN DEFAULT TRUE,
        size VARCHAR(100),
        color VARCHAR(100),
        fabric VARCHAR(100),
        fit VARCHAR(50),
        material VARCHAR(100),
        weight DECIMAL(8,2),
        tags VARCHAR(255),
        review TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
        FOREIGN KEY (subcategory_id) REFERENCES categories(id) ON DELETE SET NULL,
        FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE SET NULL
      );
    `);

    // 7. Product Images table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS product_images (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        product_id BIGINT NOT NULL,
        image_url VARCHAR(500) NOT NULL,
        is_main BOOLEAN DEFAULT FALSE,
        sort_order INT DEFAULT 0,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
      );
    `);

    // 8. Product Colors & Product Color Images tables
    await pool.query(`
      CREATE TABLE IF NOT EXISTS product_colors (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        product_id BIGINT NOT NULL,
        color_name VARCHAR(100),
        color_code VARCHAR(50),
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
      );
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS product_color_images (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        color_id BIGINT NOT NULL,
        image_url VARCHAR(500),
        FOREIGN KEY (color_id) REFERENCES product_colors(id) ON DELETE CASCADE
      );
    `);

    // 9. Cart & Cart Items
    await pool.query(`
      CREATE TABLE IF NOT EXISTS cart (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        user_id BIGINT UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS cart_items (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        cart_id BIGINT NOT NULL,
        product_id BIGINT NOT NULL,
        quantity INT DEFAULT 1,
        selected_size VARCHAR(50),
        selected_color VARCHAR(50),
        added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (cart_id) REFERENCES cart(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
      );
    `);

    // 10. Wishlist table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS wishlist (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        user_id BIGINT NOT NULL,
        product_id BIGINT NOT NULL,
        added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
      );
    `);

    // 11. Orders & Order Items
    await pool.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        user_id BIGINT NOT NULL,
        total_amount DECIMAL(10,2) NOT NULL,
        discount_amount DECIMAL(10,2) DEFAULT 0,
        shipping_cost DECIMAL(10,2) DEFAULT 0,
        status VARCHAR(50) DEFAULT 'Pending',
        payment_method VARCHAR(50),
        payment_status VARCHAR(50) DEFAULT 'Pending',
        full_name VARCHAR(100),
        email VARCHAR(100),
        phone VARCHAR(20),
        address TEXT,
        city VARCHAR(100),
        state VARCHAR(100),
        pincode VARCHAR(20),
        country VARCHAR(100) DEFAULT 'India',
        tracking_number VARCHAR(100),
        coupon_code VARCHAR(50),
        order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS order_items (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        order_id BIGINT NOT NULL,
        product_id BIGINT,
        product_name VARCHAR(255),
        product_sku VARCHAR(100),
        product_image VARCHAR(500),
        quantity INT NOT NULL,
        price_at_time DECIMAL(10,2) NOT NULL,
        selected_size VARCHAR(50),
        selected_color VARCHAR(50),
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
      );
    `);

    // 12. Payments table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS payments (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        order_id BIGINT NOT NULL,
        transaction_id VARCHAR(100) NOT NULL,
        payment_method VARCHAR(50),
        amount DECIMAL(10,2) NOT NULL,
        payment_status VARCHAR(50) DEFAULT 'Pending',
        razorpay_payment_id VARCHAR(100),
        razorpay_order_id VARCHAR(100),
        razorpay_signature VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
      );
    `);

    // 13. Addresses table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS addresses (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        user_id BIGINT NOT NULL,
        full_name VARCHAR(100),
        phone VARCHAR(20),
        street_address TEXT,
        city VARCHAR(100),
        state VARCHAR(100),
        pincode VARCHAR(20),
        country VARCHAR(100) DEFAULT 'India',
        is_default BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `);

    // 14. Coupons table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS coupons (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        code VARCHAR(50) UNIQUE NOT NULL,
        discount_type VARCHAR(20) DEFAULT 'PERCENTAGE',
        discount_value DECIMAL(10,2) NOT NULL,
        min_order_amount DECIMAL(10,2) DEFAULT 0,
        active BOOLEAN DEFAULT TRUE,
        expiration_date DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 15. Reviews table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS reviews (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        product_id BIGINT NOT NULL,
        user_id BIGINT NOT NULL,
        user_name VARCHAR(100),
        rating INT NOT NULL,
        comment TEXT,
        status VARCHAR(50) DEFAULT 'Pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `);

    // 16. Notifications table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        user_id BIGINT NOT NULL,
        title VARCHAR(255),
        message TEXT NOT NULL,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `);

    // 17. Home Banners table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS home_banners (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255),
        subtitle VARCHAR(255),
        image_url LONGTEXT,
        image_path LONGTEXT,
        button_text VARCHAR(100),
        button_link VARCHAR(255),
        link VARCHAR(255),
        is_active BOOLEAN DEFAULT TRUE,
        status VARCHAR(50) DEFAULT 'active',
        sort_order INT DEFAULT 0,
        display_order INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    try { await pool.query(`ALTER TABLE home_banners ADD COLUMN image_path LONGTEXT`); } catch (e) {}
    try { await pool.query(`ALTER TABLE home_banners ADD COLUMN link VARCHAR(255)`); } catch (e) {}
    try { await pool.query(`ALTER TABLE home_banners ADD COLUMN status VARCHAR(50) DEFAULT 'active'`); } catch (e) {}
    try { await pool.query(`ALTER TABLE home_banners ADD COLUMN display_order INT DEFAULT 0`); } catch (e) {}
    try { await pool.query(`ALTER TABLE home_banners MODIFY COLUMN image_url LONGTEXT`); } catch (e) {}
    try { await pool.query(`ALTER TABLE home_banners MODIFY COLUMN image_path LONGTEXT`); } catch (e) {}

    // 18. Contact Messages table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS contact_messages (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) NOT NULL,
        phone VARCHAR(20),
        subject VARCHAR(255),
        message TEXT NOT NULL,
        status VARCHAR(20) DEFAULT 'NEW',
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 18b. Support Conversations table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS support_conversations (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        customer_name VARCHAR(100) NOT NULL,
        customer_email VARCHAR(150) NOT NULL,
        subject VARCHAR(255) DEFAULT 'General Support Inquiry',
        status VARCHAR(20) DEFAULT 'NEW',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );
    `);

    // 18c. Support Messages table (Chronological Thread Messages)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS support_messages (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        conversation_id BIGINT NOT NULL,
        sender_type VARCHAR(20) NOT NULL,
        sender_email VARCHAR(150) NOT NULL,
        message TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (conversation_id) REFERENCES support_conversations(id) ON DELETE CASCADE
      );
    `);


    // 19. General Settings table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS settings (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        setting_key VARCHAR(100) UNIQUE NOT NULL,
        setting_value TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );
    `);

    // 19b. Company Settings table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS company_settings (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        company_display_name VARCHAR(255),
        legal_company_name VARCHAR(255),
        gst_number VARCHAR(100),
        pan_number VARCHAR(100),
        cin_number VARCHAR(100),
        state VARCHAR(100),
        state_code VARCHAR(50),
        registered_address TEXT,
        warehouse_address TEXT,
        support_email VARCHAR(100),
        support_phone VARCHAR(50),
        website VARCHAR(255),
        authorized_signatory VARCHAR(100),
        designation VARCHAR(100),
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );
    `);

    // 20. Deliverable Locations table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS deliverable_locations (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        pincode VARCHAR(20) UNIQUE NOT NULL,
        city VARCHAR(100),
        state VARCHAR(100),
        is_active BOOLEAN DEFAULT TRUE
      );
    `);

    // 21. Audit Logs table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        user_id BIGINT,
        user_email VARCHAR(100),
        action VARCHAR(100),
        details TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Seed Roles
    const rolesList = ['ROLE_USER', 'ROLE_ADMIN', 'ROLE_MANAGER'];
    for (const r of rolesList) {
      await pool.query(`INSERT IGNORE INTO roles (name) VALUES (?)`, [r]);
    }

    // Get Role IDs
    const [rolesRows] = await pool.query(`SELECT id, name FROM roles`);
    const roleMap = {};
    rolesRows.forEach(r => roleMap[r.name] = r.id);

    // Seed/Ensure Admin Account: admin@karviyam.com
    const adminEmail = 'admin@karviyam.com';
    const adminPasswordHash = bcrypt.hashSync('Karviyam#2026!', 10);

    const [adminCheck] = await pool.query(`SELECT id FROM users WHERE LOWER(email) = LOWER(?)`, [adminEmail]);
    let adminId;
    if (adminCheck.length === 0) {
      const [res] = await pool.query(
        `INSERT INTO users (full_name, name, email, password, phone, address, role, status, enabled) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        ['Administrator', 'Administrator', adminEmail, adminPasswordHash, '+91 9876543210', 'Karviyam HQ, Chennai', 'admin', 'Active', true]
      );
      adminId = res.insertId;
    } else {
      adminId = adminCheck[0].id;
      await pool.query(
        `UPDATE users SET full_name = 'Administrator', password = ?, role = 'admin', status = 'Active', enabled = true WHERE id = ?`,
        [adminPasswordHash, adminId]
      );
    }

    // Attach ROLE_ADMIN & ROLE_USER to admin user
    if (roleMap['ROLE_ADMIN']) {
      await pool.query(`INSERT IGNORE INTO user_roles (user_id, role_id) VALUES (?, ?)`, [adminId, roleMap['ROLE_ADMIN']]);
    }
    if (roleMap['ROLE_USER']) {
      await pool.query(`INSERT IGNORE INTO user_roles (user_id, role_id) VALUES (?, ?)`, [adminId, roleMap['ROLE_USER']]);
    }

    // Demote any non-admin email that has ROLE_ADMIN
    if (roleMap['ROLE_ADMIN']) {
      await pool.query(
        `DELETE FROM user_roles WHERE role_id = ? AND user_id != ?`,
        [roleMap['ROLE_ADMIN'], adminId]
      );
    }

    // Seed Banners if empty
    const [bannersCount] = await pool.query(`SELECT COUNT(*) as count FROM home_banners`);
    if (bannersCount[0].count === 0) {
      await pool.query(`
        INSERT INTO home_banners (title, subtitle, image_url, button_text, button_link, is_active, sort_order)
        VALUES
        ('Royal Heritage Collection', 'Handcrafted Silk Sarees & Ethnic Elegance', 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=1600', 'Shop Sarees', '/shop?category=Sarees', true, 1),
        ('Festive Menswear Edition', 'Designer Kurtas, Sherwanis & Linen Suits', 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=1600', 'Explore Menswear', '/shop?category=Kurtas', true, 2),
        ('Artisanal Jewellery', 'Traditional Gold & Antique Statement Pieces', 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=1600', 'Shop Jewellery', '/shop?category=Jewellery', true, 3);
      `);
    }

    // Seed Coupons if empty
    const [couponsCount] = await pool.query(`SELECT COUNT(*) as count FROM coupons`);
    if (couponsCount[0].count === 0) {
      await pool.query(`
        INSERT INTO coupons (code, discount_type, discount_value, min_order_amount, active)
        VALUES
        ('KARVIYAM10', 'PERCENTAGE', 10.00, 499.00, true),
        ('WELCOME200', 'FIXED', 200.00, 999.00, true),
        ('FESTIVE20', 'PERCENTAGE', 20.00, 1999.00, true);
      `);
    }

    // Seed Categories if empty
    const [catCount] = await pool.query(`SELECT COUNT(*) as count FROM categories`);
    if (catCount[0].count === 0) {
      // Main categories
      const categoriesSeed = [
        { name: 'WOMEN', type: 'WOMEN', image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800', sub: ['Sarees', 'Lehengas', 'Salwar Suits', 'Kurtis & Tops', 'Western Wear'] },
        { name: 'MEN', type: 'MEN', image: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800', sub: ['Kurtas & Pyjamas', 'Sherwanis', 'Shirts & Trousers', 'Ethnic Jackets'] },
        { name: 'KIDS & BABY', type: 'KIDS & BABY', image: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800', sub: ['Boys Ethnic', 'Girls Dresses', 'Baby Wear'] },
        { name: 'ACCESSORIES', type: 'ACCESSORIES', image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800', sub: ['Jewellery', 'Bags & Clutches', 'Footwear', 'Dupattas & Shawls'] },
        { name: 'KITCHEN & HOME', type: 'KITCHEN & HOME', image: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=800', sub: ['Traditional Cookware', 'Home Decor', 'Dining & Serving'] }
      ];

      for (let idx = 0; idx < categoriesSeed.length; idx++) {
        const cat = categoriesSeed[idx];
        const slug = cat.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        const [res] = await pool.query(
          `INSERT INTO categories (name, slug, type, image_url, order_index, is_active) VALUES (?, ?, ?, ?, ?, true)`,
          [cat.name, slug, cat.type, cat.image, idx + 1]
        );
        const parentId = res.insertId;

        for (let subIdx = 0; subIdx < cat.sub.length; subIdx++) {
          const subName = cat.sub[subIdx];
          const subSlug = subName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
          await pool.query(
            `INSERT INTO categories (parent_id, name, slug, type, order_index, is_active) VALUES (?, ?, ?, ?, ?, true)`,
            [parentId, subName, subSlug, cat.type, subIdx + 1]
          );
        }
      }
    }

    // Seed Products if empty
    const [prodCount] = await pool.query(`SELECT COUNT(*) as count FROM products`);
    if (prodCount[0].count === 0) {
      await seedSampleProducts();
    }

    console.log('[DB Init] Database schema & default seed data synchronized successfully.');
  } catch (error) {
    if (error && (error.code === 'ECONNREFUSED' || error.message.includes('ECONNREFUSED'))) {
      console.warn('[DB Init Warning] MySQL server is not accessible on localhost:3306 right now. Start MySQL/XAMPP or Docker to initialize database tables.');
    } else {
      console.error('[DB Init Error]', error);
    }
  }
}

async function seedSampleProducts() {
  const [categories] = await pool.query(`SELECT * FROM categories WHERE parent_id IS NOT NULL`);
  if (categories.length === 0) return;

  const [parents] = await pool.query(`SELECT * FROM categories WHERE parent_id IS NULL`);
  const parentMap = {};
  parents.forEach(p => parentMap[p.id] = p);

  let pIndex = 1;
  for (const cat of categories) {
    const parentCat = parentMap[cat.parent_id] || cat;
    const rootName = parentCat.name.toUpperCase();
    const poolList = IMAGE_POOLS[rootName] || IMAGE_POOLS.WOMEN;

    for (let i = 1; i <= 3; i++) {
      const name = `${cat.name} Edition ${i}`;
      const sku = `KV-${cat.name.substring(0, 3).toUpperCase()}-${String(100 + pIndex)}`;
      const price = 899 + (pIndex * 150) % 3000;
      const oldPrice = Math.round(price * 1.3);
      const discount = Math.round(((oldPrice - price) / oldPrice) * 100);
      const primaryImage = poolList[pIndex % poolList.length];
      const color = COLORS[pIndex % COLORS.length];
      const brand = BRANDS[pIndex % BRANDS.length];
      const gender = rootName === 'WOMEN' ? 'Women' : rootName === 'MEN' ? 'Men' : rootName === 'KIDS & BABY' ? 'Kids' : 'Unisex';

      const [prodRes] = await pool.query(`
        INSERT INTO products (
          category_id, subcategory_id, category_name_str, brand, name, sku, barcode, description, price, old_price, discount_percentage,
          stock_quantity, image_url, type, gender, rating, is_featured, is_trending, is_best_seller, is_new_arrival, is_active,
          size, color, material, fabric, tags
        ) VALUES (
          ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 4.5, ?, ?, ?, ?, true, 'M, L, XL', ?, 'Organic Cotton & Blends', 'Silk Blends', ?
        )
      `, [
        parentCat.id, cat.id, parentCat.name, brand, name, sku, `89000${100000 + pIndex}`,
        `Premium handcrafted ${name} made with exquisite fabric and traditional artistry.`,
        price, oldPrice, discount, 45, primaryImage, rootName, gender,
        pIndex % 2 === 0, pIndex % 3 === 0, pIndex % 4 === 0, pIndex % 2 === 1,
        color, `${cat.name.toLowerCase()}, ${rootName.toLowerCase()}, ethnic, designer`
      ]);

      const productId = prodRes.insertId;

      for (let imgIdx = 0; imgIdx < 3; imgIdx++) {
        const detailImg = poolList[(pIndex + imgIdx) % poolList.length];
        await pool.query(
          `INSERT INTO product_images (product_id, image_url, is_main, sort_order) VALUES (?, ?, ?, ?)`,
          [productId, detailImg, imgIdx === 0, imgIdx]
        );
      }

      pIndex++;
    }
  }
}

module.exports = initDb;
