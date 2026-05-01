-- Phase 1: Coupon and Wallet System Migration

-- Resolve naming conflict: If an old 'coupons' table exists (branding-related), rename it
DO $$ 
BEGIN 
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='coupons' AND column_name='brand_id') THEN
        ALTER TABLE IF EXISTS public.coupons RENAME TO legacy_branding_coupons;
    END IF;
END $$;

-- 1. Coupons Table
CREATE TABLE IF NOT EXISTS public.coupons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT UNIQUE NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('percent', 'fixed')),
    value FLOAT8 NOT NULL,
    min_tickets INT4 DEFAULT 1,
    usage_limit_per_user INT4 DEFAULT 1,
    global_usage_limit INT4,
    expiry_date TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE,
    applicable_events UUID[], -- Array of event IDs, NULL means all
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Coupon Usage Tracking
CREATE TABLE IF NOT EXISTS public.coupon_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    coupon_id UUID REFERENCES public.coupons(id) ON DELETE CASCADE,
    booking_id UUID, -- Will be linked after booking is confirmed
    used_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Wallets Table
CREATE TABLE IF NOT EXISTS public.wallets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organiser_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
    balance FLOAT8 DEFAULT 0,
    currency TEXT DEFAULT 'INR',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Wallet Transactions
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organiser_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    booking_id UUID,
    amount FLOAT8 NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('credit', 'debit')),
    description TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Withdrawal Requests
CREATE TABLE IF NOT EXISTS public.withdraw_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organiser_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    amount FLOAT8 NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'processed')),
    admin_notes TEXT,
    payout_details JSONB, -- Bank details, UPI, etc.
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupon_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdraw_requests ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Coupons are viewable by everyone" ON public.coupons FOR SELECT USING (is_active = true);
CREATE POLICY "Admins have full access to coupons" ON public.coupons FOR ALL USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

CREATE POLICY "Users can view own coupon usage" ON public.coupon_usage FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Admins can view all coupon usage" ON public.coupon_usage FOR SELECT USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

CREATE POLICY "Organisers can view own wallet" ON public.wallets FOR SELECT USING (organiser_id = auth.uid());
CREATE POLICY "Admins can view all wallets" ON public.wallets FOR SELECT USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

CREATE POLICY "Organisers can view own transactions" ON public.wallet_transactions FOR SELECT USING (organiser_id = auth.uid());
CREATE POLICY "Admins can view all transactions" ON public.wallet_transactions FOR SELECT USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

CREATE POLICY "Organisers can manage own withdraw requests" ON public.withdraw_requests FOR ALL USING (organiser_id = auth.uid());
CREATE POLICY "Admins can manage all withdraw requests" ON public.withdraw_requests FOR ALL USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- Functions & Triggers
-- Automatically create wallet for new organisers/vendors
CREATE OR REPLACE FUNCTION public.handle_new_organiser_wallet()
RETURNS TRIGGER AS $$
BEGIN
  IF (NEW.role = 'organiser' OR NEW.role = 'vendor') THEN
    INSERT INTO public.wallets (organiser_id)
    VALUES (NEW.id)
    ON CONFLICT (organiser_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_profile_role_update
  AFTER INSERT OR UPDATE OF role ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_organiser_wallet();
