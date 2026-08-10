-- Migration to fix missing columns in orders table
-- This adds the columns required by the checkout and order success pages.

ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS full_name VARCHAR(100) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS email VARCHAR(100) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS phone VARCHAR(20) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS address TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS city VARCHAR(100) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS pincode VARCHAR(20) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'Pending';

-- Optional: If city/pincode were previously added as ship_city/ship_pincode
-- We can sync them or just use the new ones for consistency with checkout code.
UPDATE orders SET city = ship_city WHERE city IS NULL AND ship_city IS NOT NULL;
UPDATE orders SET pincode = ship_pincode WHERE pincode IS NULL AND ship_pincode IS NOT NULL;
