USE `karviyam_db`;

-- Modify legacy name column to allow NULL or default NULL
ALTER TABLE `users` MODIFY COLUMN `name` VARCHAR(100) NULL DEFAULT NULL;

-- Ensure role column allows NULL and defaults to 'customer'
ALTER TABLE `users` MODIFY COLUMN `role` VARCHAR(50) NULL DEFAULT 'customer';
