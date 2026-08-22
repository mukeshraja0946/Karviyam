-- Database Schema for Karviyam Clothing & Jewellery Shop

-- CREATE DATABASE IF NOT EXISTS karviyam_shop;
-- USE karviyam_shop;

-- 1. categories Table
CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    parent_id INT DEFAULT NULL,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(150) DEFAULT NULL,
    type VARCHAR(50) NOT NULL,
    description TEXT,
    image_url VARCHAR(255) DEFAULT NULL,
    icon_url VARCHAR(255) DEFAULT NULL,
    banner_url VARCHAR(255) DEFAULT NULL,
    order_index INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    seo_title VARCHAR(150) DEFAULT NULL,
    meta_description TEXT DEFAULT NULL,
    meta_keywords VARCHAR(255) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE CASCADE
);

-- 2. brands Table
CREATE TABLE IF NOT EXISTS brands (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(150) DEFAULT NULL,
    logo_url VARCHAR(255) DEFAULT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. products Table
CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category_id INT NOT NULL,
    subcategory_id INT DEFAULT NULL,
    brand_id INT DEFAULT NULL,
    name VARCHAR(255) NOT NULL,
    sku VARCHAR(100) DEFAULT NULL,
    barcode VARCHAR(100) DEFAULT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    old_price DECIMAL(10,2) DEFAULT NULL,
    cost_price DECIMAL(10,2) DEFAULT NULL,
    discount_percentage DECIMAL(5,2) DEFAULT NULL,
    stock_quantity INT DEFAULT 0,
    image_url VARCHAR(255),
    video_url VARCHAR(255) DEFAULT NULL,
    type VARCHAR(50) DEFAULT 'General',
    gender VARCHAR(20) DEFAULT 'Unisex',
    brand VARCHAR(100) DEFAULT NULL,
    rating DECIMAL(3,2) DEFAULT 4.50,
    is_featured BOOLEAN DEFAULT FALSE,
    is_trending BOOLEAN DEFAULT FALSE,
    is_best_seller BOOLEAN DEFAULT FALSE,
    is_new_arrival BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    size VARCHAR(50) DEFAULT NULL,
    color VARCHAR(50) DEFAULT NULL,
    fabric VARCHAR(100) DEFAULT NULL,
    fit VARCHAR(50) DEFAULT NULL,
    material VARCHAR(100) DEFAULT NULL,
    weight DECIMAL(8,2) DEFAULT NULL,
    tags VARCHAR(255) DEFAULT NULL,
    review TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
    FOREIGN KEY (subcategory_id) REFERENCES categories(id) ON DELETE SET NULL,
    FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE SET NULL
);

-- 3. users Table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    name VARCHAR(100) DEFAULT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(20) DEFAULT NULL,
    address TEXT DEFAULT NULL,
    google_id VARCHAR(255) DEFAULT NULL,
    role VARCHAR(50) DEFAULT 'customer',
    status VARCHAR(50) DEFAULT 'Active',
    enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. admin Table
CREATE TABLE IF NOT EXISTS admin (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. cart Table
CREATE TABLE IF NOT EXISTS cart (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT DEFAULT 1,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- 6. wishlist Table
CREATE TABLE IF NOT EXISTS wishlist (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    product_id INT NOT NULL,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- 7. orders Table
CREATE TABLE IF NOT EXISTS orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    status ENUM('Pending', 'Shipped', 'Delivered', 'Cancelled') DEFAULT 'Pending',
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 8. order_items Table
CREATE TABLE IF NOT EXISTS order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    price_at_time DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- 9. payments Table
CREATE TABLE IF NOT EXISTS payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    transaction_id VARCHAR(100) NOT NULL,
    payment_method VARCHAR(50),
    amount DECIMAL(10,2) NOT NULL,
    payment_status ENUM('Pending', 'Completed', 'Failed') DEFAULT 'Pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

-- 10. notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Insert Exclusive Admin
INSERT INTO admin (username, password, email) VALUES ('vanakkam', '$2b$10$g2olN3PbEJmt9AkxSdSwxeBOeV8F0PfXEhbWppSJ7K9PJQpsf2vh.', 'vanakkam@karviyam.com');
-- Password is 'Karviyam@2006'

INSERT INTO users (full_name, name, email, password, role, status, enabled) 
VALUES ('Karviyam Admin', 'Karviyam Admin', 'vanakkam@karviyam.com', '$2b$10$g2olN3PbEJmt9AkxSdSwxeBOeV8F0PfXEhbWppSJ7K9PJQpsf2vh.', 'admin', 'Active', TRUE)
ON DUPLICATE KEY UPDATE role='admin';
