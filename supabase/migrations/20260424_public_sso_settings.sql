-- Allow public/anonymous users to read SSO settings so the Sign-in page can show/hide buttons correctly.
DROP POLICY IF EXISTS "Public can view sso_settings" ON public.sso_settings;
CREATE POLICY "Public can view sso_settings" ON public.sso_settings
    FOR SELECT USING (true);

-- Allow public/anonymous users to read communication settings (enabled status) for OTP visibility.
DROP POLICY IF EXISTS "Public can view communicationSettings" ON public."communicationSettings";
CREATE POLICY "Public can view communicationSettings" ON public."communicationSettings"
    FOR SELECT USING (true);
