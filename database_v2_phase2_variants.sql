-- Phase 2 Migration: Product Variants System

-- Create product_variants table
CREATE TABLE IF NOT EXISTS product_variants (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    size VARCHAR(50) DEFAULT NULL,
    color VARCHAR(50) DEFAULT NULL,
    sku VARCHAR(100) DEFAULT NULL,
    price DECIMAL(10,2) DEFAULT NULL,
    stock INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Add index for faster variant lookups
CREATE INDEX idx_pv_product ON product_variants(product_id);

-- Add SKU and other missing columns to products if not exist
ALTER TABLE products ADD COLUMN IF NOT EXISTS sku VARCHAR(100) DEFAULT NULL AFTER name;
ALTER TABLE products ADD COLUMN IF NOT EXISTS old_price DECIMAL(10,2) DEFAULT NULL AFTER price;
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE AFTER gender;
ALTER TABLE products ADD COLUMN IF NOT EXISTS rating DECIMAL(3,2) DEFAULT 4.0 AFTER old_price;
ALTER TABLE products ADD COLUMN IF NOT EXISTS size VARCHAR(255) DEFAULT NULL;
ALTER TABLE products ADD COLUMN IF NOT EXISTS color VARCHAR(255) DEFAULT NULL;
ALTER TABLE products ADD COLUMN IF NOT EXISTS fabric VARCHAR(100) DEFAULT NULL;
ALTER TABLE products ADD COLUMN IF NOT EXISTS fit VARCHAR(100) DEFAULT NULL;
ALTER TABLE products ADD COLUMN IF NOT EXISTS review TEXT DEFAULT NULL;

-- Create product_extra_details if not exists (for Amazon-style details)
CREATE TABLE IF NOT EXISTS product_extra_details (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    main_category VARCHAR(100),
    sub_category VARCHAR(100),
    product_type VARCHAR(100),
    attributes JSON,
    about_points JSON,
    additional_info JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Create product_images table to support multiple gallery images
CREATE TABLE IF NOT EXISTS product_images (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    image_url VARCHAR(255) NOT NULL,
    is_main BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);
