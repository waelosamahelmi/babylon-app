-- Ensure delivery_hours column exists in restaurant_settings table
-- This migration is idempotent and safe to run multiple times

-- Check and add delivery_hours column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'restaurant_settings' 
        AND column_name = 'delivery_hours'
    ) THEN
        ALTER TABLE public.restaurant_settings 
        ADD COLUMN delivery_hours text NOT NULL DEFAULT '11:00-22:00';
        
        RAISE NOTICE 'Added delivery_hours column to restaurant_settings';
    ELSE
        RAISE NOTICE 'delivery_hours column already exists';
    END IF;
END $$;

-- Ensure all required columns exist
DO $$
BEGIN
    -- opening_hours
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'restaurant_settings' 
        AND column_name = 'opening_hours'
    ) THEN
        ALTER TABLE public.restaurant_settings 
        ADD COLUMN opening_hours text NOT NULL DEFAULT '10:00-23:00';
    END IF;

    -- pickup_hours
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'restaurant_settings' 
        AND column_name = 'pickup_hours'
    ) THEN
        ALTER TABLE public.restaurant_settings 
        ADD COLUMN pickup_hours text NOT NULL DEFAULT '11:00-22:00';
    END IF;

    -- lunch_buffet_hours
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'restaurant_settings' 
        AND column_name = 'lunch_buffet_hours'
    ) THEN
        ALTER TABLE public.restaurant_settings 
        ADD COLUMN lunch_buffet_hours text NOT NULL DEFAULT '11:00-14:00';
    END IF;
END $$;

-- Refresh the schema cache
NOTIFY pgrst, 'reload schema';

-- Verify the columns exist
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'restaurant_settings'
  AND column_name IN ('opening_hours', 'pickup_hours', 'delivery_hours', 'lunch_buffet_hours')
ORDER BY column_name;
