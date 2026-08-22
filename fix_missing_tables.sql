-- run this in Hostinger phpMyAdmin

-- 0. Add missing 'role' column to users table
ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `role` ENUM('customer', 'admin') DEFAULT 'customer' AFTER `google_id`;

-- 1. Create home_banners table if missing
CREATE TABLE IF NOT EXISTS `home_banners` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `image_path` varchar(255) NOT NULL,
  `status` enum('active', 'inactive') DEFAULT 'active',
  `display_order` int(11) DEFAULT 0,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Create homepage_collections table if missing
CREATE TABLE IF NOT EXISTS `homepage_collections` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `image` varchar(255) NOT NULL,
  `link` varchar(255) NOT NULL,
  `status` enum('active', 'inactive') DEFAULT 'active',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Create product_images table for multi-image support
CREATE TABLE IF NOT EXISTS `product_images` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `product_id` int(11) NOT NULL,
  `image_url` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Create settings table for interval and other configs
CREATE TABLE IF NOT EXISTS `settings` (
  `setting_key` varchar(100) PRIMARY KEY,
  `setting_value` text,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. Insert Sample Data for Home Page
INSERT IGNORE INTO `home_banners` (`image_path`, `status`, `display_order`) VALUES 
('assets/images/banner1.jpg', 'active', 1),
('assets/images/banner2.jpg', 'active', 2);

INSERT IGNORE INTO `homepage_collections` (`name`, `image`, `link`, `status`) VALUES 
('Men''s Wear', 'assets/images/men-col.jpg', 'shop.php?gender=Men', 'active'),
('Women''s Wear', 'assets/images/women-col.jpg', 'shop.php?gender=Women', 'active'),
('Sneakers', 'assets/images/sneakers-col.jpg', 'shop.php?category=Sneakers', 'active');

INSERT IGNORE INTO `settings` (`setting_key`, `setting_value`) VALUES 
('banner_slide_interval', '4000');

-- 6. Final Admin Setup & User Cleanup in 'users' table
DELETE FROM `users` WHERE LOWER(email) != 'vanakkam@karviyam.com';
INSERT INTO `users` (full_name, email, password, role) 
VALUES ('Karviyam Admin', 'vanakkam@karviyam.com', '$2b$10$7Z8KqYJ6yP5W5m1k2l3u4e5r6t7y8u9i0oP1q2r3s4t5u6v7w8x9y', 'admin')
ON DUPLICATE KEY UPDATE role='admin';
