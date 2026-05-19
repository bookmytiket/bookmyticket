-- ============================================================
-- BookMyTicket — PARTNER COUPON REDEMPTION & REWARDS SYSTEM
-- ============================================================

-- 1. Create partners table
CREATE TABLE IF NOT EXISTS public.partners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    logo_url TEXT,
    category TEXT,
    description TEXT,
    agreement_url TEXT,
    agreement_start DATE,
    agreement_end DATE,
    contact_name TEXT,
    contact_email TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable RLS for partners
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins have full access to partners" ON public.partners;
CREATE POLICY "Admins have full access to partners" ON public.partners FOR ALL USING (public.is_platform_admin());
DROP POLICY IF EXISTS "Anyone can view active partners" ON public.partners;
CREATE POLICY "Anyone can view active partners" ON public.partners FOR SELECT USING (is_active = true);

-- 2. Create partner_campaigns table
CREATE TABLE IF NOT EXISTS public.partner_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    partner_id UUID REFERENCES public.partners(id) ON DELETE CASCADE,
    campaign_name TEXT NOT NULL,
    offer_title TEXT NOT NULL,
    offer_description TEXT,
    terms TEXT,
    redeem_url TEXT,
    start_date DATE,
    end_date DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable RLS for partner_campaigns
ALTER TABLE public.partner_campaigns ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins have full access to partner_campaigns" ON public.partner_campaigns;
CREATE POLICY "Admins have full access to partner_campaigns" ON public.partner_campaigns FOR ALL USING (public.is_platform_admin());
DROP POLICY IF EXISTS "Anyone can view active campaigns" ON public.partner_campaigns;
CREATE POLICY "Anyone can view active campaigns" ON public.partner_campaigns FOR SELECT USING (is_active = true);

-- 3. Create coupon_inventory table
CREATE TABLE IF NOT EXISTS public.coupon_inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID REFERENCES public.partner_campaigns(id) ON DELETE CASCADE,
    coupon_code TEXT NOT NULL,
    status TEXT DEFAULT 'available', -- 'available', 'assigned', 'redeemed', 'expired'
    assigned_user_id UUID,
    assigned_booking_id UUID,
    expires_at TIMESTAMP WITH TIME ZONE,
    redeemed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable RLS for coupon_inventory
ALTER TABLE public.coupon_inventory ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins have full access to coupon_inventory" ON public.coupon_inventory;
CREATE POLICY "Admins have full access to coupon_inventory" ON public.coupon_inventory FOR ALL USING (public.is_platform_admin());
DROP POLICY IF EXISTS "Users can view assigned coupons" ON public.coupon_inventory;
CREATE POLICY "Users can view assigned coupons" ON public.coupon_inventory FOR SELECT USING (auth.uid() = assigned_user_id);

-- 4. Create event_coupon_mapping table
CREATE TABLE IF NOT EXISTS public.event_coupon_mapping (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL,
    campaign_id UUID REFERENCES public.partner_campaigns(id) ON DELETE CASCADE,
    is_enabled BOOLEAN DEFAULT true,
    allocation_limit INTEGER DEFAULT 100,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable RLS for event_coupon_mapping
ALTER TABLE public.event_coupon_mapping ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins have full access to event_coupon_mapping" ON public.event_coupon_mapping;
CREATE POLICY "Admins have full access to event_coupon_mapping" ON public.event_coupon_mapping FOR ALL USING (public.is_platform_admin());
DROP POLICY IF EXISTS "Anyone can view mappings" ON public.event_coupon_mapping;
CREATE POLICY "Anyone can view mappings" ON public.event_coupon_mapping FOR SELECT USING (true);

-- 5. Create user_coupon_rewards table
CREATE TABLE IF NOT EXISTS public.user_coupon_rewards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    booking_id UUID NOT NULL,
    coupon_inventory_id UUID REFERENCES public.coupon_inventory(id) ON DELETE CASCADE,
    reward_status TEXT DEFAULT 'unlocked', -- 'unlocked', 'redeemed', 'expired', 'invalid'
    unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    redeemed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable RLS for user_coupon_rewards
ALTER TABLE public.user_coupon_rewards ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own rewards" ON public.user_coupon_rewards;
CREATE POLICY "Users can view their own rewards" ON public.user_coupon_rewards FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Admins have full access to user_coupon_rewards" ON public.user_coupon_rewards;
CREATE POLICY "Admins have full access to user_coupon_rewards" ON public.user_coupon_rewards FOR ALL USING (public.is_platform_admin());

-- 6. Create coupon_redemption_logs table
CREATE TABLE IF NOT EXISTS public.coupon_redemption_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    coupon_id UUID REFERENCES public.coupon_inventory(id) ON DELETE CASCADE,
    action TEXT NOT NULL, -- e.g. 'view', 'copy', 'redeem'
    ip_address TEXT,
    device_info TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable RLS for coupon_redemption_logs
ALTER TABLE public.coupon_redemption_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins have full access to coupon_redemption_logs" ON public.coupon_redemption_logs;
CREATE POLICY "Admins have full access to coupon_redemption_logs" ON public.coupon_redemption_logs FOR ALL USING (public.is_platform_admin());

-- 7. Create coupon_notifications table
CREATE TABLE IF NOT EXISTS public.coupon_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    coupon_id UUID REFERENCES public.coupon_inventory(id) ON DELETE CASCADE,
    channel TEXT NOT NULL, -- 'push', 'email', 'sms', 'in-app'
    status TEXT DEFAULT 'pending', -- 'pending', 'sent', 'failed'
    sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable RLS for coupon_notifications
ALTER TABLE public.coupon_notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins have full access to coupon_notifications" ON public.coupon_notifications;
CREATE POLICY "Admins have full access to coupon_notifications" ON public.coupon_notifications FOR ALL USING (public.is_platform_admin());
