-- Phase 13 Final Migration: Logistics Pro (SUPER SAFE VERSION)
-- This script handles existing tables, missing columns, and foreign key locks.
-- Designed for shared servers like Hostinger/cPanel.

SET FOREIGN_KEY_CHECKS = 0;

-- 1. Create Tables safely
CREATE TABLE IF NOT EXISTS courier_partners (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS warehouses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS shipment_updates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    status VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 2. Ensure ALL columns exist in 'warehouses' (Crucial fix for #1054)
ALTER TABLE warehouses ADD COLUMN IF NOT EXISTS city VARCHAR(100) NOT NULL AFTER name;
ALTER TABLE warehouses ADD COLUMN IF NOT EXISTS address TEXT NOT NULL AFTER city;
ALTER TABLE warehouses ADD COLUMN IF NOT EXISTS manager_name VARCHAR(100) DEFAULT NULL;
ALTER TABLE warehouses ADD COLUMN IF NOT EXISTS contact_number VARCHAR(20) DEFAULT NULL;
ALTER TABLE warehouses ADD COLUMN IF NOT EXISTS status ENUM('Active', 'Disabled') DEFAULT 'Active';

-- 3. Ensure ALL columns exist in 'courier_partners'
ALTER TABLE courier_partners ADD COLUMN IF NOT EXISTS logo_path VARCHAR(255) DEFAULT NULL;
ALTER TABLE courier_partners ADD COLUMN IF NOT EXISTS contact_person VARCHAR(100) DEFAULT NULL;
ALTER TABLE courier_partners ADD COLUMN IF NOT EXISTS phone VARCHAR(20) DEFAULT NULL;
ALTER TABLE courier_partners ADD COLUMN IF NOT EXISTS email VARCHAR(100) DEFAULT NULL;
ALTER TABLE courier_partners ADD COLUMN IF NOT EXISTS service_regions TEXT DEFAULT NULL;
ALTER TABLE courier_partners ADD COLUMN IF NOT EXISTS delivery_sla VARCHAR(50) DEFAULT NULL;
ALTER TABLE courier_partners ADD COLUMN IF NOT EXISTS api_key VARCHAR(255) DEFAULT NULL;
ALTER TABLE courier_partners ADD COLUMN IF NOT EXISTS status ENUM('Active', 'Disabled') DEFAULT 'Active';

-- 4. Ensure ALL columns exist in 'shipment_updates'
ALTER TABLE shipment_updates ADD COLUMN IF NOT EXISTS location VARCHAR(255) DEFAULT NULL;
ALTER TABLE shipment_updates ADD COLUMN IF NOT EXISTS notes TEXT DEFAULT NULL;
ALTER TABLE shipment_updates ADD COLUMN IF NOT EXISTS updated_by VARCHAR(100) DEFAULT NULL;

-- 5. Upgrade Orders Table
-- If these fail, it means they already exist (which is good)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS courier_id INT DEFAULT NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS warehouse_id INT DEFAULT NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_cost DECIMAL(10,2) DEFAULT 0.00;

-- 6. Insert Initial Data (Using IGNORE to avoid errors)
INSERT IGNORE INTO courier_partners (name, delivery_sla) VALUES 
('Delhivery', '3-5 Days'),
('DTDC', '2-4 Days'),
('Blue Dart', '1-2 Days'),
('India Post', '5-7 Days'),
('Shiprocket', '3-5 Days');

INSERT IGNORE INTO warehouses (name, city, address) VALUES 
('Main Hub', 'Mumbai', 'Plot 45, Industrial Area, Mumbai'),
('South Regional', 'Bangalore', 'Sector 4, Whitefield, Bangalore');

-- 7. Secure Relationships (Using SET NULL/CASCADE)
-- Constraints are given unique names to avoid Error 121
ALTER TABLE shipment_updates ADD CONSTRAINT fk_shipment_order_v13 FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE;
ALTER TABLE orders ADD CONSTRAINT fk_order_courier_v13 FOREIGN KEY (courier_id) REFERENCES courier_partners(id) ON DELETE SET NULL;
ALTER TABLE orders ADD CONSTRAINT fk_order_warehouse_v13 FOREIGN KEY (warehouse_id) REFERENCES warehouses(id) ON DELETE SET NULL;

SET FOREIGN_KEY_CHECKS = 1;
