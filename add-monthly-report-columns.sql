-- Add monthly report settings columns to restaurant_settings table
ALTER TABLE restaurant_settings
ADD COLUMN IF NOT EXISTS monthly_report_email TEXT,
ADD COLUMN IF NOT EXISTS monthly_report_enabled BOOLEAN DEFAULT FALSE;
