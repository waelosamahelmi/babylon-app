-- Add conditional pricing support for menu items
-- This allows items like "Your Choice Pizza" to have different pricing based on topping count

-- Add new columns to menu_items table
ALTER TABLE menu_items 
ADD COLUMN IF NOT EXISTS has_conditional_pricing BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS included_toppings_count INTEGER DEFAULT 0;

-- Create index for conditional pricing items
CREATE INDEX IF NOT EXISTS idx_menu_items_conditional_pricing ON menu_items(has_conditional_pricing) WHERE has_conditional_pricing = true;
