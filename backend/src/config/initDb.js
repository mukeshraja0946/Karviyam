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
        sort_order INT DEFAULT 0,
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
      await pool.query(`ALTER TABLE categories ADD COLUMN IF NOT EXISTS sort_order INT DEFAULT 0`);
      await pool.query(`ALTER TABLE categories MODIFY COLUMN image_url LONGTEXT`);
      await pool.query(`ALTER TABLE categories MODIFY COLUMN icon_url LONGTEXT`);
      await pool.query(`ALTER TABLE categories MODIFY COLUMN banner_url LONGTEXT`);
    } catch (e) {
      try { await pool.query(`ALTER TABLE categories ADD COLUMN sort_order INT DEFAULT 0`); } catch (e2) {}
    }

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

    try {
      await pool.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS category_name_str VARCHAR(100)`);
      await pool.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS sizes VARCHAR(255)`);
      await pool.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS is_bestseller BOOLEAN DEFAULT FALSE`);
      await pool.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS seo_title VARCHAR(255)`);
      await pool.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS meta_keywords VARCHAR(255)`);
      await pool.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS meta_description TEXT`);
    } catch (e) {
      try { await pool.query(`ALTER TABLE products ADD COLUMN category_name_str VARCHAR(100)`); } catch (e2) {}
      try { await pool.query(`ALTER TABLE products ADD COLUMN sizes VARCHAR(255)`); } catch (e2) {}
      try { await pool.query(`ALTER TABLE products ADD COLUMN seo_title VARCHAR(255)`); } catch (e2) {}
    }

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

    // 7. Product Selling Types table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS product_selling_types (
        id INT AUTO_INCREMENT PRIMARY KEY,
        product_id INT NOT NULL,
        selling_type VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uq_prod_type (product_id, selling_type),
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
      );
    `);

    // Auto-migrate existing product flags to product_selling_types if empty
    try {
      const [stCheck] = await pool.query('SELECT COUNT(*) as cnt FROM product_selling_types');
      if (stCheck[0]?.cnt === 0) {
        const [allProds] = await pool.query('SELECT id, is_best_seller, is_new_arrival, is_trending, price, old_price, discount_percentage FROM products');
        for (const p of allProds) {
          if (p.is_best_seller) {
            await pool.query('INSERT IGNORE INTO product_selling_types (product_id, selling_type) VALUES (?, ?)', [p.id, 'BEST_SELLERS']);
          }
          if (p.is_new_arrival) {
            await pool.query('INSERT IGNORE INTO product_selling_types (product_id, selling_type) VALUES (?, ?)', [p.id, 'NEW_ARRIVALS']);
          }
          if (p.is_trending) {
            await pool.query('INSERT IGNORE INTO product_selling_types (product_id, selling_type) VALUES (?, ?)', [p.id, 'TRENDING_NOW']);
          }
          if ((p.old_price && parseFloat(p.old_price) > parseFloat(p.price)) || (p.discount_percentage && parseFloat(p.discount_percentage) > 0)) {
            await pool.query('INSERT IGNORE INTO product_selling_types (product_id, selling_type) VALUES (?, ?)', [p.id, 'TOP_OFFERS']);
          }
        }
      }
    } catch (eMig) {}

    // 7b. Bank Account Settings table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS bank_account_settings (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        account_holder_name VARCHAR(255),
        bank_name VARCHAR(255),
        account_number VARCHAR(255),
        ifsc_code VARCHAR(100),
        branch_name VARCHAR(255),
        upi_id VARCHAR(255),
        account_type VARCHAR(50) DEFAULT 'Current',
        payment_instructions TEXT,
        enabled BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );
    `);

    // 8. Product Colors & Product Color Images tables
    await pool.query(`
      CREATE TABLE IF NOT EXISTS product_colors (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        product_id BIGINT NOT NULL,
        color_name VARCHAR(100),
        color_code VARCHAR(50),
        hex_code VARCHAR(50),
        is_default BOOLEAN DEFAULT FALSE,
        image_url VARCHAR(500),
        main_image VARCHAR(500),
        video_url VARCHAR(500),
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
      );
    `);

    try {
      await pool.query("ALTER TABLE product_colors ADD COLUMN IF NOT EXISTS hex_code VARCHAR(50)");
      await pool.query("ALTER TABLE product_colors ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT FALSE");
      await pool.query("ALTER TABLE product_colors ADD COLUMN IF NOT EXISTS image_url VARCHAR(500)");
      await pool.query("ALTER TABLE product_colors ADD COLUMN IF NOT EXISTS main_image VARCHAR(500)");
      await pool.query("ALTER TABLE product_colors ADD COLUMN IF NOT EXISTS video_url VARCHAR(500)");
    } catch (e) {
      try { await pool.query("ALTER TABLE product_colors ADD COLUMN hex_code VARCHAR(50)"); } catch (e2) {}
      try { await pool.query("ALTER TABLE product_colors ADD COLUMN is_default BOOLEAN DEFAULT FALSE"); } catch (e2) {}
      try { await pool.query("ALTER TABLE product_colors ADD COLUMN image_url VARCHAR(500)"); } catch (e2) {}
      try { await pool.query("ALTER TABLE product_colors ADD COLUMN main_image VARCHAR(500)"); } catch (e2) {}
    }
    await pool.query(`
      CREATE TABLE IF NOT EXISTS product_color_images (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        color_id BIGINT,
        product_color_id BIGINT,
        image_url VARCHAR(500),
        is_main BOOLEAN DEFAULT FALSE,
        sort_order INT DEFAULT 0
      );
    `);

    try {
      await pool.query("ALTER TABLE product_color_images ADD COLUMN IF NOT EXISTS product_color_id BIGINT");
      await pool.query("ALTER TABLE product_color_images ADD COLUMN IF NOT EXISTS is_main BOOLEAN DEFAULT FALSE");
      await pool.query("ALTER TABLE product_color_images ADD COLUMN IF NOT EXISTS sort_order INT DEFAULT 0");
    } catch (e) {
      try { await pool.query("ALTER TABLE product_color_images ADD COLUMN product_color_id BIGINT"); } catch (e2) {}
      try { await pool.query("ALTER TABLE product_color_images ADD COLUMN is_main BOOLEAN DEFAULT FALSE"); } catch (e2) {}
      try { await pool.query("ALTER TABLE product_color_images ADD COLUMN sort_order INT DEFAULT 0"); } catch (e2) {}
    }

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

    try { await pool.query(`ALTER TABLE payments MODIFY COLUMN order_id BIGINT NULL`); } catch (e) {}
    try { await pool.query(`ALTER TABLE payments ADD COLUMN subscription_id BIGINT DEFAULT NULL`); } catch (e) {}
    try { await pool.query(`ALTER TABLE payments ADD COLUMN razorpay_order_id VARCHAR(100) DEFAULT NULL`); } catch (e) {}
    try { await pool.query(`ALTER TABLE payments ADD COLUMN razorpay_payment_id VARCHAR(100) DEFAULT NULL`); } catch (e) {}
    try { await pool.query(`ALTER TABLE payments ADD COLUMN razorpay_signature VARCHAR(255) DEFAULT NULL`); } catch (e) {}
    try { await pool.query(`ALTER TABLE payments ADD COLUMN upi_vpa VARCHAR(255) DEFAULT NULL`); } catch (e) {}
    try { await pool.query(`ALTER TABLE payments ADD COLUMN amount_received DECIMAL(10,2) DEFAULT 0.00`); } catch (e) {}
    try { await pool.query(`ALTER TABLE payments ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`); } catch (e) {}

    // 13. Addresses table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS addresses (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        user_id BIGINT NOT NULL,
        full_name VARCHAR(100),
        phone VARCHAR(20),
        alternate_phone VARCHAR(20),
        house_flat_no VARCHAR(255),
        street_address TEXT,
        area VARCHAR(255),
        landmark VARCHAR(255),
        city VARCHAR(100),
        district VARCHAR(100),
        state VARCHAR(100),
        pincode VARCHAR(20),
        country VARCHAR(100) DEFAULT 'India',
        address_type VARCHAR(50) DEFAULT 'HOME',
        is_default BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `);

    try { await pool.query(`ALTER TABLE addresses ADD COLUMN alternate_phone VARCHAR(20)`); } catch (e) {}
    try { await pool.query(`ALTER TABLE addresses ADD COLUMN house_flat_no VARCHAR(255)`); } catch (e) {}
    try { await pool.query(`ALTER TABLE addresses ADD COLUMN area VARCHAR(255)`); } catch (e) {}
    try { await pool.query(`ALTER TABLE addresses ADD COLUMN landmark VARCHAR(255)`); } catch (e) {}
    try { await pool.query(`ALTER TABLE addresses ADD COLUMN district VARCHAR(100)`); } catch (e) {}
    try { await pool.query(`ALTER TABLE addresses ADD COLUMN address_type VARCHAR(50) DEFAULT 'HOME'`); } catch (e) {}

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
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS reviews (
          id BIGINT AUTO_INCREMENT PRIMARY KEY,
          product_id BIGINT NOT NULL,
          user_id BIGINT NOT NULL,
          user_name VARCHAR(100),
          title VARCHAR(255),
          rating INT NOT NULL,
          comment TEXT,
          images LONGTEXT,
          verified_purchase BOOLEAN DEFAULT FALSE,
          helpful_count INT DEFAULT 0,
          reported BOOLEAN DEFAULT FALSE,
          order_id BIGINT DEFAULT NULL,
          status VARCHAR(50) DEFAULT 'Approved',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_reviews_product_id (product_id),
          INDEX idx_reviews_user_id (user_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);
      try {
        await pool.query(`
          ALTER TABLE reviews 
          ADD CONSTRAINT fk_reviews_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
        `);
      } catch (eFk1) {}
      try {
        await pool.query(`
          ALTER TABLE reviews 
          ADD CONSTRAINT fk_reviews_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        `);
      } catch (eFk2) {}
    } catch (eRev) {
      console.warn('⚠️ reviews table init warning:', eRev.message);
    }

    try { await pool.query(`ALTER TABLE reviews ADD COLUMN title VARCHAR(255)`); } catch (e) {}
    try { await pool.query(`ALTER TABLE reviews ADD COLUMN images LONGTEXT`); } catch (e) {}
    try { await pool.query(`ALTER TABLE reviews ADD COLUMN verified_purchase BOOLEAN DEFAULT FALSE`); } catch (e) {}
    try { await pool.query(`ALTER TABLE reviews ADD COLUMN helpful_count INT DEFAULT 0`); } catch (e) {}
    try { await pool.query(`ALTER TABLE reviews ADD COLUMN reported BOOLEAN DEFAULT FALSE`); } catch (e) {}
    try { await pool.query(`ALTER TABLE reviews ADD COLUMN order_id BIGINT DEFAULT NULL`); } catch (e) {}

    // 15b. Review Helpful Votes table
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS review_helpful_votes (
          id BIGINT AUTO_INCREMENT PRIMARY KEY,
          review_id BIGINT NOT NULL,
          user_id BIGINT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE KEY unique_user_review_vote (review_id, user_id),
          INDEX idx_rhv_review_id (review_id),
          INDEX idx_rhv_user_id (user_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);
      try {
        await pool.query(`
          ALTER TABLE review_helpful_votes 
          ADD CONSTRAINT fk_rhv_review FOREIGN KEY (review_id) REFERENCES reviews(id) ON DELETE CASCADE
        `);
      } catch (eFk1) {}
      try {
        await pool.query(`
          ALTER TABLE review_helpful_votes 
          ADD CONSTRAINT fk_rhv_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        `);
      } catch (eFk2) {}
    } catch (eRhv) {
      console.warn('⚠️ review_helpful_votes table init warning:', eRhv.message);
    }

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

    // 18d. Parent / Main Categories table (Homepage Top Categories)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS parent_categories (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        category_id BIGINT DEFAULT NULL,
        name VARCHAR(100) NOT NULL,
        image_url LONGTEXT NOT NULL,
        display_order INT DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        link VARCHAR(255) DEFAULT '/shop',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );
    `);

    try {
      const [existing] = await pool.query('SELECT COUNT(*) as count FROM parent_categories');
      if (!existing || existing[0].count === 0) {
        const defaultParentCats = [
          { name: 'T-SHIRTS', image_url: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=400', display_order: 1, link: '/shop?category=T-Shirts' },
          { name: 'SNEAKERS', image_url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400', display_order: 2, link: '/shop?category=Sneakers' },
          { name: 'KURTA SETS', image_url: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=400', display_order: 3, link: '/shop?category=Kurta-Sets' },
          { name: 'WOMEN', image_url: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=400', display_order: 4, link: '/shop?category=Women' },
          { name: 'MEN', image_url: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=400', display_order: 5, link: '/shop?category=Men' },
          { name: 'KIDS & BABY', image_url: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=400', display_order: 6, link: '/shop?category=Kids' },
          { name: 'UNISEX', image_url: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=400', display_order: 7, link: '/shop?category=Unisex' }
        ];

        for (const cat of defaultParentCats) {
          await pool.query(
            `INSERT INTO parent_categories (name, image_url, display_order, is_active, link) VALUES (?, ?, ?, 1, ?)`,
            [cat.name, cat.image_url, cat.display_order, cat.link]
          );
        }
        console.log('[initDb] Seeded default parent categories for Homepage Top Categories');
      }
    } catch (errSeed) {
      console.error('[initDb] Error seeding default parent categories:', errSeed);
    }
    // 18e. Promotional Cards table (Sidebar Promotions)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS promo_cards (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255),
        subtitle VARCHAR(255),
        image_url LONGTEXT NOT NULL,
        display_order INT DEFAULT 1,
        is_active BOOLEAN DEFAULT TRUE,
        link VARCHAR(255) DEFAULT '/shop',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );
    `);

    try {
      const [existingPromo] = await pool.query('SELECT COUNT(*) as count FROM promo_cards');
      if (!existingPromo || existingPromo[0].count === 0) {
        const defaultPromos = [
          {
            title: 'FESTIVE SPECIAL',
            subtitle: 'UP TO 60% OFF On Bestsellers',
            image_url: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600',
            display_order: 1,
            link: '/shop?filter=bestsellers'
          }
        ];
        for (const p of defaultPromos) {
          await pool.query(
            `INSERT INTO promo_cards (title, subtitle, image_url, display_order, is_active, link) VALUES (?, ?, ?, ?, 1, ?)`,
            [p.title, p.subtitle, p.image_url, p.display_order, p.link]
          );
        }
        console.log('[initDb] Seeded default promotional card for Homepage Sidebar');
      }
    } catch (errPromo) {
      console.error('[initDb] Error seeding default promo cards:', errPromo);
    }


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

    // Exclusive Admin Account: vanakkam@karviyam.com
    const adminEmail = 'vanakkam@karviyam.com';
    const defaultAdminPass = 'Karviyam@2026';
    const defaultAdminHash = bcrypt.hashSync(defaultAdminPass, 10);

    const [adminCheck] = await pool.query(`SELECT id, password FROM users WHERE LOWER(email) = LOWER(?)`, [adminEmail]);
    let adminId;
    if (adminCheck.length === 0) {
      const [res] = await pool.query(
        `INSERT INTO users (full_name, name, email, password, phone, address, role, status, enabled) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        ['Karviyam Admin', 'Karviyam Admin', adminEmail, defaultAdminHash, '+91 9876543210', 'Karviyam HQ, Chennai', 'admin', 'Active', true]
      );
      adminId = res.insertId;
    } else {
      adminId = adminCheck[0].id;
      const existingHash = adminCheck[0].password;
      let passToKeep = defaultAdminHash;

      if (existingHash && String(existingHash).length > 10) {
        try {
          const formatted = existingHash.replace(/^\$2y\$/, '$2a$');
          if (bcrypt.compareSync('Karviyam@2026', formatted) || bcrypt.compareSync('Karviyam@2006', formatted) || bcrypt.compareSync('Karviyam#2026!', formatted)) {
            passToKeep = existingHash;
          } else {
            passToKeep = defaultAdminHash;
          }
        } catch (e) {
          passToKeep = defaultAdminHash;
        }
      }

      await pool.query(
        `UPDATE users SET role = 'admin', status = 'Active', enabled = true WHERE id = ?`,
        [adminId]
      );
    }

    try {
      await pool.query(
        `INSERT INTO admin (username, email, password) VALUES ('vanakkam', ?, ?) ON DUPLICATE KEY UPDATE password = ?`,
        [adminEmail, defaultAdminHash, defaultAdminHash]
      );
    } catch (eAdminTable) {}

    // Attach ROLE_ADMIN & ROLE_USER to admin user
    if (roleMap['ROLE_ADMIN']) {
      await pool.query(`INSERT IGNORE INTO user_roles (user_id, role_id) VALUES (?, ?)`, [adminId, roleMap['ROLE_ADMIN']]);
    }
    if (roleMap['ROLE_USER']) {
      await pool.query(`INSERT IGNORE INTO user_roles (user_id, role_id) VALUES (?, ?)`, [adminId, roleMap['ROLE_USER']]);
    }

    // Demote/remove any non-admin email that has ROLE_ADMIN
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
    try {
      const [prodCount] = await pool.query(`SELECT COUNT(*) as count FROM products`);
      if (prodCount && prodCount[0] && prodCount[0].count === 0) {
        await seedSampleProducts();
      }
    } catch (errProdCount) {
      console.warn('⚠️ Product seed count warning:', errProdCount.message);
    }

    // Initialize Shop Filters, Wishlist Uniqueness, and Notification Schema
    await initShopFiltersAndNotificationsSchema();

    console.log('[DB Init] Database schema & default seed data synchronized successfully.');
  } catch (error) {
    if (error && (error.code === 'ECONNREFUSED' || error.message.includes('ECONNREFUSED'))) {
      console.warn('[DB Init Warning] MySQL server is not accessible on localhost:3306 right now. Start MySQL/XAMPP or Docker to initialize database tables.');
    } else {
      console.error('[DB Init Error]', error);
    }
  }
}

async function initShopFiltersAndNotificationsSchema() {
  try {
    // 1. Shop Filter Sections Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS shop_filter_sections (
        id INT AUTO_INCREMENT PRIMARY KEY,
        section_key VARCHAR(50) NOT NULL UNIQUE,
        title VARCHAR(100) NOT NULL,
        is_enabled TINYINT(1) DEFAULT 1,
        display_order INT DEFAULT 0,
        display_limit INT DEFAULT 5,
        enable_show_more TINYINT(1) DEFAULT 1,
        show_more_limit INT DEFAULT 10,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );
    `);

    // 2. Shop Filter Options Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS shop_filter_options (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        section_key VARCHAR(50) NOT NULL,
        option_key VARCHAR(100) NOT NULL,
        label VARCHAR(100) NOT NULL,
        min_price DECIMAL(10,2) NULL,
        max_price DECIMAL(10,2) NULL,
        color_hex VARCHAR(50) NULL,
        is_enabled TINYINT(1) DEFAULT 1,
        display_order INT DEFAULT 0,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );
    `);

    // Seed default sections if empty
    const [secRows] = await pool.query('SELECT COUNT(*) as count FROM shop_filter_sections');
    if (secRows && secRows[0] && secRows[0].count === 0) {
      const defaultSections = [
        ['category', 'Category', 1, 1, 5, 1, 10],
        ['brand', 'Brand', 1, 2, 5, 1, 10],
        ['price', 'Price Range', 1, 3, 5, 0, 10],
        ['size', 'Size', 1, 4, 5, 0, 10],
        ['colour', 'Colour', 1, 5, 7, 0, 10],
        ['availability', 'Availability', 1, 6, 5, 0, 10]
      ];
      for (const s of defaultSections) {
        await pool.query(
          `INSERT INTO shop_filter_sections (section_key, title, is_enabled, display_order, display_limit, enable_show_more, show_more_limit)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          s
        );
      }
    }

    // Seed default options if empty
    const [optRows] = await pool.query('SELECT COUNT(*) as count FROM shop_filter_options');
    if (optRows && optRows[0] && optRows[0].count === 0) {
      // Price Ranges
      const priceOptions = [
        ['price', 'under_499', 'Under ₹499', 0, 499, null, 1, 1],
        ['price', '500_999', '₹500 – ₹999', 500, 999, null, 1, 2],
        ['price', '1000_1999', '₹1,000 – ₹1,999', 1000, 1999, null, 1, 3],
        ['price', '2000_2999', '₹2,000 – ₹2,999', 2000, 2999, null, 1, 4],
        ['price', 'above_3000', 'Above ₹3,000', 3000, 999999, null, 1, 5]
      ];
      for (const p of priceOptions) {
        await pool.query(
          `INSERT INTO shop_filter_options (section_key, option_key, label, min_price, max_price, color_hex, is_enabled, display_order)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          p
        );
      }

      // Sizes
      const sizes = ['S', 'M', 'L', 'XL', 'XXL'];
      let szOrder = 1;
      for (const sz of sizes) {
        await pool.query(
          `INSERT INTO shop_filter_options (section_key, option_key, label, is_enabled, display_order)
           VALUES ('size', ?, ?, 1, ?)`,
          [sz.toLowerCase(), sz, szOrder++]
        );
      }

      // Colors
      const colors = [
        ['black', 'Black', '#000000'],
        ['white', 'White', '#FFFFFF'],
        ['red', 'Red', '#B71C1C'],
        ['blue', 'Blue', '#1D4ED8'],
        ['green', 'Green', '#15803D'],
        ['beige', 'Beige', '#F5F5DC'],
        ['brown', 'Brown', '#78350F']
      ];
      let colOrder = 1;
      for (const c of colors) {
        await pool.query(
          `INSERT INTO shop_filter_options (section_key, option_key, label, color_hex, is_enabled, display_order)
           VALUES ('colour', ?, ?, ?, 1, ?)`,
          [c[0], c[1], c[2], colOrder++]
        );
      }

      // Availability
      await pool.query(
        `INSERT INTO shop_filter_options (section_key, option_key, label, is_enabled, display_order)
         VALUES ('availability', 'in_stock', 'In Stock', 1, 1)`
      );
    }

    // 3. Wishlist Unique Constraint (user_id, product_id)
    try {
      await pool.query(`
        ALTER TABLE wishlist ADD CONSTRAINT uk_wishlist_user_product UNIQUE (user_id, product_id)
      `);
    } catch (eW) {}

    // 4. Notifications Table Enhancements
    try { await pool.query(`ALTER TABLE notifications ADD COLUMN type VARCHAR(50) DEFAULT 'GENERAL'`); } catch (e) {}
    try { await pool.query(`ALTER TABLE notifications ADD COLUMN related_order_id BIGINT NULL`); } catch (e) {}
    try { await pool.query(`ALTER TABLE notifications ADD COLUMN related_product_id BIGINT NULL`); } catch (e) {}
    try { await pool.query(`ALTER TABLE notifications ADD COLUMN read_at TIMESTAMP NULL`); } catch (e) {}
    try { await pool.query(`ALTER TABLE notifications ADD COLUMN expires_at TIMESTAMP NULL`); } catch (e) {}
    try { await pool.query(`ALTER TABLE notifications ADD COLUMN is_active TINYINT(1) DEFAULT 1`); } catch (e) {}

    // 5. Admin Promotional Notifications Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS admin_promotional_notifications (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        image_url TEXT NULL,
        target_audience VARCHAR(50) DEFAULT 'ALL',
        start_date TIMESTAMP NULL,
        end_date TIMESTAMP NULL,
        is_enabled TINYINT(1) DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 6. Return & Refund Requests Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS return_requests (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        order_id BIGINT NOT NULL,
        order_item_id BIGINT DEFAULT NULL,
        user_id BIGINT NOT NULL,
        type VARCHAR(50) DEFAULT 'RETURN',
        reason VARCHAR(255) NOT NULL,
        description TEXT,
        images TEXT,
        status VARCHAR(50) DEFAULT 'RETURN/REFUND REQUESTED',
        refund_amount DECIMAL(10,2) DEFAULT 0.00,
        refund_reference VARCHAR(255) DEFAULT NULL,
        admin_notes TEXT DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );
    `);

    // 7. Footer Settings Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS footer_settings (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        section_key VARCHAR(100) NOT NULL UNIQUE,
        title VARCHAR(255),
        content_json TEXT,
        is_enabled TINYINT(1) DEFAULT 1,
        display_order INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );
    `);

    // 8. Homepage Sidebar Sections Table (Single Source of Truth for Left & Right Sidebars)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS homepage_sidebar_sections (
        id VARCHAR(100) PRIMARY KEY,
        side VARCHAR(20) NOT NULL,
        section_type VARCHAR(50) NOT NULL,
        title VARCHAR(255),
        subtitle VARCHAR(255),
        description TEXT,
        image_url LONGTEXT,
        icon VARCHAR(100),
        badge_text VARCHAR(100),
        button_text VARCHAR(100),
        action_type VARCHAR(50) DEFAULT 'SHOP',
        action_value VARCHAR(255) DEFAULT '/shop',
        background_color VARCHAR(50),
        text_color VARCHAR(50),
        is_enabled TINYINT(1) DEFAULT 1,
        display_order INT DEFAULT 0,
        config_json LONGTEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );
    `);

    // Ensure product_selling_types table exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS product_selling_types (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        product_id BIGINT NOT NULL,
        selling_type VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_prod_selling_type (product_id, selling_type),
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
      );
    `);

    // Seed default sidebar sections if table is empty
    const [sbCount] = await pool.query('SELECT COUNT(*) as count FROM homepage_sidebar_sections');
    if (!sbCount || sbCount[0].count === 0) {
      const defaultLeft = [
        ['nav_items_menu', 'LEFT', 'NAV_MENU', 'Quick Navigation', 'Browse top store sections', null, null, 'Layers', null, null, 'SHOP', '/shop', null, null, 1, 1, JSON.stringify([
          { id: 'offers', label: 'Top Offers', subtitle: 'Best discounts on site', icon: 'Flame', link: '/shop?sellingType=top-offers', badge: 'HOT', enabled: true, order: 1 },
          { id: 'arrivals', label: 'New Arrivals', subtitle: 'Fresh drops & collections', icon: 'Sparkles', link: '/shop?sellingType=new-arrivals', badge: 'NEW', enabled: true, order: 2 },
          { id: 'bestsellers', label: 'Best Sellers', subtitle: 'Customer favorite picks', icon: 'Star', link: '/shop?sellingType=best-sellers', badge: 'HOT', enabled: true, order: 3 },
          { id: 'trending', label: 'Trending Now', subtitle: 'Popular style trends', icon: 'TrendingUp', link: '/shop?sellingType=trending-now', badge: '', enabled: true, order: 4 },
          { id: 'track', label: 'Track Order', subtitle: 'Live order tracking', icon: 'Truck', link: '/profile', badge: '', enabled: true, order: 5 },
          { id: 'support', label: 'Customer Support', subtitle: '24/7 dedicated help', icon: 'Headphones', link: '/contact', badge: '', enabled: true, order: 6 }
        ])],
        ['offer_card_left', 'LEFT', 'OFFER_CARD', 'EXTRA 10% OFF', 'On Prepaid Orders', null, null, 'Percent', 'INSTANT DISCOUNT', 'GIFT CODE', 'PRODUCT_FILTER', '/shop?filter=offers', '#FFF1F2', '#991B1B', 1, 2, JSON.stringify({ couponCode: 'PREPAID10', discountPercent: '%' })],
        ['promo_card_left', 'LEFT', 'PROMO_BANNER', 'UP TO 60% OFF', 'On Bestsellers', 'Limited time festive drops & trending styles.', 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600', 'Sparkles', '✨ FESTIVE SPECIAL', 'SHOP NOW', 'PROMOTION', '/shop?promotion=festive-special&maxDiscount=60', '#800000', '#FFFFFF', 1, 3, JSON.stringify({ promotionName: 'Festive Special', maxDiscount: 60, minDiscount: 0, discountCondition: 'UP_TO' })],
        ['shop_by_price_left', 'LEFT', 'SHOP_BY_PRICE', 'SHOP BY PRICE', null, null, null, 'Tag', null, null, 'SHOP', '/shop', null, null, 1, 4, JSON.stringify([
          { id: 'p1', label: 'Under ₹499', link: '/shop?maxPrice=499', enabled: true },
          { id: 'p2', label: 'Under ₹999', link: '/shop?maxPrice=999', enabled: true },
          { id: 'p3', label: 'Under ₹1499', link: '/shop?maxPrice=1499', enabled: true },
          { id: 'p4', label: 'Under ₹1999', link: '/shop?maxPrice=1999', enabled: true },
          { id: 'p5', label: 'Under ₹2999', link: '/shop?maxPrice=2999', enabled: true },
          { id: 'p6', label: 'Under ₹3999', link: '/shop?maxPrice=3999', enabled: true }
        ])],
        ['quick_categories_left', 'LEFT', 'CATEGORIES_GRID', 'QUICK CATEGORIES', null, null, null, 'Grid', null, null, 'SHOP', '/shop', null, null, 1, 5, JSON.stringify([
          { id: 'qc1', name: 'T-Shirts', link: '/shop?category=T-Shirts', enabled: true },
          { id: 'qc2', name: 'Sneakers', link: '/shop?category=Sneakers', enabled: true },
          { id: 'qc3', name: 'Kurta Sets', link: '/shop?category=Kurta+Sets', enabled: true },
          { id: 'qc4', name: 'Men', link: '/shop?category=Men', enabled: true },
          { id: 'qc5', name: 'Women', link: '/shop?category=Women', enabled: true },
          { id: 'qc6', name: 'Kids', link: '/shop?category=Kids', enabled: true },
          { id: 'qc7', name: 'Accessories', link: '/shop?category=Accessories', enabled: true },
          { id: 'qc8', name: 'Jewellery', link: '/shop?category=Jewellery', enabled: true }
        ])],
        ['why_shop_left', 'LEFT', 'WHY_KARVIYAM', 'WHY SHOP WITH KARVIYAM?', null, null, null, 'ShieldCheck', null, null, 'SHOP', '/shop', null, null, 1, 6, JSON.stringify([
          { id: '1', title: 'Free Delivery', subtitle: 'On orders above ₹499', icon: 'Truck', enabled: true },
          { id: '2', title: 'Secure Payments', subtitle: '100% safe & secure', icon: 'ShieldCheck', enabled: true },
          { id: '3', title: 'Easy Returns', subtitle: '30 days return policy', icon: 'RotateCcw', enabled: true },
          { id: '4', title: 'Best Price Guarantee', subtitle: 'Unbeatable value', icon: 'Heart', enabled: true },
          { id: '5', title: '24/7 Support', subtitle: 'Dedicated assistance', icon: 'Headphones', enabled: true }
        ])],
        ['popular_picks_left', 'LEFT', 'POPULAR_PICKS', 'POPULAR PICKS', null, null, null, 'Flame', 'FEATURED', null, 'SHOP', '/shop', null, null, 1, 7, null],
        ['deals_under_left', 'LEFT', 'DEALS_UNDER', 'DEALS UNDER ₹1100', 'Unbeatable budget fashion picks.', null, null, 'BadgePercent', 'BUDGET PICKS', 'VIEW DEALS →', 'PRODUCT_FILTER', '/shop?maxPrice=1100', '#FFFBEB', '#B45309', 1, 8, null],
        ['why_karviyam_checklist_left', 'LEFT', 'CHECKLIST_CARD', 'WHY KARVIYAM?', null, null, null, 'CheckCircle2', null, null, 'SHOP', '/shop', '#F0FDF4', '#15803D', 1, 9, JSON.stringify([
          'Quality materials', 'Verified shopping', 'Secure checkout', 'Easy returns'
        ])],
        ['trending_styles_left', 'LEFT', 'TRENDING_STYLES', 'TRENDING STYLES 🔥', null, null, null, 'TrendingUp', null, null, 'SHOP', '/shop', null, null, 1, 10, null],
        ['top_collections_left', 'LEFT', 'TOP_COLLECTIONS', 'TOP COLLECTIONS', null, null, null, 'Layers', null, null, 'SHOP', '/shop', null, null, 1, 11, JSON.stringify([
          { label: 'FESTIVE SILKS', subtitle: 'Handcrafted', link: '/shop?category=Sarees' },
          { label: 'MEN\'S KURTAS', subtitle: 'Royal Edition', link: '/shop?category=Kurtas' },
          { label: 'MODERN SNEAKERS', subtitle: 'Trendy Steps', link: '/shop?category=Sneakers' },
          { label: '925 SILVER', subtitle: 'Pure Shine', link: '/shop?category=Jewellery' }
        ])],
        ['fresh_summer_left', 'LEFT', 'PROMO_CARD_MINI', 'FRESH SUMMER LOOKS', 'Lightweight fabrics & modern silhouettes.', null, null, 'Sparkles', 'COLORFUL SHOP', 'SHOP SUMMER →', 'PRODUCT_FILTER', '/shop?filter=summer', '#EFF6FF', '#1D4ED8', 1, 12, null],
        ['guarantee_card_left', 'LEFT', 'GUARANTEE_CARD', '100% ORIGINAL', 'Verified authentic fashion directly from top manufacturers.', null, null, 'Award', null, 'QUALITY ASSURED', 'SHOP', '/shop', '#ECFDF5', '#047857', 1, 13, null],
        ['final_left_promo', 'LEFT', 'FINAL_PROMO', 'SHOP MORE. SAVE MORE.', 'Discover everyday fashion styles.', null, null, 'Sparkles', 'EXPLORE STYLES', 'EXPLORE NOW →', 'SHOP', '/shop', '#FFF7ED', '#C2410C', 1, 14, null]
      ];

      const defaultRight = [
        ['today_special_right', 'RIGHT', 'TODAYS_DEAL', 'TODAY\'S SPECIAL DEAL', 'Limited Time Only', 'Stylish & Comfortable Sports Sneakers.', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600', 'Flame', 'TODAY\'S SPECIAL DEAL', 'SHOP NOW →', 'PRODUCT_CATEGORY', '/shop?category=Sneakers', '#FFF1F2', '#991B1B', 1, 1, JSON.stringify({ productName: 'Sports Sneakers', price: 1499, originalPrice: 2499, discountText: '40% OFF' })],
        ['quick_deals_right', 'RIGHT', 'QUICK_DEALS', 'QUICK DEALS 🔥', null, null, null, 'Zap', null, null, 'SHOP', '/shop', null, null, 1, 2, JSON.stringify([
          { id: 'qd1', icon: '🔥', title: 'Sneakers', tag: 'Up to 50% OFF', link: '/shop?category=Sneakers', enabled: true },
          { id: 'qd2', icon: '👕', title: 'T-Shirts', tag: 'From ₹499', link: '/shop?category=T-Shirts', enabled: true },
          { id: 'qd3', icon: '👗', title: "Women's Wear", tag: 'Up to 60% OFF', link: '/shop?category=Women', enabled: true },
          { id: 'qd4', icon: '🎒', title: 'Bags & Accessories', tag: 'Starting ₹399', link: '/shop?category=Accessories', enabled: true }
        ])],
        ['popular_picks_right', 'RIGHT', 'POPULAR_PICKS', 'POPULAR PICKS 🔥', null, null, null, 'Flame', null, null, 'SHOP', '/shop', null, null, 1, 3, null],
        ['coupon_savings_right', 'RIGHT', 'COUPON_SAVINGS', 'UNLOCK EXTRA SAVINGS', 'Use available coupons and promo codes at checkout.', null, null, 'Gift', 'EXTRA SAVINGS', 'VIEW OFFERS →', 'PRODUCT_FILTER', '/shop?filter=offers', '#FFFBEB', '#B45309', 1, 4, null],
        ['shop_by_category_right', 'RIGHT', 'CATEGORIES_GRID', 'SHOP BY CATEGORY', null, null, null, 'Grid', null, null, 'SHOP', '/shop', null, null, 1, 5, JSON.stringify([
          { id: 'rc1', name: 'Men', link: '/shop?category=Men', enabled: true },
          { id: 'rc2', name: 'Women', link: '/shop?category=Women', enabled: true },
          { id: 'rc3', name: 'Kids', link: '/shop?category=Kids', enabled: true },
          { id: 'rc4', name: 'Sneakers', link: '/shop?category=Sneakers', enabled: true },
          { id: 'rc5', name: 'Jewellery', link: '/shop?category=Jewellery', enabled: true },
          { id: 'rc6', name: 'Accessories', link: '/shop?category=Accessories', enabled: true },
          { id: 'rc7', name: 'Kitchen & Home', link: '/shop?category=Kitchen', enabled: true },
          { id: 'rc8', name: 'School & Office', link: '/shop?category=School', enabled: true }
        ])],
        ['style_inspiration_right', 'RIGHT', 'STYLE_INSPIRATION', 'Look Good.', 'Feel Confident.', 'CASUAL LOOKS - For Everyday', 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600', 'Sparkles', 'STYLE INSPIRATION', 'EXPLORE NOW →', 'SHOP', '/shop', '#FFFBEB', '#92400E', 1, 6, null],
        ['community_join_right', 'RIGHT', 'COMMUNITY_JOIN', 'JOIN OUR COMMUNITY', 'Get exclusive offers, new arrivals and style inspiration.', null, null, 'Heart', 'FEEL SPECIAL', 'SUBSCRIBE 🚀', 'SHOP', '/shop', '#FFF1F2', '#991B1B', 1, 7, null],
        ['upi_discount_right', 'RIGHT', 'UPI_DISCOUNT', '5% OFF ON UPI PAYMENTS', 'Instant automatic discount applied at checkout.', null, null, 'Percent', 'INSTANT DISCOUNT', 'PAY VIA UPI & SAVE →', 'SHOP', '/shop', '#FEF2F2', '#B91C1C', 1, 8, null],
        ['budget_shopping_right', 'RIGHT', 'BUDGET_SHOPPING', 'BUDGET SHOPPING ⚡', null, null, null, 'Tag', null, null, 'SHOP', '/shop', null, null, 1, 9, JSON.stringify([
          { label: 'UNDER ₹499', subtitle: 'Super Value', link: '/shop?maxPrice=499' },
          { label: 'UNDER ₹999', subtitle: 'Best Sellers', link: '/shop?maxPrice=999' }
        ])],
        ['style_tip_right', 'RIGHT', 'STYLE_TIP', 'PASSION STYLE TIP 💡', 'Pair neutral printed tees with dark wash denim for an effortless daily look.', null, null, 'Sparkles', 'DAILY STYLE TIP', 'SHOP MATCHING LOOKS →', 'SHOP', '/shop', '#FEFCE8', '#854D0E', 1, 10, null],
        ['need_assistance_right', 'RIGHT', 'NEED_ASSISTANCE', 'NEED ASSISTANCE?', 'Have a question? Our customer support team is available 24/7.', null, null, 'Headphones', '24/7 HELP', 'GET FAST SUPPORT →', 'CONTACT', '/contact', '#F8FAFC', '#334155', 1, 11, null],
        ['silver_jewellery_right', 'RIGHT', 'SILVER_JEWELLERY', '925 SILVER JEWELLERY', 'Handcrafted authentic silver rings & pendants.', null, null, 'Crown', 'PREMIUM STORE', 'VISIT STORE →', 'PRODUCT_CATEGORY', '/shop?category=Jewellery', '#EFF6FF', '#1E40AF', 1, 12, null],
        ['discover_style_right', 'RIGHT', 'DISCOVER_STYLE', 'DISCOVER YOUR STYLE', 'New drops. Fresh looks. Better prices.', null, null, 'Sparkles', 'NEW COLLECTION', 'SHOP NOW →', 'SHOP', '/shop', '#FFF7ED', '#C2410C', 1, 13, null]
      ];

      for (const item of [...defaultLeft, ...defaultRight]) {
        await pool.query(
          `INSERT INTO homepage_sidebar_sections (
            id, side, section_type, title, subtitle, description, image_url, icon, badge_text, button_text,
            action_type, action_value, background_color, text_color, is_enabled, display_order, config_json
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          item
        );
      }
      console.log('[initDb] Seeded default Left & Right Sidebar Sections into homepage_sidebar_sections table.');
    }
    // 9. Email Templates Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS email_templates (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        template_key VARCHAR(50) NOT NULL UNIQUE,
        subject VARCHAR(255) NOT NULL,
        heading VARCHAR(255),
        body_html LONGTEXT NOT NULL,
        footer_text TEXT,
        button_text VARCHAR(100),
        button_url VARCHAR(255),
        is_enabled TINYINT(1) DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );
    `);

    // 10. Email Logs Table (Audit Trail & Duplicate Protection)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS email_logs (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        order_id BIGINT NULL,
        user_id BIGINT NULL,
        customer_email VARCHAR(150) NOT NULL,
        email_type VARCHAR(50) NOT NULL,
        status_key VARCHAR(50) NULL,
        subject VARCHAR(255),
        status VARCHAR(20) NOT NULL,
        failure_reason TEXT NULL,
        sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_el_order_type (order_id, email_type, status_key)
      );
    `);

    // Seed default Email Notification settings in settings table
    const defaultEmailSettings = [
      ['email_notifications_enabled', 'true'],
      ['enable_order_placed_email', 'true'],
      ['enable_status_update_email', 'true'],
      ['enable_out_for_delivery_email', 'true'],
      ['enable_delivered_email', 'true'],
      ['enable_cancelled_email', 'true'],
      ['enable_refund_email', 'true']
    ];
    for (const [sKey, sVal] of defaultEmailSettings) {
      await pool.query(
        `INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = COALESCE(setting_value, VALUES(setting_value))`,
        [sKey, sVal]
      );
    }

    // Seed default email templates if missing
    const defaultTemplates = [
      [
        'ORDER_PLACED',
        'Karviyam — Your Order #{{order_id}} Has Been Placed',
        'Order Placed Successfully',
        '<p>Hello <strong>{{customer_name}}</strong>,</p><p>Thank you for shopping with Karviyam. Your order has been successfully placed.</p>',
        'Thank you for choosing Karviyam.',
        'TRACK MY ORDER',
        'https://karviyam.com/profile',
        1
      ],
      [
        'PAYMENT_CONFIRMED',
        'Karviyam — Payment Confirmed for Order #{{order_id}}',
        'Payment Received',
        '<p>Hello <strong>{{customer_name}}</strong>,</p><p>We have successfully received payment of <strong>{{order_total}}</strong> for your order #{{order_id}}.</p>',
        'Your transaction is secure and verified.',
        'VIEW RECEIPT',
        'https://karviyam.com/profile',
        1
      ],
      [
        'PROCESSING',
        'Karviyam — Your Order #{{order_id}} Is Being Processed',
        'Order Under Processing',
        '<p>Hello <strong>{{customer_name}}</strong>,</p><p>Your Karviyam order #{{order_id}} is currently being processed and prepared for packing.</p>',
        'We will notify you once your order is packed and dispatched.',
        'TRACK MY ORDER',
        'https://karviyam.com/profile',
        1
      ],
      [
        'PACKED',
        'Karviyam — Your Order #{{order_id}} Has Been Packed',
        'Order Packed & Ready',
        '<p>Hello <strong>{{customer_name}}</strong>,</p><p>Great news! Your order #{{order_id}} has been packed and handed over to our courier partner.</p>',
        'Expected delivery: {{estimated_delivery}}.',
        'TRACK MY ORDER',
        'https://karviyam.com/profile',
        1
      ],
      [
        'SHIPPED',
        'Karviyam — Your Order #{{order_id}} Has Been Shipped',
        'Order On The Way',
        '<p>Hello <strong>{{customer_name}}</strong>,</p><p>Your Karviyam order #{{order_id}} has been shipped via <strong>{{courier_partner}}</strong>.</p>',
        'Tracking Number: {{tracking_number}}',
        'TRACK MY ORDER',
        'https://karviyam.com/profile',
        1
      ],
      [
        'OUT_FOR_DELIVERY',
        'Karviyam — Your Order #{{order_id}} Is Out for Delivery',
        '🚚 YOUR ORDER IS OUT FOR DELIVERY',
        '<p>Hello <strong>{{customer_name}}</strong>,</p><p>Your Karviyam order is now out for delivery to your shipping address.</p>',
        'Delivery location: {{current_location}}.',
        'TRACK MY ORDER',
        'https://karviyam.com/profile',
        1
      ],
      [
        'DELIVERED',
        'Karviyam — Order #{{order_id}} Delivered Successfully',
        '✓ Order Delivered Successfully',
        '<p>Hello <strong>{{customer_name}}</strong>,</p><p>Your Karviyam order #{{order_id}} has been delivered successfully to {{current_location}}.</p>',
        'Thank you for shopping with Karviyam!',
        'CONTINUE SHOPPING',
        'https://karviyam.com/shop',
        1
      ],
      [
        'CANCELLED',
        'Karviyam — Order #{{order_id}} Order Cancellation Confirmed',
        'Order Cancelled',
        '<p>Hello <strong>{{customer_name}}</strong>,</p><p>Your Karviyam order #{{order_id}} has been cancelled as per your request or system updates.</p>',
        'If paid online, refund process will be initiated shortly.',
        'EXPLORE STORE',
        'https://karviyam.com/shop',
        1
      ],
      [
        'RETURN_REQUESTED',
        'Karviyam — Return Request Received for Order #{{order_id}}',
        'Return Request Received',
        '<p>Hello <strong>{{customer_name}}</strong>,</p><p>We have received your return request for order #{{order_id}}. Our quality check team is inspecting your request.</p>',
        'You will receive an update within 24-48 hours.',
        'VIEW RETURN STATUS',
        'https://karviyam.com/profile',
        1
      ],
      [
        'RETURN_APPROVED',
        'Karviyam — Return Request Approved for Order #{{order_id}}',
        'Return Approved',
        '<p>Hello <strong>{{customer_name}}</strong>,</p><p>Your return request for order #{{order_id}} has been approved. Pickup has been scheduled.</p>',
        'Please keep the item ready in original packaging.',
        'TRACK PICKUP',
        'https://karviyam.com/profile',
        1
      ],
      [
        'RETURN_REJECTED',
        'Karviyam — Return Request Update for Order #{{order_id}}',
        'Return Request Declined',
        '<p>Hello <strong>{{customer_name}}</strong>,</p><p>Your return request for order #{{order_id}} could not be approved based on our return policy verification.</p>',
        'Contact support if you need further assistance.',
        'CONTACT SUPPORT',
        'https://karviyam.com/contact',
        1
      ],
      [
        'REFUND_INITIATED',
        'Karviyam — Refund Initiated for Order #{{order_id}}',
        'Refund Initiated',
        '<p>Hello <strong>{{customer_name}}</strong>,</p><p>A refund of <strong>{{order_total}}</strong> for order #{{order_id}} has been initiated to your original payment method.</p>',
        'Amount will credit in 3-5 business days.',
        'VIEW DETAILS',
        'https://karviyam.com/profile',
        1
      ],
      [
        'REFUNDED',
        'Karviyam — Refund Processed for Order #{{order_id}}',
        'Refund Completed',
        '<p>Hello <strong>{{customer_name}}</strong>,</p><p>Your refund for Karviyam order #{{order_id}} has been completed successfully.</p>',
        'Thank you for your patience.',
        'VIEW ORDERS',
        'https://karviyam.com/profile',
        1
      ],
      [
        'ACCOUNT_CREATED',
        'Welcome to Karviyam — Account Created Successfully',
        'Welcome to Karviyam Family! 🎉',
        '<p>Hello <strong>{{customer_name}}</strong>,</p><p>Welcome to Karviyam! Your customer account has been created successfully.</p>',
        'Explore our handcrafted artisan collection today.',
        'EXPLORE STORE',
        'https://karviyam.com/shop',
        1
      ],
      [
        'OTP_LOGIN',
        'Karviyam — Your One Time Password (OTP)',
        'Security Verification Code',
        '<p>Hello <strong>{{customer_name}}</strong>,</p><p>Your OTP verification code for login is <strong>{{otp_code}}</strong>. Valid for 10 minutes.</p>',
        'Do not share your OTP code with anyone.',
        'VERIFY NOW',
        'https://karviyam.com/login',
        1
      ],
      [
        'PASSWORD_RESET',
        'Karviyam — Password Reset Request',
        'Reset Your Password',
        '<p>Hello <strong>{{customer_name}}</strong>,</p><p>We received a request to reset the password for your account {{customer_email}}.</p>',
        'If you did not request this, please ignore this email.',
        'RESET PASSWORD',
        'https://karviyam.com/reset-password',
        1
      ],
      [
        'EMAIL_VERIFICATION',
        'Karviyam — Verify Your Email Address',
        'Verify Your Email',
        '<p>Hello <strong>{{customer_name}}</strong>,</p><p>Please click the button below to verify your email address and activate all member benefits.</p>',
        'Thank you for joining Karviyam.',
        'VERIFY EMAIL',
        'https://karviyam.com/verify-email',
        1
      ],
      [
        'CONTACT_RESPONSE',
        'Karviyam Support — Response to Your Message',
        'Support Team Reply',
        '<p>Hello <strong>{{customer_name}}</strong>,</p><p>Thank you for contacting Karviyam Support regarding <em>"{{message_subject}}"</em>.</p>',
        'We are always here to help you.',
        'VIEW CONVERSATION',
        'https://karviyam.com/profile',
        1
      ],
      [
        'NEWSLETTER',
        'Karviyam — Exclusive Deals & Artisan Highlights',
        'Artisan Collections & Offers',
        '<p>Hello <strong>{{customer_name}}</strong>,</p><p>Check out our latest exclusive artisan arrivals and handcrafted special offers.</p>',
        'Unsubscribe at any time in your account settings.',
        'SHOP NEW ARRIVALS',
        'https://karviyam.com/shop',
        1
      ],
      [
        'PROMOTIONAL',
        'Karviyam Special Offer — Limited Time Discount!',
        'Special Discount Just For You 🏷️',
        '<p>Hello <strong>{{customer_name}}</strong>,</p><p>Use coupon code <strong>{{coupon_code}}</strong> to get flat discount on your next order!</p>',
        'Valid on all items.',
        'CLAIM OFFER',
        'https://karviyam.com/shop',
        1
      ],
      [
        'ADMIN_NOTIFICATION',
        'Karviyam System Alert — Admin Notification',
        'System Status Update',
        '<p>Hello Admin,</p><p>System alert or bulk operation status update: {{status_message}}.</p>',
        'Karviyam Enterprise Admin.',
        'GO TO ADMIN DASHBOARD',
        'https://karviyam.com/admin',
        1
      ]
    ];

    for (const tpl of defaultTemplates) {
      await pool.query(
        `INSERT INTO email_templates (template_key, subject, heading, body_html, footer_text, button_text, button_url, is_enabled)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           subject = COALESCE(email_templates.subject, VALUES(subject)),
           heading = COALESCE(email_templates.heading, VALUES(heading))`,
        tpl
      ).catch(() => null);
    }
    console.log('[initDb] Seeded default email templates into email_templates table.');
  } catch (errSchema) {
    console.warn('⚠️ initShopFiltersAndNotificationsSchema warning:', errSchema.message);
  }
}

async function seedSampleProducts() {
  try {
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

        try {
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
        } catch (errSingleProd) {
          console.warn(`⚠️ Sample product ${name} seed warning:`, errSingleProd.message);
        }

        pIndex++;
      }
    }
  } catch (errSeed) {
    console.warn('⚠️ seedSampleProducts warning:', errSeed.message);
  }
}

module.exports = initDb;
