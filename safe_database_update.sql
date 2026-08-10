-- Safer SQL to add only MISSING columns to the products table
-- This script checks if columns exist before adding them to avoid "#1060 - Duplicate column name" errors.

-- 1. Add 'type' if missing
SET @dropdown_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='products' AND COLUMN_NAME='type' AND TABLE_SCHEMA=DATABASE());
SET @sql = IF(@dropdown_exists = 0, 'ALTER TABLE products ADD COLUMN type VARCHAR(255) AFTER gender', 'SELECT "Column type already exists"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 2. Add 'brand' if missing (User already has this)
SET @dropdown_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='products' AND COLUMN_NAME='brand' AND TABLE_SCHEMA=DATABASE());
SET @sql = IF(@dropdown_exists = 0, 'ALTER TABLE products ADD COLUMN brand VARCHAR(255) AFTER name', 'SELECT "Column brand already exists"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 3. Add 'old_price' if missing
SET @dropdown_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='products' AND COLUMN_NAME='old_price' AND TABLE_SCHEMA=DATABASE());
SET @sql = IF(@dropdown_exists = 0, 'ALTER TABLE products ADD COLUMN old_price DECIMAL(10,2) AFTER price', 'SELECT "Column old_price already exists"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 4. Add 'rating' if missing
SET @dropdown_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='products' AND COLUMN_NAME='rating' AND TABLE_SCHEMA=DATABASE());
SET @sql = IF(@dropdown_exists = 0, 'ALTER TABLE products ADD COLUMN rating DECIMAL(3,2) DEFAULT 4.5 AFTER old_price', 'SELECT "Column rating already exists"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 5. Add 'is_featured' if missing
SET @dropdown_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='products' AND COLUMN_NAME='is_featured' AND TABLE_SCHEMA=DATABASE());
SET @sql = IF(@dropdown_exists = 0, 'ALTER TABLE products ADD COLUMN is_featured TINYINT(1) DEFAULT 0 AFTER rating', 'SELECT "Column is_featured already exists"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 6. Add 'size' if missing
SET @dropdown_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='products' AND COLUMN_NAME='size' AND TABLE_SCHEMA=DATABASE());
SET @sql = IF(@dropdown_exists = 0, 'ALTER TABLE products ADD COLUMN size VARCHAR(255) AFTER is_featured', 'SELECT "Column size already exists"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 7. Add 'color' if missing
SET @dropdown_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'products' AND COLUMN_NAME = 'color');
SET @sql = IF(@dropdown_exists = 0, 'ALTER TABLE products ADD COLUMN color VARCHAR(255) AFTER size', 'SELECT "Column color already exists"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 8. Add 'fabric' if missing
SET @dropdown_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'products' AND COLUMN_NAME = 'fabric');
SET @sql = IF(@dropdown_exists = 0, 'ALTER TABLE products ADD COLUMN fabric VARCHAR(255) AFTER color', 'SELECT "Column fabric already exists"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 9. Add 'fit' if missing
SET @dropdown_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'products' AND COLUMN_NAME = 'fit');
SET @sql = IF(@dropdown_exists = 0, 'ALTER TABLE products ADD COLUMN fit VARCHAR(255) AFTER fabric', 'SELECT "Column fit already exists"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 10. Add 'review' if missing
SET @dropdown_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'products' AND COLUMN_NAME = 'review');
SET @sql = IF(@dropdown_exists = 0, 'ALTER TABLE products ADD COLUMN review TEXT AFTER description', 'SELECT "Column review already exists"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 11. Create Extra Details table (if it doesn't already exist)
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
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);
