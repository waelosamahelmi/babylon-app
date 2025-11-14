-- Migration: Add branches table and update orders table
-- This migration adds support for multiple restaurant branches

-- Create branches table
CREATE TABLE IF NOT EXISTS branches (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  name_en TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  postal_code TEXT NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  display_order INTEGER DEFAULT 0,
  opening_hours JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Add branch_id column to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS branch_id INTEGER REFERENCES branches(id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_branches_is_active ON branches(is_active);
CREATE INDEX IF NOT EXISTS idx_branches_display_order ON branches(display_order);
CREATE INDEX IF NOT EXISTS idx_orders_branch_id ON orders(branch_id);

-- Insert sample branches (Lahti and Tampere)
INSERT INTO branches (name, name_en, address, city, postal_code, latitude, longitude, phone, email, display_order, is_active)
VALUES 
  ('Lahti', 'Lahti', 'Aleksanterinkatu 18', 'Lahti', '15140', 60.98267, 25.66151, '+358 3 782 2440', 'lahti@ravintolababylon.fi', 1, TRUE),
  ('Tampere', 'Tampere', 'Hämeenkatu 19', 'Tampere', '33200', 61.49772, 23.76093, '+358 3 123 4567', 'tampere@ravintolababylon.fi', 2, TRUE)
ON CONFLICT DO NOTHING;

COMMENT ON TABLE branches IS 'Restaurant branch locations for multi-location support';
COMMENT ON COLUMN orders.branch_id IS 'Reference to the branch that will process this order - used for delivery distance calculation';
