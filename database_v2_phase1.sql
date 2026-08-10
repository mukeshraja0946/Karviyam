-- Phase 1 Migration: Foundation & Infrastructure

-- 1. Update users table for roles
-- Roles: super_admin, store_manager, order_manager, customer
ALTER TABLE users 
MODIFY COLUMN role ENUM('super_admin', 'store_manager', 'order_manager', 'customer', 'admin') DEFAULT 'customer';

-- Update existing 'admin' to 'super_admin' to maintain access
UPDATE users SET role = 'super_admin' WHERE role = 'admin';

-- 2. Add Maintenance Mode to settings
INSERT IGNORE INTO settings (setting_key, setting_value) VALUES ('maintenance_mode', '0');

-- 3. Add Express Shipping to settings
INSERT IGNORE INTO settings (setting_key, setting_value) VALUES ('express_shipping_fee', '150');

-- 4. Update orders table
-- Add tracking_id if it doesn't exist and extend status
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS tracking_id VARCHAR(100) DEFAULT NULL,
MODIFY COLUMN status ENUM('Pending', 'Confirmed', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled', 'Returned') DEFAULT 'Pending';
