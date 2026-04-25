-- Migration: Revenue Sharing System
-- Implementation of pricing structure:
-- Base Amount: ₹X
-- Platform Charge: 7% of Base
-- GST: 18% of Platform Charge
-- Partner Share: 2% of Base (from Platform Charge)
-- Final Amount: Base + Platform Charge + GST

-- 1. Add columns to turf_bookings
ALTER TABLE public.turf_bookings
ADD COLUMN IF NOT EXISTS base_amount FLOAT8,
ADD COLUMN IF NOT EXISTS platform_charge FLOAT8,
ADD COLUMN IF NOT EXISTS partner_bonus FLOAT8,
ADD COLUMN IF NOT EXISTS platform_revenue FLOAT8,
ADD COLUMN IF NOT EXISTS partner_total FLOAT8;

-- 2. Add columns to bookings (Events)
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS base_amount FLOAT8,
ADD COLUMN IF NOT EXISTS platform_charge FLOAT8,
ADD COLUMN IF NOT EXISTS partner_bonus FLOAT8,
ADD COLUMN IF NOT EXISTS platform_revenue FLOAT8,
ADD COLUMN IF NOT EXISTS partner_total FLOAT8;

-- 3. Update fee_settings to include new rates
ALTER TABLE public.fee_settings
ADD COLUMN IF NOT EXISTS partner_share_percent FLOAT8 DEFAULT 2;

-- Update existing fee_settings if any
UPDATE public.fee_settings
SET convenience_fee_value = 7,
    gst_percent = 18,
    partner_share_percent = 2
WHERE id IS NOT NULL; -- Apply to all existing rows
