-- Add updated_at columns and triggers to menu_items and toppings tables
-- Run this in your Supabase SQL editor

-- Add updated_at column to menu_items table
ALTER TABLE menu_items 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- Add updated_at column to toppings table  
ALTER TABLE toppings 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- Create trigger for menu_items updated_at
CREATE OR REPLACE TRIGGER update_menu_items_updated_at 
    BEFORE UPDATE ON menu_items 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create trigger for toppings updated_at
CREATE OR REPLACE TRIGGER update_toppings_updated_at 
    BEFORE UPDATE ON toppings 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
