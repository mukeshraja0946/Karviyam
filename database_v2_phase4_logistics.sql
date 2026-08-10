-- Phase 4 Migration: Logistics & Courier Management

-- Add courier and pickup details to orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS courier_company VARCHAR(100) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS courier_man_name VARCHAR(100) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS courier_man_phone VARCHAR(20) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS pickup_address TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS pickup_person_name VARCHAR(100) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS pickup_person_phone VARCHAR(20) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS received_date DATETIME DEFAULT NULL,
ADD COLUMN IF NOT EXISTS delivery_date DATETIME DEFAULT NULL;

-- Note: 'tracking_id' was already added in Phase 1
