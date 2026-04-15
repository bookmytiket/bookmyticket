-- BookMyTicket Supabase Schema

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

--------------------------------------------------------------------------------
-- 1. AUTH & PROFILES
--------------------------------------------------------------------------------

-- Profiles table to unify all user types
-- Links to auth.users (Supabase managed)
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    username TEXT UNIQUE,
    phone TEXT,
    role TEXT NOT NULL DEFAULT 'user', -- 'user', 'admin', 'organiser', 'vendor', 'staff'
    status TEXT DEFAULT 'Active',
    avatar_url TEXT,
    selected_city TEXT,
    location_hierarchy JSONB,
    last_login TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Organisere / Vendor specific details
CREATE TABLE public.organiser_details (
    id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    business_name TEXT,
    category TEXT, -- 'Mehendi Artist', 'Photographer', etc.
    type TEXT, -- 'event_organiser' | 'professional_service'
    kyc_status TEXT DEFAULT 'Not Started',
    is_approved BOOLEAN DEFAULT FALSE,
    wallet_balance FLOAT8 DEFAULT 0,
    kyc_details JSONB,
    force_password_change BOOLEAN DEFAULT FALSE,
    lat FLOAT8,
    lng FLOAT8,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Staff table (linked to organiser)
CREATE TABLE public.staff_details (
    id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    organiser_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

--------------------------------------------------------------------------------
-- 2. EVENTS & BOOKINGS
--------------------------------------------------------------------------------

CREATE TABLE public.events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organiser_id UUID REFERENCES public.profiles(id),
    title TEXT NOT NULL,
    category TEXT,
    type TEXT,
    date DATE,
    time TEXT,
    img TEXT,
    banner_preview TEXT,
    seating_enabled BOOLEAN DEFAULT FALSE,
    total_seats INT4,
    price FLOAT8,
    location TEXT,
    venue TEXT,
    address TEXT,
    country TEXT,
    state TEXT,
    district TEXT,
    city TEXT,
    featured BOOLEAN DEFAULT FALSE,
    trending BOOLEAN DEFAULT FALSE,
    spotlight BOOLEAN DEFAULT FALSE,
    exclusive BOOLEAN DEFAULT FALSE,
    status TEXT DEFAULT 'Draft',
    environment TEXT, -- 'Indoor' or 'Outdoor'
    description TEXT,
    meeting_url TEXT,
    meeting_type TEXT, -- 'internal' or 'external'
    external_meeting_url TEXT,
    virtual BOOLEAN DEFAULT FALSE,
    rows INT4,
    cols INT4,
    normal_ticket_capacity INT4,
    normal_ticket_price FLOAT8,
    seat_categories JSONB, -- Array of seat categories
    date_slots JSONB, -- Array of date slots
    layout_type TEXT,
    seat_map_background_url TEXT,
    blocks JSONB, -- Array of blocks
    end_date_time BIGINT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES public.events(id),
    user_id UUID REFERENCES public.profiles(id),
    ticket_count INT4 NOT NULL,
    total_price FLOAT8 NOT NULL,
    customer_details JSONB,
    status TEXT NOT NULL DEFAULT 'Pending',
    payment_intent_id TEXT,
    scanned BOOLEAN DEFAULT FALSE,
    scanned_at TIMESTAMPTZ,
    selected_seats JSONB,
    taxable_amount FLOAT8,
    gst_amount FLOAT8,
    gst_breakdown JSONB,
    invoice_number TEXT UNIQUE,
    is_gst_applied BOOLEAN DEFAULT FALSE,
    invoice_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.pwa_scans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID REFERENCES public.bookings(id),
    event_id UUID REFERENCES public.events(id),
    organiser_id UUID REFERENCES public.profiles(id),
    scanned_at TIMESTAMPTZ DEFAULT NOW(),
    status TEXT -- 'valid', 'already_used', 'invalid'
);

--------------------------------------------------------------------------------
-- 3. PARTNER WORKFLOW
--------------------------------------------------------------------------------

CREATE TABLE public.partner_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type TEXT, -- 'event_organiser', 'professional_service'
    first_name TEXT,
    last_name TEXT,
    email TEXT NOT NULL,
    phone TEXT,
    category TEXT,
    role TEXT, -- 'Individual', 'Company'
    remarks TEXT,
    status TEXT DEFAULT 'Pending',
    kyc_status TEXT DEFAULT 'Not Started',
    kyc_details JSONB,
    approved_at TIMESTAMPTZ,
    access_granted_at TIMESTAMPTZ,
    password_created BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

--------------------------------------------------------------------------------
-- 4. TURFS
--------------------------------------------------------------------------------

CREATE TABLE public.turfs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organiser_id UUID REFERENCES public.profiles(id),
    name TEXT NOT NULL,
    description TEXT,
    location TEXT,
    address TEXT,
    lat FLOAT8,
    lng FLOAT8,
    images JSONB,
    amenities JSONB,
    price_per_hour FLOAT8 NOT NULL,
    advance_amount FLOAT8,
    pricing_type TEXT, -- 'flat', 'per_person', 'tiered'
    max_capacity INT4,
    price_per_person FLOAT8,
    pricing_tiers JSONB,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.turf_slots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    turf_id UUID REFERENCES public.turfs(id) ON DELETE CASCADE,
    day_of_week INT4, -- 0-6
    start_time TEXT, -- 'HH:MM'
    end_time TEXT, -- 'HH:MM'
    price_override FLOAT8,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE public.turf_bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    turf_id UUID REFERENCES public.turfs(id),
    user_id UUID REFERENCES public.profiles(id),
    date DATE NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    total_amount FLOAT8 NOT NULL,
    advance_paid FLOAT8 NOT NULL,
    participant_count INT4,
    payment_type TEXT, -- 'advance' | 'full'
    payment_status TEXT, -- 'pending', 'advance_paid', 'fully_paid', 'failed'
    booking_status TEXT, -- 'confirmed', 'cancelled', 'pending'
    customer_details JSONB,
    cancellation_reason TEXT,
    payment_intent_id TEXT,
    taxable_amount FLOAT8,
    gst_amount FLOAT8,
    gst_breakdown JSONB,
    invoice_number TEXT UNIQUE,
    is_gst_applied BOOLEAN DEFAULT FALSE,
    invoice_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

--------------------------------------------------------------------------------
-- 5. SETTINGS & SYSTEM
--------------------------------------------------------------------------------

CREATE TABLE public.system_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key TEXT UNIQUE NOT NULL,
    value JSONB,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.email_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider TEXT,
    host TEXT,
    port INT4,
    user_name TEXT,
    pass TEXT,
    from_email TEXT,
    from_name TEXT,
    encryption TEXT,
    auth_method TEXT,
    microsoft_365 JSONB,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.gst_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_name TEXT,
    business_address TEXT,
    gstin TEXT,
    tax_config JSONB,
    category_rates JSONB,
    invoice_prefix TEXT,
    is_enabled BOOLEAN DEFAULT FALSE,
    pricing_type TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

--------------------------------------------------------------------------------
-- 6. ADDITIONAL TABLES
--------------------------------------------------------------------------------

CREATE TABLE public.email_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    identifier TEXT UNIQUE NOT NULL,
    name TEXT,
    subject TEXT,
    body TEXT,
    auto_send BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    icon TEXT,
    count INT4 DEFAULT 0,
    sort_order INT4 DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.vendor_profiles (
    id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    category TEXT,
    bio TEXT,
    portfolio JSONB, -- Array of objects {url, type, ...}
    pricing JSONB,
    availability JSONB,
    blocked_dates JSONB,
    advanced_settings JSONB,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.chat_rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    participants TEXT[], -- Array of user emails or IDs
    last_message TEXT,
    last_message_at TIMESTAMPTZ DEFAULT NOW(),
    booking_id UUID
);

CREATE TABLE public.chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES public.profiles(id),
    text TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.meetings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    creator_id UUID REFERENCES public.profiles(id),
    status TEXT DEFAULT 'scheduled',
    start_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ,
    password TEXT,
    meeting_link TEXT UNIQUE NOT NULL,
    event_id UUID REFERENCES public.events(id),
    settings JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

--------------------------------------------------------------------------------
-- 6. ADDITIONAL TABLES & MODULES
--------------------------------------------------------------------------------

CREATE TABLE public.admins (
    id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'Support', -- 'Admin', 'Developer', 'Tester', 'Support'
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.otps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT NOT NULL,
    code TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    purpose TEXT NOT NULL, -- 'signup', 'login', 'reset'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.coupons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    brand_id TEXT, -- identifier for the brand owner
    title TEXT NOT NULL,
    description TEXT,
    redemption_method TEXT, -- 'In-Store', 'Online'
    discount_type TEXT, -- 'Percentage', 'Flat'
    discount_value FLOAT8,
    coupon_code TEXT,
    redirect_url TEXT,
    how_to_redeem TEXT,
    terms_and_conditions TEXT,
    banner_url TEXT,
    logo_url TEXT,
    brand_name TEXT,
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    usage_limit INT4,
    status TEXT DEFAULT 'Draft', -- 'Active', 'Draft', 'Paused'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.brand_stores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    brand_id TEXT,
    name TEXT NOT NULL,
    address TEXT,
    city TEXT,
    state TEXT,
    zip TEXT,
    staff_emails TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.brand_kyc (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    brand_id TEXT,
    org_name TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    zip TEXT,
    gst_number TEXT,
    pan_number TEXT,
    org_logo_url TEXT,
    status TEXT DEFAULT 'Pending', -- 'Pending', 'Verified', 'Rejected'
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.brand_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    brand_id TEXT,
    coupon_id UUID REFERENCES public.coupons(id),
    action TEXT, -- 'View', 'Scan', 'Redeem'
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.brand_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    brand_id TEXT,
    plan_type TEXT, -- 'Monthly', 'Yearly'
    amount_paid FLOAT8,
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    status TEXT DEFAULT 'active'
);

CREATE TABLE public.brand_banners (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    brand_id TEXT,
    image_url TEXT,
    redirect_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.subscribers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    status TEXT DEFAULT 'Active', -- 'Active', 'Unsubscribed'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.whatsapp_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider TEXT, -- 'Twilio', etc.
    account_sid TEXT,
    auth_token TEXT,
    from_number TEXT,
    api_key TEXT,
    is_active BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.ad_popups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    redirect_url TEXT,
    cta_text TEXT,
    bg_color TEXT,
    badge_text TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    show_every_minutes INT4 DEFAULT 30,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.mobile_video_banners (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type TEXT, -- 'video', 'image'
    media_url TEXT,
    title TEXT,
    sort_order INT4 DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.memories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    image_url TEXT NOT NULL,
    alt_text TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.failed_login_attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    identifier TEXT NOT NULL,
    ip TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

--------------------------------------------------------------------------------
-- 7. AUTH TRIGGER (Automatically create Profile)
--------------------------------------------------------------------------------

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    COALESCE(new.raw_user_meta_data->>'role', 'user')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function on signup
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

--------------------------------------------------------------------------------
-- 8. ROW LEVEL SECURITY (RLS) & POLICIES
--------------------------------------------------------------------------------

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organiser_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pwa_scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.turfs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.turf_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.turf_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gst_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_kyc ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_popups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mobile_video_banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.failed_login_attempts ENABLE ROW LEVEL SECURITY;

-- 1. Profiles Policies
CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile." ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- 2. Events Policies
CREATE POLICY "Events are viewable by everyone." ON public.events FOR SELECT USING (true);
CREATE POLICY "Organisers can manage own events." ON public.events FOR ALL USING (organiser_id = auth.uid() OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- 3. Bookings Policies
CREATE POLICY "Users can view own bookings." ON public.bookings FOR SELECT USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (role = 'organiser' OR role = 'admin')));
CREATE POLICY "Users can insert bookings." ON public.bookings FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 4. Admin Policies (Only admins can view/edit system config, etc.)
CREATE POLICY "Admins have full access to system_config." ON public.system_config FOR ALL USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');
CREATE POLICY "Admins have full access to email_settings." ON public.email_settings FOR ALL USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');
CREATE POLICY "Admins have full access to gst_settings." ON public.gst_settings FOR ALL USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- 5. Content viewing (Banners, Popups, Memories)
CREATE POLICY "Content is viewable by everyone." ON public.mobile_video_banners FOR SELECT USING (true);
CREATE POLICY "Content is viewable by everyone." ON public.ad_popups FOR SELECT USING (true);
CREATE POLICY "Content is viewable by everyone." ON public.memories FOR SELECT USING (true);

-- Meetings Module
CREATE TABLE IF NOT EXISTS public.meetings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES public.events(id),
    title TEXT NOT NULL,
    description TEXT,
    creator_id UUID REFERENCES public.profiles(id),
    meeting_link TEXT UNIQUE NOT NULL,
    status TEXT DEFAULT 'scheduled',
    settings JSONB DEFAULT '{"lobby": true, "muteOnJoin": true, "videoOffOnJoin": true, "chatEnabled": true, "screenShareEnabled": true}',
    end_date_time TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.meeting_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    meeting_id UUID REFERENCES public.meetings(id),
    user_id UUID REFERENCES public.profiles(id),
    name TEXT,
    role TEXT,
    status TEXT DEFAULT 'joined',
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    left_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.meeting_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    meeting_id UUID REFERENCES public.meetings(id),
    sender_id UUID REFERENCES public.profiles(id),
    sender_name TEXT,
    text TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.signals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    meeting_id UUID REFERENCES public.meetings(id),
    sender_id UUID REFERENCES public.profiles(id),
    receiver_id UUID REFERENCES public.profiles(id),
    type TEXT,
    data TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Indices for Meetings
CREATE INDEX IF NOT EXISTS idx_meetings_event_id ON public.meetings(event_id);
CREATE INDEX IF NOT EXISTS idx_meetings_link ON public.meetings(meeting_link);
CREATE INDEX IF NOT EXISTS idx_meeting_participants_meeting_id ON public.meeting_participants(meeting_id);
CREATE INDEX IF NOT EXISTS idx_meeting_messages_meeting_id ON public.meeting_messages(meeting_id);
CREATE INDEX IF NOT EXISTS idx_signals_meeting_id ON public.signals(meeting_id);

-- Web Admin & Support Modules
CREATE TABLE IF NOT EXISTS public.fee_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    convenience_fee_type TEXT DEFAULT 'percent',
    convenience_fee_value FLOAT8 DEFAULT 5,
    gst_percent FLOAT8 DEFAULT 18,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.ticket_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_name TEXT DEFAULT 'book my ticket',
    logo_url TEXT,
    important_info TEXT,
    support_url TEXT,
    send_via_email BOOLEAN DEFAULT TRUE,
    send_via_sms BOOLEAN DEFAULT TRUE,
    send_pdf_whatsapp BOOLEAN DEFAULT TRUE,
    auto_approve BOOLEAN DEFAULT TRUE,
    notify_organiser BOOLEAN DEFAULT TRUE,
    notify_user BOOLEAN DEFAULT TRUE,
    invoice_prefix TEXT DEFAULT 'BMT-',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.seo_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    global_title TEXT,
    global_keywords TEXT,
    global_description TEXT,
    meta_ads_code TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.policies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_header TEXT,
    payment_terms TEXT,
    event_disclaimer TEXT,
    cancellation_policy TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.sso_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    facebook_enabled BOOLEAN DEFAULT FALSE,
    google_enabled BOOLEAN DEFAULT FALSE,
    facebook_config JSONB,
    google_config JSONB,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.pages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    content TEXT,
    show_in_footer BOOLEAN DEFAULT TRUE,
    sort_order INT4 DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.banners (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organiser_id UUID REFERENCES public.profiles(id),
    image_url TEXT NOT NULL,
    redirect_url TEXT,
    status TEXT DEFAULT 'Pending',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.payment_gateways (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    is_enabled BOOLEAN DEFAULT FALSE,
    test_mode BOOLEAN DEFAULT TRUE,
    config JSONB,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.home_slides (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    image_url TEXT NOT NULL,
    title TEXT,
    subtitle TEXT,
    link TEXT,
    sort_order INT4 DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.home_partners (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    logo_url TEXT NOT NULL,
    url TEXT,
    sort_order INT4 DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.email_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id),
    email TEXT,
    subject TEXT,
    body TEXT,
    status TEXT,
    error TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indices for Web Support
CREATE INDEX IF NOT EXISTS idx_banners_status ON public.banners(status);
CREATE INDEX IF NOT EXISTS idx_pages_slug ON public.pages(slug);
CREATE INDEX IF NOT EXISTS idx_payment_gateways_enabled ON public.payment_gateways(is_enabled);

--------------------------------------------------------------------------------
-- 9. MISSING TABLES (Legacy Alignment)
--------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    key_value TEXT NOT NULL,
    status TEXT DEFAULT 'Active', -- 'Active', 'Revoked'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.home_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    label TEXT NOT NULL,
    icon TEXT,
    "order" INT4 DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.home_sections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    section_name TEXT NOT NULL,
    is_enabled BOOLEAN DEFAULT TRUE,
    "order" INT4 DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.promotions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    link_url TEXT,
    valid_until TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.service_providers (
    id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    business_name TEXT,
    category TEXT,
    status TEXT DEFAULT 'Pending',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.site_branding (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    logo_url TEXT,
    primary_color TEXT,
    secondary_color TEXT,
    footer_text TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.support_tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id),
    subject TEXT,
    message TEXT,
    status TEXT DEFAULT 'Open',
    priority TEXT DEFAULT 'Medium',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.branding_banners (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    img TEXT,
    title TEXT,
    subtitle TEXT,
    status TEXT DEFAULT 'Active',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.branding_coupons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT,
    description TEXT,
    code TEXT,
    discount TEXT,
    img TEXT,
    status TEXT DEFAULT 'Active',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure RLS is enabled for new tables
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.home_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.home_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_branding ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.branding_banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.branding_coupons ENABLE ROW LEVEL SECURITY;

-- Admins full access
CREATE POLICY "Admins have full access to api_keys." ON public.api_keys FOR ALL USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');
CREATE POLICY "Admins have full access to home_categories." ON public.home_categories FOR ALL USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');
CREATE POLICY "Admins have full access to home_sections." ON public.home_sections FOR ALL USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');
CREATE POLICY "Admins have full access to promotions." ON public.promotions FOR ALL USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');
CREATE POLICY "Admins have full access to service_providers." ON public.service_providers FOR ALL USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');
CREATE POLICY "Admins have full access to site_branding." ON public.site_branding FOR ALL USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');
CREATE POLICY "Admins have full access to support_tickets." ON public.support_tickets FOR ALL USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');
CREATE POLICY "Admins have full access to branding_banners." ON public.branding_banners FOR ALL USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');
CREATE POLICY "Admins have full access to branding_coupons." ON public.branding_coupons FOR ALL USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- Public viewing for some meta tables
CREATE POLICY "Public home_categories are viewable." ON public.home_categories FOR SELECT USING (true);
CREATE POLICY "Public home_sections are viewable." ON public.home_sections FOR SELECT USING (true);
CREATE POLICY "Public promotions are viewable." ON public.promotions FOR SELECT USING (true);
CREATE POLICY "Public branding_banners are viewable." ON public.branding_banners FOR SELECT USING (true);
CREATE POLICY "Public branding_coupons are viewable." ON public.branding_coupons FOR SELECT USING (true);

--------------------------------------------------------------------------------
-- 10. CLEANUP & NOTES
--------------------------------------------------------------------------------
-- passwordResetTokens table was removed in favor of using the 'otps' table 
-- with purpose='reset' to avoid manual schema migrations.

