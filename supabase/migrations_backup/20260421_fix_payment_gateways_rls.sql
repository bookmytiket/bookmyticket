-- Migration: Fix RLS Policies for Payment Gateways and related tables
-- Description: Enables RLS and adds full access policies for admins to manage payment gateways.

-- 1. Enable RLS
ALTER TABLE public.payment_gateways ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies if any to avoid conflicts
DROP POLICY IF EXISTS "Admins have full access to payment_gateways" ON public.payment_gateways;
DROP POLICY IF EXISTS "Public can view enabled payment gateways" ON public.payment_gateways;

-- 3. Create Policies
-- Admins can do everything
CREATE POLICY "Admins have full access to payment_gateways" 
ON public.payment_gateways 
FOR ALL 
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'super_admin')
)
WITH CHECK (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'super_admin')
);

-- Public can see which gateways are enabled (for checkout pages)
CREATE POLICY "Public can view enabled payment gateways" 
ON public.payment_gateways 
FOR SELECT 
USING (is_enabled = true);

-- Also ensure other missing tables have proper RLS if they are used in settings
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins have full access to api_keys." ON public.api_keys;
CREATE POLICY "Admins have full access to api_keys" 
ON public.api_keys FOR ALL 
USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'super_admin'));

-- Ensure site_branding is correctly policy-ed
ALTER TABLE public.site_branding ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins have full access to site_branding." ON public.site_branding;
CREATE POLICY "Admins have full access to site_branding" 
ON public.site_branding FOR ALL 
USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'super_admin'));

-- Ensure support_tickets is correctly policy-ed
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins have full access to support_tickets." ON public.support_tickets;
CREATE POLICY "Admins have full access to support_tickets" 
ON public.support_tickets FOR ALL 
USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'super_admin'));
