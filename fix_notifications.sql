-- run this in Hostinger phpMyAdmin to fix the notifications table

-- 1. Add missing columns to notifications table if they don't exist
ALTER TABLE `notifications` ADD COLUMN IF NOT EXISTS `role` ENUM('customer', 'admin') DEFAULT 'customer' AFTER `user_id`;
ALTER TABLE `notifications` ADD COLUMN IF NOT EXISTS `status` ENUM('unread', 'read') DEFAULT 'unread' AFTER `message`;
ALTER TABLE `notifications` ADD COLUMN IF NOT EXISTS `order_id` INT DEFAULT NULL AFTER `role`;

-- 2. If 'is_read' exists and 'status' doesn't, migrate data (optional but good practice)
-- UPDATE `notifications` SET `status` = 'read' WHERE `is_read` = 1;
-- UPDATE `notifications` SET `status` = 'unread' WHERE `is_read` = 0;

-- 3. Add foreign key for order_id if it doesn't exist
-- ALTER TABLE `notifications` ADD CONSTRAINT `fk_notif_order` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE CASCADE;
