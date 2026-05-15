-- ============================================================
-- BookMyTicket — Comprehensive Admin Visibility Fix
-- ============================================================

-- 1. Ensure tournament_events is visible to admins
DROP POLICY IF EXISTS "Admin global access tournament_events" ON public.tournament_events;
CREATE POLICY "Admin global access tournament_events" ON public.tournament_events 
FOR ALL TO authenticated USING (public.is_platform_admin());

-- 2. Ensure marathon_events is visible to admins
DROP POLICY IF EXISTS "Admin global access marathon_events" ON public.marathon_events;
CREATE POLICY "Admin global access marathon_events" ON public.marathon_events 
FOR ALL TO authenticated USING (public.is_platform_admin());

-- 3. Ensure kyc_details is visible to admins
DROP POLICY IF EXISTS "Admin global access kyc_details" ON public.kyc_details;
CREATE POLICY "Admin global access kyc_details" ON public.kyc_details 
FOR ALL TO authenticated USING (public.is_platform_admin());

-- 4. Ensure payments/transactions are visible to admins
DROP POLICY IF EXISTS "Admin global access payments" ON public.payments;
CREATE POLICY "Admin global access payments" ON public.payments 
FOR ALL TO authenticated USING (public.is_platform_admin());

-- 5. Ensure tournament_payments are visible to admins
DROP POLICY IF EXISTS "Admin global access tournament_payments" ON public.tournament_payments;
CREATE POLICY "Admin global access tournament_payments" ON public.tournament_payments 
FOR ALL TO authenticated USING (public.is_platform_admin());

-- 6. Ensure gst_reports are visible to admins
DROP POLICY IF EXISTS "Admin global access gst_reports" ON public.gst_reports;
CREATE POLICY "Admin global access gst_reports" ON public.gst_reports 
FOR ALL TO authenticated USING (public.is_platform_admin());

-- 7. Ensure flash_deals are visible to admins
DROP POLICY IF EXISTS "Admin global access flash_deals" ON public.flash_deals;
CREATE POLICY "Admin global access flash_deals" ON public.flash_deals 
FOR ALL TO authenticated USING (public.is_platform_admin());

-- 8. Ensure fraud_alerts are visible to admins
DROP POLICY IF EXISTS "Admin global access fraud_alerts" ON public.fraud_alerts;
CREATE POLICY "Admin global access fraud_alerts" ON public.fraud_alerts 
FOR ALL TO authenticated USING (public.is_platform_admin());

-- 9. Ensure scanner_logs are visible to admins
DROP POLICY IF EXISTS "Admin global access scanner_logs" ON public.scanner_logs;
CREATE POLICY "Admin global access scanner_logs" ON public.scanner_logs 
FOR ALL TO authenticated USING (public.is_platform_admin());

-- 10. Ensure tournament_teams/members are visible to admins
DROP POLICY IF EXISTS "Admin global access tournament_teams" ON public.tournament_teams;
CREATE POLICY "Admin global access tournament_teams" ON public.tournament_teams 
FOR ALL TO authenticated USING (public.is_platform_admin());

DROP POLICY IF EXISTS "Admin global access tournament_team_members" ON public.tournament_team_members;
CREATE POLICY "Admin global access tournament_team_members" ON public.tournament_team_members 
FOR ALL TO authenticated USING (public.is_platform_admin());

-- 11. Ensure organisers and vendors are visible to admins
DROP POLICY IF EXISTS "Admin global access organisers" ON public.organisers;
CREATE POLICY "Admin global access organisers" ON public.organisers 
FOR ALL TO authenticated USING (public.is_platform_admin());

DROP POLICY IF EXISTS "Admin global access vendors" ON public.vendors;
CREATE POLICY "Admin global access vendors" ON public.vendors 
FOR ALL TO authenticated USING (public.is_platform_admin());

-- 12. End of Admin Visibility Migration
