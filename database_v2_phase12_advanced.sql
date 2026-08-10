-- Karviyam Database Upgrade: Phase 12 (Advanced Seller Central Suite)
-- This script adds tables for Suppliers, Marketing, Warehouses, and Advanced Tracking.

-- 1. Suppliers Table
CREATE TABLE IF NOT EXISTS `suppliers` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `contact_person` varchar(255) DEFAULT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `rating` decimal(3,2) DEFAULT 0.00,
  `delivery_performance` int(11) DEFAULT 0, -- Score out of 100
  `products_supplied` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Marketing Campaigns Table
CREATE TABLE IF NOT EXISTS `marketing_campaigns` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `channel` varchar(100) DEFAULT 'General',
  `budget` decimal(10,2) DEFAULT 0.00,
  `spend` decimal(10,2) DEFAULT 0.00,
  `revenue_generated` decimal(10,2) DEFAULT 0.00,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `status` enum('Active', 'Paused', 'Completed') DEFAULT 'Active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Warehouses Table
CREATE TABLE IF NOT EXISTS `warehouses` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `location` varchar(255) DEFAULT NULL,
  `capacity_percent` int(11) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Search Keyword Analytics Table
CREATE TABLE IF NOT EXISTS `search_keyword_analytics` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `keyword` varchar(255) NOT NULL,
  `search_count` int(11) DEFAULT 1,
  `last_searched` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `keyword` (`keyword`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. Product Views Table (Session-based)
CREATE TABLE IF NOT EXISTS `product_views` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `product_id` int(11) NOT NULL,
  `session_id` varchar(255) DEFAULT NULL,
  `viewed_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. Enhancing Products for Financial Intelligence
ALTER TABLE `products` 
ADD COLUMN IF NOT EXISTS `shipping_cost` decimal(10,2) DEFAULT 0.00 AFTER `cost_price`,
ADD COLUMN IF NOT EXISTS `platform_fees` decimal(10,2) DEFAULT 0.00 AFTER `shipping_cost`,
ADD COLUMN IF NOT EXISTS `warehouse_id` int(11) DEFAULT NULL AFTER `platform_fees`,
ADD COLUMN IF NOT EXISTS `supplier_id` int(11) DEFAULT NULL AFTER `warehouse_id`;

-- 7. Returns Tracking (Enhanced)
CREATE TABLE IF NOT EXISTS `product_returns` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `order_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `reason` text DEFAULT NULL,
  `status` enum('Pending', 'Approved', 'Rejected', 'Refunded') DEFAULT 'Pending',
  `refund_amount` decimal(10,2) DEFAULT 0.00,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
