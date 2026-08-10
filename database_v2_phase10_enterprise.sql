-- Migration for Enterprise eCommerce Management System (Phase 10)

-- 1. Admin Activity Log
CREATE TABLE IF NOT EXISTS `admin_logs` (
    `id` int(11) NOT NULL AUTO_INCREMENT,
    `admin_id` int(11) NOT NULL,
    `action` varchar(255) NOT NULL,
    `target_type` varchar(50) DEFAULT NULL,
    `target_id` int(11) DEFAULT NULL,
    `details` text,
    `ip_address` varchar(45) DEFAULT NULL,
    `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Product Analytics (Views/Conversion)
CREATE TABLE IF NOT EXISTS `product_views` (
    `id` int(11) NOT NULL AUTO_INCREMENT,
    `product_id` int(11) NOT NULL,
    `user_id` int(11) DEFAULT NULL,
    `session_id` varchar(255) DEFAULT NULL,
    `referer` varchar(255) DEFAULT NULL,
    `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Add Cost Price for Profit Analytics
ALTER TABLE `products` ADD COLUMN IF NOT EXISTS `cost_price` decimal(10,2) DEFAULT 0.00 AFTER `price`;

-- 4. Enhance Visitor Stats for Traffic Source tracking
ALTER TABLE `visitor_stats` ADD COLUMN IF NOT EXISTS `referer_host` varchar(255) DEFAULT NULL AFTER `referer`;
ALTER TABLE `visitor_stats` ADD COLUMN IF NOT EXISTS `utm_source` varchar(50) DEFAULT NULL AFTER `referer_host`;
ALTER TABLE `visitor_stats` ADD COLUMN IF NOT EXISTS `device_type` varchar(50) DEFAULT NULL AFTER `utm_source`;

-- 5. Seed some initial admin logs for demonstration if empty
INSERT INTO `admin_logs` (`admin_id`, `action`, `details`) 
SELECT 1, 'System Upgrade', 'Enterprise Dashboard Phase 10 Initialized'
WHERE NOT EXISTS (SELECT 1 FROM `admin_logs` LIMIT 1);
