-- Fix order status constraint to match application logic
-- The application uses 'accepted' and 'completed', but the database constraint
-- only allows 'confirmed' and 'delivered'

-- Drop the existing check constraint
ALTER TABLE public.orders
  DROP CONSTRAINT IF EXISTS orders_status_check;

-- Add the updated check constraint with correct status values
ALTER TABLE public.orders
  ADD CONSTRAINT orders_status_check
  CHECK (status IN ('pending', 'accepted', 'confirmed', 'preparing', 'ready', 'completed', 'delivered', 'cancelled'));

-- Update any existing 'confirmed' status to 'accepted'
UPDATE public.orders
SET status = 'accepted'
WHERE status = 'confirmed';

-- Update any existing 'delivered' status to 'completed'
UPDATE public.orders
SET status = 'completed'
WHERE status = 'delivered';

-- Add comment explaining the status flow
COMMENT ON COLUMN public.orders.status IS
'Order status flow: pending -> accepted -> preparing -> ready -> completed (or cancelled at any step).
Legacy values: confirmed (now accepted), delivered (now completed)';
