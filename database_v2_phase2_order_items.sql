-- Phase 2 Migration: Order Items Variants Support (Final Robust Version)

-- We avoid 'AFTER' clauses with 'IF NOT EXISTS' to prevent dependency errors.
-- We add 'price' column if it doesn't exist.
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS price DECIMAL(10,2) DEFAULT 0.00;

-- We add variant columns.
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS selected_size VARCHAR(50) DEFAULT NULL;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS selected_color VARCHAR(50) DEFAULT NULL;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS variant_id INT DEFAULT NULL;

-- If 'price' is 0, attempt to copy from old 'price_at_time' column if it exists
-- The following may error if price_at_time is already removed, which is safe to ignore.
UPDATE order_items SET price = price_at_time WHERE price = 0;
