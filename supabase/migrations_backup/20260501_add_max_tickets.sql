-- Add max_tickets to coupons table
ALTER TABLE public.coupons 
ADD COLUMN IF NOT EXISTS max_tickets INT4;

COMMENT ON COLUMN public.coupons.max_tickets IS 'Maximum number of tickets allowed in an order for this coupon to be valid';
