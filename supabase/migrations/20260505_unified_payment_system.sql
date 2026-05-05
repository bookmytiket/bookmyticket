-- ============================================================
-- Unified Multi-Provider Payment System Migration
-- ============================================================

-- 1. Enhance payments table
ALTER TABLE public.payments 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'event', -- 'event' or 'service'
ADD COLUMN IF NOT EXISTS reference_id UUID,        -- event_id or service_id
ADD COLUMN IF NOT EXISTS total_amount NUMERIC(12, 2),
ADD COLUMN IF NOT EXISTS base_amount NUMERIC(12, 2),
ADD COLUMN IF NOT EXISTS platform_fee NUMERIC(12, 2),
ADD COLUMN IF NOT EXISTS gst_amount_col NUMERIC(12, 2); -- avoiding conflict with existing gst_amount if any

-- 2. Create service_orders table
CREATE TABLE IF NOT EXISTS public.service_orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    service_provider_id UUID, -- References service_providers(id)
    payment_id UUID REFERENCES public.payments(id),
    status TEXT NOT NULL DEFAULT 'pending',
    booking_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create specialised wallet tables (or extend existing)
-- The user requested organiser_wallet and provider_wallet specifically.
-- We will create them to follow the spec strictly.

CREATE TABLE IF NOT EXISTS public.organiser_wallet (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organiser_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
    balance NUMERIC(12, 2) DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.provider_wallet (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    service_provider_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
    balance NUMERIC(12, 2) DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create platform_revenue table
CREATE TABLE IF NOT EXISTS public.platform_revenue (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    payment_id UUID REFERENCES public.payments(id),
    platform_fee NUMERIC(12, 2) DEFAULT 0.00,
    gst_amount NUMERIC(12, 2) DEFAULT 0.00,
    total_revenue NUMERIC(12, 2) DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Enhance wallet_transactions table
ALTER TABLE public.wallet_transactions 
ADD COLUMN IF NOT EXISTS provider_type TEXT, -- 'organiser' or 'service'
ADD COLUMN IF NOT EXISTS provider_id UUID;   -- organiser_id or service_provider_id

-- 6. Enable RLS
ALTER TABLE public.service_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organiser_wallet ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_wallet ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_revenue ENABLE ROW LEVEL SECURITY;

-- 7. Basic RLS Policies (Allow service role and owners)
CREATE POLICY "Service role full access service_orders" ON public.service_orders FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Users can view own service_orders" ON public.service_orders FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role full access organiser_wallet" ON public.organiser_wallet FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Organisers can view own wallet" ON public.organiser_wallet FOR SELECT USING (auth.uid() = organiser_id);

CREATE POLICY "Service role full access provider_wallet" ON public.provider_wallet FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Providers can view own wallet" ON public.provider_wallet FOR SELECT USING (auth.uid() = service_provider_id);

CREATE POLICY "Admin full access platform_revenue" ON public.platform_revenue FOR ALL USING (auth.role() = 'service_role');

-- 8. Seed: Initialize wallets for existing organisers from public.wallets if they exist
INSERT INTO public.organiser_wallet (organiser_id, balance)
SELECT organiser_id, balance FROM public.wallets
ON CONFLICT (organiser_id) DO NOTHING;
