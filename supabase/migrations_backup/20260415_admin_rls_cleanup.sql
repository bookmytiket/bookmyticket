-- Migration: Comprehensive Admin RLS Cleanup
-- This migration updates all remaining administrative tables to use the public.is_admin() helper.
-- Run this in the Supabase SQL Editor at: supabase.com → SQL Editor

-- 1. Subscribers
DROP POLICY IF EXISTS "Admins can read subscribers" ON public.subscribers;
DROP POLICY IF EXISTS "Admins can delete subscribers" ON public.subscribers;
CREATE POLICY "Admins can read subscribers" ON public.subscribers FOR SELECT USING (is_admin(auth.uid()));
CREATE POLICY "Admins can delete subscribers" ON public.subscribers FOR DELETE USING (is_admin(auth.uid()));

-- 2. Turf Bookings
DROP POLICY IF EXISTS "Admins can manage turf bookings" ON public.turf_bookings;
CREATE POLICY "Admins can manage turf bookings" ON public.turf_bookings FOR ALL USING (is_admin(auth.uid()));

-- 3. Memories (Recent Memories)
DROP POLICY IF EXISTS "Admin full access to memories" ON public.memories;
CREATE POLICY "Admin full access to memories" ON public.memories FOR ALL USING (is_admin(auth.uid()));

-- 4. Pages
DROP POLICY IF EXISTS "Admin full access to pages" ON public.pages;
CREATE POLICY "Admin full access to pages" ON public.pages FOR ALL USING (is_admin(auth.uid()));

-- 5. Fee Settings
DROP POLICY IF EXISTS "Admins have full access to fee_settings." ON public.fee_settings;
CREATE POLICY "Admins have full access to fee_settings." ON public.fee_settings FOR ALL USING (is_admin(auth.uid()));

-- 6. Ticket Settings
DROP POLICY IF EXISTS "Admins have full access to ticket_settings." ON public.ticket_settings;
CREATE POLICY "Admins have full access to ticket_settings." ON public.ticket_settings FOR ALL USING (is_admin(auth.uid()));

-- 7. SEO Settings
DROP POLICY IF EXISTS "Admins have full access to seo_settings." ON public.seo_settings;
CREATE POLICY "Admins have full access to seo_settings." ON public.seo_settings FOR ALL USING (is_admin(auth.uid()));

-- 8. Email Templates
DROP POLICY IF EXISTS "Admins have full access to email_templates." ON public.email_templates;
CREATE POLICY "Admins have full access to email_templates." ON public.email_templates FOR ALL USING (is_admin(auth.uid()));

-- 9. Policies (Booking Header/Terms)
DROP POLICY IF EXISTS "Admins have full access to policies." ON public.policies;
CREATE POLICY "Admins have full access to policies." ON public.policies FOR ALL USING (is_admin(auth.uid()));

-- 10. SSO Settings
DROP POLICY IF EXISTS "Admins have full access to sso_settings." ON public.sso_settings;
CREATE POLICY "Admins have full access to sso_settings." ON public.sso_settings FOR ALL USING (is_admin(auth.uid()));

-- 11. Categories (Standard)
DROP POLICY IF EXISTS "Admins have full access to categories." ON public.categories;
CREATE POLICY "Admins have full access to categories." ON public.categories FOR ALL USING (is_admin(auth.uid()));

-- 12. Home Partners
DROP POLICY IF EXISTS "Admins have full access to home_partners." ON public.home_partners;
CREATE POLICY "Admins have full access to home_partners." ON public.home_partners FOR ALL USING (is_admin(auth.uid()));

-- 13. Home Slides
DROP POLICY IF EXISTS "Admins have full access to home_slides." ON public.home_slides;
CREATE POLICY "Admins have full access to home_slides." ON public.home_slides FOR ALL USING (is_admin(auth.uid()));

-- 14. Ad Popups
DROP POLICY IF EXISTS "Admins have full access to ad_popups." ON public.ad_popups;
CREATE POLICY "Admins have full access to ad_popups." ON public.ad_popups FOR ALL USING (is_admin(auth.uid()));

-- 15. Profiles (Admin Visibility)
-- Ensure admins can see all profiles to manage users
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (is_admin(auth.uid()));

-- 16. Admins (Self-Visibility)
-- Ensure admins can see the admins table
DROP POLICY IF EXISTS "Admins can view admins table" ON public.admins;
CREATE POLICY "Admins can view admins table" ON public.admins FOR SELECT USING (is_admin(auth.uid()));

-- Note: 'read-only' policies for public/anonymous users (where applicable) 
-- like SELECT on public banners, pages, etc., usually already use 'true' or similar 
-- and don't need update unless they were specifically restricted to the 'admin' role in profiles.
