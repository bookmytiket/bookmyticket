-- Migration: create_booking_sessions_and_coupon_logs
-- Ensure all tables exist with exactly matching schemas

-- 1. Create booking_sessions
CREATE TABLE IF NOT EXISTS public.booking_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
    package_id TEXT,
    participant_data JSONB DEFAULT '{}'::jsonb,
    pricing_snapshot JSONB DEFAULT '{}'::jsonb,
    status TEXT DEFAULT 'pending',
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Alter partners
ALTER TABLE public.partners ADD COLUMN IF NOT EXISTS prefix TEXT;

-- Alter partner_campaigns
ALTER TABLE public.partner_campaigns ADD COLUMN IF NOT EXISTS event_id UUID REFERENCES public.events(id) ON DELETE SET NULL;
ALTER TABLE public.partner_campaigns ADD COLUMN IF NOT EXISTS offer_type TEXT;
ALTER TABLE public.partner_campaigns ADD COLUMN IF NOT EXISTS discount_type TEXT;
ALTER TABLE public.partner_campaigns ADD COLUMN IF NOT EXISTS discount_value NUMERIC(10, 2);
ALTER TABLE public.partner_campaigns ADD COLUMN IF NOT EXISTS min_booking_amount NUMERIC(10, 2);

-- Alter coupon_inventory
ALTER TABLE public.coupon_inventory ADD COLUMN IF NOT EXISTS assigned_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.coupon_inventory ADD COLUMN IF NOT EXISTS assigned_booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL;
ALTER TABLE public.coupon_inventory ADD COLUMN IF NOT EXISTS redeemed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.coupon_inventory DROP CONSTRAINT IF EXISTS coupon_code_unique;
ALTER TABLE public.coupon_inventory ADD CONSTRAINT coupon_code_unique UNIQUE (coupon_code);

-- Create coupon_usage_logs
CREATE TABLE IF NOT EXISTS public.coupon_usage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    coupon_id UUID REFERENCES public.coupon_inventory(id) ON DELETE CASCADE,
    booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Create payment_transactions
CREATE TABLE IF NOT EXISTS public.payment_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
    gateway TEXT NOT NULL,
    gateway_order_id TEXT,
    payment_status TEXT NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    response_payload JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable RLS
ALTER TABLE public.booking_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupon_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

-- Policies for booking_sessions
DROP POLICY IF EXISTS "Users can manage own booking_sessions" ON public.booking_sessions;
CREATE POLICY "Users can manage own booking_sessions" ON public.booking_sessions
    FOR ALL USING (auth.uid() = user_id OR auth.role() = 'service_role');

-- Policies for coupon_usage_logs
DROP POLICY IF EXISTS "Users can view own coupon_usage_logs" ON public.coupon_usage_logs;
CREATE POLICY "Users can view own coupon_usage_logs" ON public.coupon_usage_logs
    FOR SELECT USING (auth.uid() = user_id OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "Users can insert own coupon_usage_logs" ON public.coupon_usage_logs;
CREATE POLICY "Users can insert own coupon_usage_logs" ON public.coupon_usage_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id OR auth.role() = 'service_role');

-- Policies for payment_transactions
DROP POLICY IF EXISTS "Users can view own payment_transactions" ON public.payment_transactions;
CREATE POLICY "Users can view own payment_transactions" ON public.payment_transactions
    FOR SELECT USING (
        booking_id IN (SELECT id FROM public.bookings WHERE user_id = auth.uid()) OR auth.role() = 'service_role'
    );

DROP POLICY IF EXISTS "Service role full access payment_transactions" ON public.payment_transactions;
CREATE POLICY "Service role full access payment_transactions" ON public.payment_transactions
    FOR ALL USING (auth.role() = 'service_role');
