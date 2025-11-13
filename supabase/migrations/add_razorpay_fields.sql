-- Add Razorpay fields to orders table
-- Migration: Add Razorpay payment integration fields

-- Add Razorpay columns to orders table
ALTER TABLE public.orders
ADD COLUMN razorpay_order_id TEXT,
ADD COLUMN razorpay_payment_id TEXT,
ADD COLUMN razorpay_signature TEXT;

-- Make qikink_order_id optional (for Razorpay orders that don't go through Qikink immediately)
ALTER TABLE public.orders
ALTER COLUMN qikink_order_id DROP NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN public.orders.razorpay_order_id IS 'Razorpay order ID for online payments';
COMMENT ON COLUMN public.orders.razorpay_payment_id IS 'Razorpay payment ID after successful payment';
COMMENT ON COLUMN public.orders.razorpay_signature IS 'Razorpay signature for payment verification';

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_orders_razorpay_payment_id ON public.orders(razorpay_payment_id);
CREATE INDEX IF NOT EXISTS idx_orders_razorpay_order_id ON public.orders(razorpay_order_id);