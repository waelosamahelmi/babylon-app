-- Add small_order_fee column to orders table
-- This tracks the fee added when orders are below the €15 minimum

ALTER TABLE orders
ADD COLUMN IF NOT EXISTS small_order_fee DECIMAL(10,2) DEFAULT 0;

COMMENT ON COLUMN orders.small_order_fee IS 'Fee added when order total is below minimum (€15)';

-- Update existing orders to have 0 small_order_fee
UPDATE orders
SET small_order_fee = 0
WHERE small_order_fee IS NULL;
