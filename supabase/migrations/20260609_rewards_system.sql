-- Migration: Customer Rewards & Gift Voucher Module
-- Description: Core tables for managing campaigns, vouchers, and user rewards.

-- 1. Reward Campaigns Table
CREATE TABLE IF NOT EXISTS public.reward_campaigns (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    campaign_name TEXT NOT NULL,
    campaign_type TEXT NOT NULL, -- e.g., 'coupon', 'gift_card', 'sponsor_offer'
    sponsor_name TEXT,
    reward_value TEXT NOT NULL, -- e.g., '10% OFF', '₹500'
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    total_quantity INTEGER DEFAULT 0,
    eligibility_rules JSONB DEFAULT '{}'::jsonb, -- e.g., {"min_spend": 500, "categories": ["marathon"]}
    status TEXT DEFAULT 'active', -- 'active', 'paused', 'expired'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Reward Vouchers Pool
CREATE TABLE IF NOT EXISTS public.reward_vouchers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    campaign_id UUID REFERENCES public.reward_campaigns(id) ON DELETE CASCADE,
    voucher_code TEXT NOT NULL UNIQUE,
    voucher_value TEXT,
    expiry_date TIMESTAMPTZ,
    is_assigned BOOLEAN DEFAULT false,
    is_redeemed BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. User Rewards (Assigned Vouchers)
CREATE TABLE IF NOT EXISTS public.user_rewards (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    booking_id UUID, -- References your bookings table, left as UUID for flexibility
    voucher_id UUID REFERENCES public.reward_vouchers(id) ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    redeemed_at TIMESTAMPTZ,
    status TEXT DEFAULT 'active' -- 'active', 'redeemed', 'expired'
);

-- 4. Reward E-Cards
CREATE TABLE IF NOT EXISTS public.reward_ecards (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_reward_id UUID REFERENCES public.user_rewards(id) ON DELETE CASCADE,
    ecard_url TEXT,
    pdf_url TEXT,
    generated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

ALTER TABLE public.reward_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reward_vouchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reward_ecards ENABLE ROW LEVEL SECURITY;

-- Admins get full access to all tables
CREATE POLICY "Admins full access reward_campaigns" ON public.reward_campaigns FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));
CREATE POLICY "Admins full access reward_vouchers" ON public.reward_vouchers FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));
CREATE POLICY "Admins full access user_rewards" ON public.user_rewards FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));
CREATE POLICY "Admins full access reward_ecards" ON public.reward_ecards FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));

-- Users can view active campaigns (if needed for display)
CREATE POLICY "Users can view active campaigns" ON public.reward_campaigns FOR SELECT USING (status = 'active');

-- Users can view ONLY their own assigned rewards
CREATE POLICY "Users can view their own rewards" ON public.user_rewards FOR SELECT USING (auth.uid() = user_id);

-- Users can view their own e-cards (via joined user_rewards)
CREATE POLICY "Users can view their own ecards" ON public.reward_ecards FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.user_rewards ur WHERE ur.id = reward_ecards.user_reward_id AND ur.user_id = auth.uid())
);

-- System/Service role needs to bypass RLS to assign vouchers during booking.
-- Ensure you use the Service Role Key in backend booking APIs.

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_rewards_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_reward_campaigns
BEFORE UPDATE ON public.reward_campaigns
FOR EACH ROW
EXECUTE FUNCTION update_rewards_updated_at();
