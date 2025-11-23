-- Fix payment_method constraint in babylon-app
-- Run this migration to remove the restrictive CHECK constraint

-- Drop the existing constraint if it exists
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.constraint_column_usage 
        WHERE table_schema = 'public' 
        AND table_name = 'orders' 
        AND constraint_name = 'orders_payment_method_check'
    ) THEN
        ALTER TABLE public.orders DROP CONSTRAINT orders_payment_method_check;
        RAISE NOTICE 'Dropped old payment_method constraint';
    ELSE
        RAISE NOTICE 'No payment_method constraint found';
    END IF;
END $$;

-- Verify the change
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.orders'::regclass
AND conname LIKE '%payment%';

-- Show current payment methods in use
SELECT DISTINCT payment_method, COUNT(*) as count
FROM public.orders
GROUP BY payment_method
ORDER BY count DESC;
