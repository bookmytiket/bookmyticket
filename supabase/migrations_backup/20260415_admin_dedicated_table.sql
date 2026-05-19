-- Helper Function for Admin Checks
CREATE OR REPLACE FUNCTION public.is_admin(u_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
    -- Check if user exists in the dedicated admins table
    RETURN EXISTS (SELECT 1 FROM public.admins WHERE id = u_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply to RLS Policies (Dropping and Recreating with new is_admin check)

-- Events
DROP POLICY IF EXISTS "Organisers can manage own events." ON public.events;
CREATE POLICY "Organisers can manage own events." ON public.events 
    FOR ALL USING (organiser_id = auth.uid() OR is_admin(auth.uid()));

-- Bookings
DROP POLICY IF EXISTS "Users can view own bookings." ON public.bookings;
CREATE POLICY "Users can view own bookings." ON public.bookings 
    FOR SELECT USING (user_id = auth.uid() OR is_admin(auth.uid()) OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'organiser');

-- System Config
DROP POLICY IF EXISTS "Admins have full access to system_config." ON public.system_config;
CREATE POLICY "Admins have full access to system_config." ON public.system_config 
    FOR ALL USING (is_admin(auth.uid()));

-- Email Settings
DROP POLICY IF EXISTS "Admins have full access to email_settings." ON public.email_settings;
CREATE POLICY "Admins have full access to email_settings." ON public.email_settings 
    FOR ALL USING (is_admin(auth.uid()));

-- GST Settings
DROP POLICY IF EXISTS "Admins have full access to gst_settings." ON public.gst_settings;
CREATE POLICY "Admins have full access to gst_settings." ON public.gst_settings 
    FOR ALL USING (is_admin(auth.uid()));

-- API Keys
DROP POLICY IF EXISTS "Admins have full access to api_keys." ON public.api_keys;
CREATE POLICY "Admins have full access to api_keys." ON public.api_keys 
    FOR ALL USING (is_admin(auth.uid()));

-- Home Categories
DROP POLICY IF EXISTS "Admins have full access to home_categories." ON public.home_categories;
CREATE POLICY "Admins have full access to home_categories." ON public.home_categories 
    FOR ALL USING (is_admin(auth.uid()));

-- Home Sections
DROP POLICY IF EXISTS "Admins have full access to home_sections." ON public.home_sections;
CREATE POLICY "Admins have full access to home_sections." ON public.home_sections 
    FOR ALL USING (is_admin(auth.uid()));

-- Promotions
DROP POLICY IF EXISTS "Admins have full access to promotions." ON public.promotions;
CREATE POLICY "Admins have full access to promotions." ON public.promotions 
    FOR ALL USING (is_admin(auth.uid()));

-- Service Providers
DROP POLICY IF EXISTS "Admins have full access to service_providers." ON public.service_providers;
CREATE POLICY "Admins have full access to service_providers." ON public.service_providers 
    FOR ALL USING (is_admin(auth.uid()));

-- Site Branding
DROP POLICY IF EXISTS "Admins have full access to site_branding." ON public.site_branding;
CREATE POLICY "Admins have full access to site_branding." ON public.site_branding 
    FOR ALL USING (is_admin(auth.uid()));

-- Support Tickets
DROP POLICY IF EXISTS "Admins have full access to support_tickets." ON public.support_tickets;
CREATE POLICY "Admins have full access to support_tickets." ON public.support_tickets 
    FOR ALL USING (is_admin(auth.uid()));

-- Branding Banners
DROP POLICY IF EXISTS "Admins have full access to branding_banners." ON public.branding_banners;
CREATE POLICY "Admins have full access to branding_banners." ON public.branding_banners 
    FOR ALL USING (is_admin(auth.uid()));

-- Branding Coupons
DROP POLICY IF EXISTS "Admins have full access to branding_coupons." ON public.branding_coupons;
CREATE POLICY "Admins have full access to branding_coupons." ON public.branding_coupons 
    FOR ALL USING (is_admin(auth.uid()));

-- Update Master Admin Role to generic 'staff' in profiles for separation (Idempotent)
UPDATE public.profiles 
SET role = 'staff' 
WHERE id = 'adbfb83d-0081-436b-8cd1-bc57a6c3501d' AND role = 'admin';

-- Ensure record exists in admins table with 'Admin' role
INSERT INTO public.admins (id, role)
VALUES ('adbfb83d-0081-436b-8cd1-bc57a6c3501d', 'Admin')
ON CONFLICT (id) DO NOTHING;
