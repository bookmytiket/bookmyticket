-- ============================================================
-- BookMyTicket — MASTER ADMIN ACCESS RESTORATION
-- ============================================================

-- 1. Restore the legacy is_admin helper as a safe wrapper
CREATE OR REPLACE FUNCTION public.is_admin(u_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  RETURN public.is_platform_admin();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. Restore Global Admin Access Policies
-- Recreates policies that were lost during the 'DROP FUNCTION ... CASCADE'

-- PAYMENT GATEWAYS
DROP POLICY IF EXISTS "Admins can manage payment gateways" ON public.payment_gateways;
CREATE POLICY "Admins can manage payment gateways" ON public.payment_gateways 
    FOR ALL USING (public.is_platform_admin()) WITH CHECK (public.is_platform_admin());

-- FEE SETTINGS
DROP POLICY IF EXISTS "Admins have full access to fee_settings" ON public.fee_settings;
CREATE POLICY "Admins have full access to fee_settings" ON public.fee_settings 
    FOR ALL USING (public.is_platform_admin()) WITH CHECK (public.is_platform_admin());

-- CONTACT SETTINGS
DROP POLICY IF EXISTS "Admins can manage contact settings" ON public.contact_settings;
CREATE POLICY "Admins can manage contact settings" ON public.contact_settings 
    FOR ALL USING (public.is_platform_admin()) WITH CHECK (public.is_platform_admin());

-- STAFF PACKAGES
DROP POLICY IF EXISTS "Admins can manage staff packages" ON public.staff_packages;
CREATE POLICY "Admins can manage staff packages" ON public.staff_packages 
    FOR ALL USING (public.is_platform_admin()) WITH CHECK (public.is_platform_admin());

-- ORGANISERS
DROP POLICY IF EXISTS "Admins can view and manage organisers" ON public.organisers;
CREATE POLICY "Admins can view and manage organisers" ON public.organisers 
    FOR ALL USING (public.is_platform_admin());

-- STAFF
DROP POLICY IF EXISTS "Admins can view and manage staff" ON public.staff;
CREATE POLICY "Admins can view and manage staff" ON public.staff 
    FOR ALL USING (public.is_platform_admin());

-- CATEGORIES
DROP POLICY IF EXISTS "Admins have full access to categories" ON public.categories;
CREATE POLICY "Admins have full access to categories" ON public.categories 
    FOR ALL USING (public.is_platform_admin());

-- VENDORS
DROP POLICY IF EXISTS "Admins can view and manage vendors" ON public.vendors;
CREATE POLICY "Admins can view and manage vendors" ON public.vendors 
    FOR ALL USING (public.is_platform_admin());

-- TICKET SETTINGS
DROP POLICY IF EXISTS "Admins have full access to ticket_settings" ON public.ticket_settings;
CREATE POLICY "Admins have full access to ticket_settings" ON public.ticket_settings 
    FOR ALL USING (public.is_platform_admin());

-- SEO SETTINGS
DROP POLICY IF EXISTS "Admins have full access to seo_settings" ON public.seo_settings;
CREATE POLICY "Admins have full access to seo_settings" ON public.seo_settings 
    FOR ALL USING (public.is_platform_admin());

-- EMAIL SETTINGS
DROP POLICY IF EXISTS "Admins have full access to email_settings" ON public.email_settings;
CREATE POLICY "Admins have full access to email_settings" ON public.email_settings 
    FOR ALL USING (public.is_platform_admin());

-- API SETTINGS / KEYS
DROP POLICY IF EXISTS "Admins have full access to api_keys" ON public.api_keys;
CREATE POLICY "Admins have full access to api_keys" ON public.api_keys 
    FOR ALL USING (public.is_platform_admin());
