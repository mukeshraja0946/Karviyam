-- =============================================================================
-- KARVIYAM E-COMMERCE DATABASE CLEANUP SCRIPT
-- Purpose: Safely remove ALL data/records from every table WITHOUT deleting
--          tables, columns, indexes, constraints, triggers, or schema structure.
-- =============================================================================

USE `karviyam_db`;

-- Step 1: Temporarily disable foreign key checks to prevent FK constraint violations
SET FOREIGN_KEY_CHECKS = 0;

-- Step 2: Clear data & reset AUTO_INCREMENT counters to 1 for all tables
TRUNCATE TABLE `admin_logs`;
TRUNCATE TABLE `cart_items`;
TRUNCATE TABLE `cart`;
TRUNCATE TABLE `order_items`;
TRUNCATE TABLE `payments`;
TRUNCATE TABLE `shipment_updates`;
TRUNCATE TABLE `product_returns`;
TRUNCATE TABLE `returns`;
TRUNCATE TABLE `orders`;
TRUNCATE TABLE `reviews`;
TRUNCATE TABLE `wishlist`;
TRUNCATE TABLE `notifications`;
TRUNCATE TABLE `contact_messages`;
TRUNCATE TABLE `product_extra_details`;
TRUNCATE TABLE `product_images`;
TRUNCATE TABLE `product_variants`;
TRUNCATE TABLE `product_views`;
TRUNCATE TABLE `products`;
TRUNCATE TABLE `categories`;
TRUNCATE TABLE `user_roles`;
TRUNCATE TABLE `addresses`;
TRUNCATE TABLE `users`;
TRUNCATE TABLE `roles`;
TRUNCATE TABLE `admin`;
TRUNCATE TABLE `coupons`;
TRUNCATE TABLE `courier_partners`;
TRUNCATE TABLE `home_banners`;
TRUNCATE TABLE `homepage_collections`;
TRUNCATE TABLE `marketing_campaigns`;
TRUNCATE TABLE `payment_settings`;
TRUNCATE TABLE `search_keyword_analytics`;
TRUNCATE TABLE `settings`;
TRUNCATE TABLE `suppliers`;
TRUNCATE TABLE `visitor_stats`;
TRUNCATE TABLE `warehouses`;

-- Step 3: Re-enable foreign key checks to maintain database integrity
SET FOREIGN_KEY_CHECKS = 1;

SELECT 'Database cleanup completed successfully! All data removed; schema structure & constraints preserved.' AS Status;
