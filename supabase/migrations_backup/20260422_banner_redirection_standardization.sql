-- Add redirection columns to banners tables for mobile and web parity
-- This migration standardizes how redirections are handled across all promotional elements.

-- 1. Mobile Video Banners
ALTER TABLE public.mobile_video_banners ADD COLUMN IF NOT EXISTS redirect_type TEXT; -- 'event', 'service', 'turf', 'url'
ALTER TABLE public.mobile_video_banners ADD COLUMN IF NOT EXISTS redirect_id TEXT;   -- UUID or ID string
ALTER TABLE public.mobile_video_banners ADD COLUMN IF NOT EXISTS redirect_url TEXT;  -- Legacy/Fallback URL

-- 2. Branding Banners (Home Hero)
ALTER TABLE public.branding_banners ADD COLUMN IF NOT EXISTS redirect_type TEXT; -- 'event', 'service', 'turf', 'url'
ALTER TABLE public.branding_banners ADD COLUMN IF NOT EXISTS redirect_id TEXT;   -- UUID or ID string
ALTER TABLE public.branding_banners ADD COLUMN IF NOT EXISTS redirect_url TEXT;  -- Legacy/Fallback URL

-- 3. Ad Popups
ALTER TABLE public.ad_popups ADD COLUMN IF NOT EXISTS redirect_type TEXT; -- 'event', 'service', 'turf', 'url'
ALTER TABLE public.ad_popups ADD COLUMN IF NOT EXISTS redirect_id TEXT;   -- UUID or ID string
ALTER TABLE public.ad_popups ADD COLUMN IF NOT EXISTS sort_order INT DEFAULT 0;
-- redirect_url already exists in ad_popups

-- 4. Branding Coupons
ALTER TABLE public.branding_coupons ADD COLUMN IF NOT EXISTS redirect_type TEXT; -- 'event', 'service', 'turf', 'url'
ALTER TABLE public.branding_coupons ADD COLUMN IF NOT EXISTS redirect_id TEXT;   -- UUID or ID string
ALTER TABLE public.branding_coupons ADD COLUMN IF NOT EXISTS redirect_url TEXT;  -- Legacy/Fallback URL

-- Standardize names for better join consistency
ALTER TABLE public.service_providers DROP CONSTRAINT IF EXISTS service_providers_organiser_id_fkey;
ALTER TABLE public.service_providers ADD CONSTRAINT service_providers_organiser_id_fkey FOREIGN KEY (organiser_id) REFERENCES public.profiles(id);

-- Ensure RLS allows selecting these columns
DROP POLICY IF EXISTS "Content is viewable by everyone." ON public.mobile_video_banners;
CREATE POLICY "Content is viewable by everyone." ON public.mobile_video_banners FOR SELECT USING (true);

DROP POLICY IF EXISTS "Content is viewable by everyone." ON public.ad_popups;
CREATE POLICY "Content is viewable by everyone." ON public.ad_popups FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public branding_banners are viewable." ON public.branding_banners;
CREATE POLICY "Public branding_banners are viewable." ON public.branding_banners FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public branding_coupons are viewable." ON public.branding_coupons;
CREATE POLICY "Public branding_coupons are viewable." ON public.branding_coupons FOR SELECT USING (true);
