-- Supabase Migration: Remove all branding-related tables and security policies
-- Target: Clean cleanup of BookMyTicket Branding System database footprint

-- Drop tables
DROP TABLE IF EXISTS public.branding_banners CASCADE;
DROP TABLE IF EXISTS public.branding_coupons CASCADE;
DROP TABLE IF EXISTS public.branding_partners CASCADE;
DROP TABLE IF EXISTS public.brand_kyc CASCADE;
DROP TABLE IF EXISTS public.site_branding CASCADE;
