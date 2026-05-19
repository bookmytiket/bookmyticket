-- Migration: Establish Admin RLS Policies for New Organiser/Vendor Schemas
-- Run this in the Supabase SQL Editor at: supabase.com → SQL Editor
-- This ensures platform admins can fetch and manage verified organisers without being blocked by RLS.

-- 1. Grant Admins access to organisers
DROP POLICY IF EXISTS "Admins can view and manage organisers" ON public.organisers;
CREATE POLICY "Admins can view and manage organisers" ON public.organisers FOR ALL USING (public.is_admin(auth.uid()));

-- 2. Grant Admins access to vendors
DROP POLICY IF EXISTS "Admins can view and manage vendors" ON public.vendors;
CREATE POLICY "Admins can view and manage vendors" ON public.vendors FOR ALL USING (public.is_admin(auth.uid()));

-- 3. Grant Admins access to staff 
DROP POLICY IF EXISTS "Admins can view and manage staff" ON public.staff;
CREATE POLICY "Admins can view and manage staff" ON public.staff FOR ALL USING (public.is_admin(auth.uid()));

-- 4. Grant Admins access to public_users
DROP POLICY IF EXISTS "Admins can view and manage public_users" ON public.public_users;
CREATE POLICY "Admins can view and manage public_users" ON public.public_users FOR ALL USING (public.is_admin(auth.uid()));

-- 5. Grant Admins access to branding_partners
DROP POLICY IF EXISTS "Admins can view and manage branding_partners" ON public.branding_partners;
CREATE POLICY "Admins can view and manage branding_partners" ON public.branding_partners FOR ALL USING (public.is_admin(auth.uid()));
