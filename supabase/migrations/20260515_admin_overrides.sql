-- ============================================================
-- BookMyTicket — Global Admin Overrides (RLS)
-- ============================================================

-- Helper to check for admin role
CREATE OR REPLACE FUNCTION public.is_platform_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'system_admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add Admin Override Policies to all primary tables
-- Note: Policies are additive, so these will grant access in addition to existing ones.

-- PROFILES
CREATE POLICY "Admin global access profiles" ON public.profiles FOR ALL TO authenticated USING (public.is_platform_admin());

-- EVENTS
CREATE POLICY "Admin global access events" ON public.events FOR ALL TO authenticated USING (public.is_platform_admin());

-- BOOKINGS
CREATE POLICY "Admin global access bookings" ON public.bookings FOR ALL TO authenticated USING (public.is_platform_admin());

-- WALLETS
CREATE POLICY "Admin global access wallets" ON public.wallets FOR ALL TO authenticated USING (public.is_platform_admin());

-- ORGANISERS
CREATE POLICY "Admin global access organisers" ON public.organisers FOR ALL TO authenticated USING (public.is_platform_admin());

-- STAFF
CREATE POLICY "Admin global access staff" ON public.staff FOR ALL TO authenticated USING (public.is_platform_admin());

-- SERVICE PROVIDERS
CREATE POLICY "Admin global access providers" ON public.service_providers FOR ALL TO authenticated USING (public.is_platform_admin());

-- SERVICE BOOKINGS
CREATE POLICY "Admin global access svc_bookings" ON public.service_bookings FOR ALL TO authenticated USING (public.is_platform_admin());

-- PROVIDER SERVICES
CREATE POLICY "Admin global access provider_services" ON public.provider_services FOR ALL TO authenticated USING (public.is_platform_admin());

-- VENDORS
CREATE POLICY "Admin global access vendors" ON public.vendors FOR ALL TO authenticated USING (public.is_platform_admin());

-- NOTIFICATIONS
CREATE POLICY "Admin global access notifications" ON public.notifications FOR ALL TO authenticated USING (public.is_platform_admin());
