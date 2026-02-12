-- Add monthly report settings columns to restaurant_settings table (legacy, kept for backwards compatibility)
ALTER TABLE restaurant_settings
ADD COLUMN IF NOT EXISTS monthly_report_email TEXT,
ADD COLUMN IF NOT EXISTS monthly_report_enabled BOOLEAN DEFAULT FALSE;

-- Add monthly report settings columns to branches table (per-branch reports)
ALTER TABLE branches
ADD COLUMN IF NOT EXISTS monthly_report_email TEXT,
ADD COLUMN IF NOT EXISTS monthly_report_enabled BOOLEAN DEFAULT FALSE;
