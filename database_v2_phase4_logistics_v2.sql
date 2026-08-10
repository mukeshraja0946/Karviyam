-- Upgrade Logistics Management Schema
-- This script adds missing columns for the full logistics suite

ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS tracking_id VARCHAR(100) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS ship_city VARCHAR(100) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS ship_pincode VARCHAR(20) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS pickup_location VARCHAR(255) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS pickup_time TIME DEFAULT NULL,
ADD COLUMN IF NOT EXISTS warehouse VARCHAR(100) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS shipment_notes TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS logistics_status ENUM(
    'Pending Assignment', 
    'Pending Pickup', 
    'Picked Up', 
    'In Transit', 
    'Out for Delivery', 
    'Delivered', 
    'Delivery Failed', 
    'Returned'
) DEFAULT 'Pending Assignment';

-- Update existing records if needed
UPDATE orders SET logistics_status = 'Pending Assignment' WHERE logistics_status IS NULL;
