-- ============================================================
-- BookMyTicket — PROFESSIONAL SERVICE PROVIDER WORKFLOW
-- ============================================================

-- 1. Professional Service Requests (Partner Application)
CREATE TABLE IF NOT EXISTS public.professional_service_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    mobile TEXT NOT NULL UNIQUE,
    business_name TEXT NOT NULL,
    service_category TEXT NOT NULL,
    service_type TEXT NOT NULL,
    city TEXT NOT NULL,
    experience TEXT,
    description TEXT,
    portfolio_link TEXT,
    coverage_area TEXT,
    status TEXT DEFAULT 'Pending Review', -- 'Pending Review', 'Approved', 'Rejected', 'Suspended'
    admin_remarks TEXT,
    reviewed_by UUID REFERENCES auth.users(id),
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Professional Service Profiles (Active Providers)
CREATE TABLE IF NOT EXISTS public.professional_service_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    request_id UUID REFERENCES public.professional_service_requests(id) ON DELETE SET NULL,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    business_name TEXT NOT NULL,
    category TEXT,
    service_type TEXT,
    city TEXT,
    profile_image TEXT,
    description TEXT,
    active_status BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Provider Services
CREATE TABLE IF NOT EXISTS public.provider_services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID REFERENCES public.professional_service_profiles(id) ON DELETE CASCADE,
    service_name TEXT NOT NULL,
    category TEXT,
    description TEXT,
    pricing NUMERIC NOT NULL DEFAULT 0,
    duration TEXT,
    availability JSONB,
    booking_rules TEXT,
    cancellation_policy TEXT,
    status TEXT DEFAULT 'Draft', -- 'Draft', 'Published', 'Suspended'
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Provider Bookings
CREATE TABLE IF NOT EXISTS public.provider_bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID REFERENCES public.professional_service_profiles(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    service_id UUID REFERENCES public.provider_services(id),
    booking_date DATE NOT NULL,
    booking_time TIME NOT NULL,
    amount NUMERIC NOT NULL,
    payment_status TEXT DEFAULT 'pending', -- 'pending', 'paid', 'refunded'
    booking_status TEXT DEFAULT 'New Request', -- 'New Request', 'Accepted', 'Confirmed', 'Rescheduled', 'Completed', 'Cancelled'
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Provider Earnings
CREATE TABLE IF NOT EXISTS public.provider_earnings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID REFERENCES public.professional_service_profiles(id) ON DELETE CASCADE,
    booking_id UUID REFERENCES public.provider_bookings(id) ON DELETE CASCADE,
    gross_amount NUMERIC NOT NULL,
    platform_fee NUMERIC NOT NULL DEFAULT 0,
    net_amount NUMERIC NOT NULL,
    payout_status TEXT DEFAULT 'pending', -- 'pending', 'paid'
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Provider Reviews
CREATE TABLE IF NOT EXISTS public.provider_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID REFERENCES public.professional_service_profiles(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    booking_id UUID REFERENCES public.provider_bookings(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    review TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. Admin Activity Logs (Expand or create if missing)
CREATE TABLE IF NOT EXISTS public.admin_activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID REFERENCES auth.users(id),
    module_name TEXT NOT NULL,
    action TEXT NOT NULL,
    target_id UUID,
    remarks TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS POLICIES

-- Professional Service Requests
ALTER TABLE public.professional_service_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can insert requests" ON public.professional_service_requests;
CREATE POLICY "Public can insert requests" ON public.professional_service_requests FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Admins can view and manage requests" ON public.professional_service_requests;
CREATE POLICY "Admins can view and manage requests" ON public.professional_service_requests FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
);

-- Professional Service Profiles
ALTER TABLE public.professional_service_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Providers can manage own profile" ON public.professional_service_profiles;
CREATE POLICY "Providers can manage own profile" ON public.professional_service_profiles FOR ALL USING (auth_user_id = auth.uid());
DROP POLICY IF EXISTS "Public can view active profiles" ON public.professional_service_profiles;
CREATE POLICY "Public can view active profiles" ON public.professional_service_profiles FOR SELECT USING (active_status = true);

-- Provider Services
ALTER TABLE public.provider_services ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Providers can manage own services" ON public.provider_services;
CREATE POLICY "Providers can manage own services" ON public.provider_services FOR ALL USING (
    EXISTS (SELECT 1 FROM public.professional_service_profiles WHERE id = provider_id AND auth_user_id = auth.uid())
);
DROP POLICY IF EXISTS "Public can view published services" ON public.provider_services;
CREATE POLICY "Public can view published services" ON public.provider_services FOR SELECT USING (status = 'Published');

-- Provider Bookings
ALTER TABLE public.provider_bookings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Customers can insert bookings" ON public.provider_bookings;
CREATE POLICY "Customers can insert bookings" ON public.provider_bookings FOR INSERT WITH CHECK (customer_id = auth.uid());
DROP POLICY IF EXISTS "Customers can view own bookings" ON public.provider_bookings;
CREATE POLICY "Customers can view own bookings" ON public.provider_bookings FOR SELECT USING (customer_id = auth.uid());
DROP POLICY IF EXISTS "Providers can manage own bookings" ON public.provider_bookings;
CREATE POLICY "Providers can manage own bookings" ON public.provider_bookings FOR ALL USING (
    EXISTS (SELECT 1 FROM public.professional_service_profiles WHERE id = provider_id AND auth_user_id = auth.uid())
);

-- Provider Earnings
ALTER TABLE public.provider_earnings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Providers can view own earnings" ON public.provider_earnings;
CREATE POLICY "Providers can view own earnings" ON public.provider_earnings FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.professional_service_profiles WHERE id = provider_id AND auth_user_id = auth.uid())
);

-- Provider Reviews
ALTER TABLE public.provider_reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Customers can insert reviews" ON public.provider_reviews;
CREATE POLICY "Customers can insert reviews" ON public.provider_reviews FOR INSERT WITH CHECK (customer_id = auth.uid());
DROP POLICY IF EXISTS "Public can view reviews" ON public.provider_reviews;
CREATE POLICY "Public can view reviews" ON public.provider_reviews FOR SELECT USING (true);
