-- Fix missing RLS policies for public data access on mobile/web

-- 0. Rename incorrectly named tables if they exist
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'vendorReviews') THEN
        ALTER TABLE public."vendorReviews" RENAME TO vendor_reviews;
    END IF;
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'vendorBookings') AND 
       NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'vendor_bookings') THEN
        ALTER TABLE public."vendorBookings" RENAME TO vendor_bookings;
    END IF;
END $$;

-- 1. categories
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Categories are viewable by everyone" ON public.categories;
CREATE POLICY "Categories are viewable by everyone" ON public.categories FOR SELECT USING (true);

-- 2. system_config (Public slides/banners)
ALTER TABLE public.system_config ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "System config is viewable by everyone" ON public.system_config;
CREATE POLICY "System config is viewable by everyone" ON public.system_config FOR SELECT USING (true);

-- 3. vendor_profiles (Public artists/vendors)
ALTER TABLE public.vendor_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Vendor profiles are viewable by everyone" ON public.vendor_profiles;
CREATE POLICY "Vendor profiles are viewable by everyone" ON public.vendor_profiles FOR SELECT USING (true);

-- 4. vendor_bookings (Owners and vendors can see)
ALTER TABLE public.vendor_bookings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can see own vendor bookings" ON public.vendor_bookings;
CREATE POLICY "Users can see own vendor bookings" ON public.vendor_bookings FOR SELECT USING (auth.uid() = user_id OR auth.uid() = vendor_id);

-- 5. vendor_reviews
ALTER TABLE public.vendor_reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Reviews are viewable by everyone" ON public.vendor_reviews;
CREATE POLICY "Reviews are viewable by everyone" ON public.vendor_reviews FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert own reviews" ON public.vendor_reviews;
CREATE POLICY "Users can insert own reviews" ON public.vendor_reviews FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 6. service_providers (The actual table used for results)
ALTER TABLE public.service_providers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can view service_providers" ON public.service_providers;
CREATE POLICY "Public can view service_providers" ON public.service_providers 
FOR SELECT USING (LOWER(status) = 'active' OR status IS NULL);

DROP POLICY IF EXISTS "Service providers can manage own profile" ON public.service_providers;
CREATE POLICY "Service providers can manage own profile" ON public.service_providers 
FOR ALL USING (auth.uid() = id OR auth.uid() = organiser_id OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');
