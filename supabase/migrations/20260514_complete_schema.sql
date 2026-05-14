-- ============================================================
-- BookMyTicket — Complete Schema Migration
-- Run this in the Supabase SQL Editor (as service_role)
-- ============================================================

-- ============================================================
-- 1. SEAT MAPS & INVENTORY
-- ============================================================
CREATE TABLE IF NOT EXISTS public.seat_layouts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organiser_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    layout_type TEXT NOT NULL DEFAULT 'block', -- 'block', 'image', 'stadium'
    svg_data TEXT,          -- SVG seat map
    image_url TEXT,         -- for image-based layouts
    rows INTEGER DEFAULT 0,
    cols INTEGER DEFAULT 0,
    total_seats INTEGER DEFAULT 0,
    config JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.seat_inventory (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    layout_id UUID REFERENCES public.seat_layouts(id) ON DELETE SET NULL,
    seat_number TEXT NOT NULL,
    row_label TEXT,
    col_label TEXT,
    category TEXT DEFAULT 'General',
    price NUMERIC(10,2) DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'available', -- 'available', 'locked', 'booked', 'blocked'
    locked_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    locked_at TIMESTAMPTZ,
    booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(event_id, seat_number)
);

CREATE TABLE IF NOT EXISTS public.event_seat_maps (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id UUID UNIQUE NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    layout_id UUID NOT NULL REFERENCES public.seat_layouts(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 2. PAYOUT REQUESTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.payout_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    requester_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    requester_type TEXT NOT NULL DEFAULT 'organiser', -- 'organiser', 'provider'
    event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
    amount NUMERIC(12,2) NOT NULL,
    gst_amount NUMERIC(10,2) DEFAULT 0,
    commission_amount NUMERIC(10,2) DEFAULT 0,
    net_amount NUMERIC(12,2) NOT NULL,
    currency TEXT DEFAULT 'INR',
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'processing', 'paid', 'rejected'
    bank_name TEXT,
    account_number TEXT,
    ifsc_code TEXT,
    upi_id TEXT,
    payment_mode TEXT DEFAULT 'bank_transfer',
    admin_notes TEXT,
    processed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    processed_at TIMESTAMPTZ,
    transaction_ref TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 3. STAFF MANAGEMENT
-- ============================================================
CREATE TABLE IF NOT EXISTS public.organiser_staff (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organiser_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    role TEXT NOT NULL DEFAULT 'scanner', -- 'scanner', 'manager', 'coordinator'
    pin TEXT,                              -- 4-digit PIN for scanner login
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.event_staff (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    staff_id UUID NOT NULL REFERENCES public.organiser_staff(id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    organiser_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    UNIQUE(staff_id, event_id)
);

CREATE TABLE IF NOT EXISTS public.staff_device_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    staff_id UUID NOT NULL REFERENCES public.organiser_staff(id) ON DELETE CASCADE,
    device_id TEXT NOT NULL,
    device_name TEXT,
    ip_address TEXT,
    is_active BOOLEAN DEFAULT true,
    last_active TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(staff_id, device_id)
);

CREATE TABLE IF NOT EXISTS public.scanner_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    staff_id UUID REFERENCES public.organiser_staff(id) ON DELETE SET NULL,
    booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
    ticket_id UUID REFERENCES public.tickets(id) ON DELETE SET NULL,
    ticket_number TEXT,
    scan_result TEXT NOT NULL DEFAULT 'success', -- 'success', 'duplicate', 'invalid', 'expired'
    scanned_at TIMESTAMPTZ DEFAULT NOW(),
    device_id TEXT,
    notes TEXT
);

-- ============================================================
-- 4. PROVIDER PLATFORM
-- ============================================================
CREATE TABLE IF NOT EXISTS public.service_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    icon TEXT,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default categories
INSERT INTO public.service_categories (name, slug, icon, description) VALUES
    ('Photographer', 'photographer', '📸', 'Professional event and wedding photographers'),
    ('Videographer', 'videographer', '🎥', 'Professional videographers and cinematographers'),
    ('Catering', 'catering', '🍽️', 'Event catering and food services'),
    ('Decoration', 'decoration', '🎪', 'Event decoration and stage design'),
    ('Music Band', 'music-band', '🎵', 'Live music bands and performers'),
    ('Event Host/MC', 'event-host', '🎤', 'Professional event hosts and MCs'),
    ('Trainer/Coach', 'trainer', '🏋️', 'Sports trainers and fitness coaches'),
    ('Venue Provider', 'venue', '🏛️', 'Venues and event spaces')
ON CONFLICT (slug) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.provider_services (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    provider_id UUID NOT NULL REFERENCES public.service_providers(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES public.service_categories(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    base_price NUMERIC(10,2) DEFAULT 0,
    price_unit TEXT DEFAULT 'per_event', -- 'per_event', 'per_hour', 'per_day', 'per_person'
    min_hours INTEGER,
    max_hours INTEGER,
    advance_notice_hours INTEGER DEFAULT 24,
    is_active BOOLEAN DEFAULT true,
    tags TEXT[],
    portfolio_images TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.service_packages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    provider_id UUID NOT NULL REFERENCES public.service_providers(id) ON DELETE CASCADE,
    service_id UUID NOT NULL REFERENCES public.provider_services(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC(10,2) NOT NULL,
    duration TEXT,
    inclusions TEXT[],
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.provider_availability (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    provider_id UUID NOT NULL REFERENCES public.service_providers(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    is_available BOOLEAN DEFAULT true,
    slots JSONB DEFAULT '[]', -- [{start: "09:00", end: "18:00", available: true}]
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(provider_id, date)
);

CREATE TABLE IF NOT EXISTS public.service_bookings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    provider_id UUID NOT NULL REFERENCES public.service_providers(id) ON DELETE CASCADE,
    service_id UUID NOT NULL REFERENCES public.provider_services(id) ON DELETE CASCADE,
    package_id UUID REFERENCES public.service_packages(id) ON DELETE SET NULL,
    event_name TEXT,
    event_date DATE,
    event_location TEXT,
    start_time TEXT,
    end_time TEXT,
    guest_count INTEGER,
    budget_range TEXT,
    special_requirements TEXT,
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'confirmed', 'in_progress', 'completed', 'cancelled'
    total_amount NUMERIC(10,2),
    advance_paid NUMERIC(10,2) DEFAULT 0,
    payment_status TEXT DEFAULT 'unpaid',
    booking_notes TEXT,
    customer_rating INTEGER CHECK (customer_rating BETWEEN 1 AND 5),
    customer_review TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.provider_wallets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    provider_id UUID UNIQUE NOT NULL REFERENCES public.service_providers(id) ON DELETE CASCADE,
    balance NUMERIC(12,2) DEFAULT 0,
    total_earned NUMERIC(12,2) DEFAULT 0,
    total_withdrawn NUMERIC(12,2) DEFAULT 0,
    on_hold NUMERIC(12,2) DEFAULT 0,
    currency TEXT DEFAULT 'INR',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.provider_wallet_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    provider_id UUID NOT NULL REFERENCES public.service_providers(id) ON DELETE CASCADE,
    booking_id UUID REFERENCES public.service_bookings(id) ON DELETE SET NULL,
    type TEXT NOT NULL, -- 'credit', 'debit', 'hold', 'release'
    amount NUMERIC(10,2) NOT NULL,
    balance_after NUMERIC(12,2),
    description TEXT,
    reference_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.provider_payouts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    provider_id UUID NOT NULL REFERENCES public.service_providers(id) ON DELETE CASCADE,
    amount NUMERIC(12,2) NOT NULL,
    net_amount NUMERIC(12,2) NOT NULL,
    commission_amount NUMERIC(10,2) DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'pending',
    bank_name TEXT,
    account_number TEXT,
    ifsc_code TEXT,
    upi_id TEXT,
    payment_mode TEXT DEFAULT 'bank_transfer',
    processed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    processed_at TIMESTAMPTZ,
    transaction_ref TEXT,
    admin_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 5. NOTIFICATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'info', -- 'info', 'booking', 'payment', 'alert', 'promo', 'event'
    icon TEXT,
    action_url TEXT,
    data JSONB DEFAULT '{}',
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    email_bookings BOOLEAN DEFAULT true,
    email_promotions BOOLEAN DEFAULT true,
    push_enabled BOOLEAN DEFAULT true,
    push_token TEXT,
    push_platform TEXT, -- 'ios', 'android', 'web'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 6. REVIEWS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
    service_provider_id UUID REFERENCES public.service_providers(id) ON DELETE CASCADE,
    booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    title TEXT,
    content TEXT,
    images TEXT[],
    is_verified BOOLEAN DEFAULT false,
    is_approved BOOLEAN DEFAULT true,
    organiser_reply TEXT,
    replied_at TIMESTAMPTZ,
    helpful_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CHECK (event_id IS NOT NULL OR service_provider_id IS NOT NULL)
);

-- ============================================================
-- 7. WISHLIST
-- ============================================================
CREATE TABLE IF NOT EXISTS public.user_wishlists (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, event_id)
);

-- ============================================================
-- 8. SUBSCRIPTION PLANS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.package_plans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    plan_type TEXT DEFAULT 'organiser', -- 'organiser', 'provider'
    description TEXT,
    price_monthly NUMERIC(10,2) DEFAULT 0,
    price_yearly NUMERIC(10,2) DEFAULT 0,
    features JSONB DEFAULT '[]',
    limits JSONB DEFAULT '{}', -- {"max_events": 5, "max_staff": 2, ...}
    commission_rate NUMERIC(5,2) DEFAULT 10.00,
    is_active BOOLEAN DEFAULT true,
    is_popular BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default plans
INSERT INTO public.package_plans (name, slug, plan_type, price_monthly, price_yearly, features, limits, commission_rate, is_popular)
VALUES
    ('Starter', 'starter', 'organiser', 0, 0, '["3 events/month", "Basic analytics", "Email support"]', '{"max_events": 3, "max_staff": 1, "max_tickets": 200}', 12.00, false),
    ('Pro', 'pro', 'organiser', 999, 9990, '["Unlimited events", "Advanced analytics", "Staff management", "Priority support", "Custom coupons"]', '{"max_events": -1, "max_staff": 10, "max_tickets": -1}', 8.00, true),
    ('Enterprise', 'enterprise', 'organiser', 2999, 29990, '["All Pro features", "Dedicated account manager", "Custom branding", "API access", "GST reports"]', '{"max_events": -1, "max_staff": -1, "max_tickets": -1}', 5.00, false)
ON CONFLICT (slug) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES public.package_plans(id),
    status TEXT NOT NULL DEFAULT 'active', -- 'active', 'cancelled', 'expired', 'paused'
    billing_cycle TEXT DEFAULT 'monthly',
    started_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    payment_id TEXT,
    razorpay_subscription_id TEXT,
    auto_renew BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 9. ANALYTICS & AUDIT
-- ============================================================
CREATE TABLE IF NOT EXISTS public.analytics_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_type TEXT NOT NULL, -- 'page_view', 'ticket_view', 'booking_start', 'booking_complete', 'coupon_apply', etc.
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    session_id TEXT,
    device_type TEXT,
    platform TEXT DEFAULT 'web',
    city TEXT,
    district TEXT,
    referrer TEXT,
    properties JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    actor_role TEXT,
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id UUID,
    old_data JSONB,
    new_data JSONB,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.admin_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    key TEXT UNIQUE NOT NULL,
    value JSONB,
    description TEXT,
    is_public BOOLEAN DEFAULT false,
    updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 10. FLASH DEALS (enhance existing)
-- ============================================================
-- Add admin_notes column if not exists
ALTER TABLE public.flash_deals ADD COLUMN IF NOT EXISTS admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.flash_deals ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

-- ============================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_seat_inventory_event_status ON public.seat_inventory(event_id, status);
CREATE INDEX IF NOT EXISTS idx_seat_inventory_locked_at ON public.seat_inventory(locked_at) WHERE status = 'locked';
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_reviews_event ON public.reviews(event_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_type ON public.analytics_events(event_type, created_at);
CREATE INDEX IF NOT EXISTS idx_payout_requests_status ON public.payout_requests(status, created_at);
CREATE INDEX IF NOT EXISTS idx_service_bookings_status ON public.service_bookings(status, created_at);
CREATE INDEX IF NOT EXISTS idx_user_wishlists_user ON public.user_wishlists(user_id);
CREATE INDEX IF NOT EXISTS idx_organiser_staff_organiser ON public.organiser_staff(organiser_id);
CREATE INDEX IF NOT EXISTS idx_scanner_logs_event ON public.scanner_logs(event_id, scanned_at);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_status ON public.subscriptions(user_id, status);

-- ============================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================

-- Enable RLS on all new tables
ALTER TABLE public.seat_layouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seat_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_seat_maps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payout_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organiser_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_device_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scanner_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.package_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

-- Seat Layouts: organisers can CRUD their own
CREATE POLICY "Organisers manage own seat layouts" ON public.seat_layouts
    FOR ALL USING (organiser_id = auth.uid()) WITH CHECK (organiser_id = auth.uid());
CREATE POLICY "Public can view seat layouts" ON public.seat_layouts
    FOR SELECT USING (true);

-- Seat Inventory: public can view, system manages locking
CREATE POLICY "Public can view seat inventory" ON public.seat_inventory
    FOR SELECT USING (true);
CREATE POLICY "Authenticated users can lock seats" ON public.seat_inventory
    FOR UPDATE USING (auth.uid() IS NOT NULL AND status = 'available')
    WITH CHECK (locked_by = auth.uid());
CREATE POLICY "Service role full access seat inventory" ON public.seat_inventory
    FOR ALL USING (auth.role() = 'service_role');

-- Payout Requests: requester sees own, admin sees all
CREATE POLICY "Users see own payout requests" ON public.payout_requests
    FOR SELECT USING (requester_id = auth.uid());
CREATE POLICY "Users can create payout requests" ON public.payout_requests
    FOR INSERT WITH CHECK (requester_id = auth.uid());
CREATE POLICY "Service role full access payouts" ON public.payout_requests
    FOR ALL USING (auth.role() = 'service_role');

-- Staff: organisers manage own staff
CREATE POLICY "Organisers manage own staff" ON public.organiser_staff
    FOR ALL USING (organiser_id = auth.uid()) WITH CHECK (organiser_id = auth.uid());
CREATE POLICY "Staff can view own record" ON public.organiser_staff
    FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Service role full access staff" ON public.organiser_staff
    FOR ALL USING (auth.role() = 'service_role');

-- Event Staff
CREATE POLICY "Organisers manage event staff" ON public.event_staff
    FOR ALL USING (organiser_id = auth.uid());
CREATE POLICY "Service role full access event staff" ON public.event_staff
    FOR ALL USING (auth.role() = 'service_role');

-- Scanner Logs: organisers see their event logs
CREATE POLICY "Organisers see own event scanner logs" ON public.scanner_logs
    FOR SELECT USING (event_id IN (SELECT id FROM public.events WHERE organiser_id = auth.uid()));
CREATE POLICY "Service role full access scanner logs" ON public.scanner_logs
    FOR ALL USING (auth.role() = 'service_role');

-- Service Categories: public read
CREATE POLICY "Public can view service categories" ON public.service_categories
    FOR SELECT USING (is_active = true);
CREATE POLICY "Service role manages categories" ON public.service_categories
    FOR ALL USING (auth.role() = 'service_role');

-- Provider Services: public read, providers manage own
CREATE POLICY "Public can view active provider services" ON public.provider_services
    FOR SELECT USING (is_active = true);
CREATE POLICY "Providers manage own services" ON public.provider_services
    FOR ALL USING (
        provider_id IN (SELECT id FROM public.service_providers WHERE organiser_id = auth.uid())
    );

-- Service Bookings: customers and providers see their own
CREATE POLICY "Customers see own service bookings" ON public.service_bookings
    FOR SELECT USING (customer_id = auth.uid());
CREATE POLICY "Providers see their service bookings" ON public.service_bookings
    FOR SELECT USING (
        provider_id IN (SELECT id FROM public.service_providers WHERE organiser_id = auth.uid())
    );
CREATE POLICY "Customers can create service bookings" ON public.service_bookings
    FOR INSERT WITH CHECK (customer_id = auth.uid());
CREATE POLICY "Providers can update service booking status" ON public.service_bookings
    FOR UPDATE USING (
        provider_id IN (SELECT id FROM public.service_providers WHERE organiser_id = auth.uid())
    );
CREATE POLICY "Service role full access service bookings" ON public.service_bookings
    FOR ALL USING (auth.role() = 'service_role');

-- Notifications: users see own
CREATE POLICY "Users see own notifications" ON public.notifications
    FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users update own notifications" ON public.notifications
    FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Service role manages notifications" ON public.notifications
    FOR ALL USING (auth.role() = 'service_role');

-- Reviews: public read, authenticated write
CREATE POLICY "Public can view approved reviews" ON public.reviews
    FOR SELECT USING (is_approved = true);
CREATE POLICY "Authenticated users can write reviews" ON public.reviews
    FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own reviews" ON public.reviews
    FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Service role full access reviews" ON public.reviews
    FOR ALL USING (auth.role() = 'service_role');

-- Wishlists: users see/manage own
CREATE POLICY "Users manage own wishlist" ON public.user_wishlists
    FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Package Plans: public read
CREATE POLICY "Public can view active plans" ON public.package_plans
    FOR SELECT USING (is_active = true);
CREATE POLICY "Service role manages plans" ON public.package_plans
    FOR ALL USING (auth.role() = 'service_role');

-- Subscriptions: users see own
CREATE POLICY "Users see own subscriptions" ON public.subscriptions
    FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Service role manages subscriptions" ON public.subscriptions
    FOR ALL USING (auth.role() = 'service_role');

-- Provider Wallets
CREATE POLICY "Providers see own wallet" ON public.provider_wallets
    FOR SELECT USING (
        provider_id IN (SELECT id FROM public.service_providers WHERE organiser_id = auth.uid())
    );
CREATE POLICY "Service role manages provider wallets" ON public.provider_wallets
    FOR ALL USING (auth.role() = 'service_role');

-- Admin Settings: public read for public settings
CREATE POLICY "Public can read public admin settings" ON public.admin_settings
    FOR SELECT USING (is_public = true);
CREATE POLICY "Service role manages admin settings" ON public.admin_settings
    FOR ALL USING (auth.role() = 'service_role');

-- Audit Logs: service role only
CREATE POLICY "Service role manages audit logs" ON public.audit_logs
    FOR ALL USING (auth.role() = 'service_role');
