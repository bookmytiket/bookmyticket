-- Fix RLS policies for Contact module to match project standards
DROP POLICY IF EXISTS "Allow admins to manage inquiries" ON public.contact_inquiries;
CREATE POLICY "Allow admins to manage inquiries" 
ON public.contact_inquiries FOR ALL
USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Allow admins to manage contact otps" ON public.contact_otps;
CREATE POLICY "Allow admins to manage contact otps" 
ON public.contact_otps FOR ALL
USING (public.is_admin(auth.uid()));
