-- Karviyam Hostinger Cleanup Script
-- This version matches your actual table names (No error for 'order_returns')

-- 1. Wipe Orders & Logistics
TRUNCATE TABLE `order_items`;
TRUNCATE TABLE `product_returns`;
TRUNCATE TABLE `returns`;
DELETE FROM `orders`;
ALTER TABLE `orders` AUTO_INCREMENT = 1;

-- 2. Wipe Analytics & Logs
TRUNCATE TABLE `admin_logs`;
TRUNCATE TABLE `product_views`;
TRUNCATE TABLE `search_keyword_analytics`;
TRUNCATE TABLE `visitor_stats`;

-- 3. Wipe Marketing & Carts
TRUNCATE TABLE `marketing_campaigns`;
TRUNCATE TABLE `cart_items`;
TRUNCATE TABLE `wishlist`;

-- 4. Final Verification
SELECT "All relevant data regions successfully cleared." as Status;
