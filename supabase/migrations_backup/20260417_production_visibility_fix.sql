-- Migration: Fix Production Data Visibility (RLS)
-- Run this in the Supabase SQL Editor (supabase.com → SQL Editor)

-- 1. Ensure EVENTS table is visible to the public for browsing
-- Handles both legacy ('Active'), new ('published'), and unassigned (NULL) statuses
DROP POLICY IF EXISTS "Anyone can view published events" ON public.events;
CREATE POLICY "Anyone can view published events" 
ON public.events FOR SELECT 
USING (status IS NULL OR status = 'published' OR status = 'Active');

-- 2. Ensure ORGANISERS can view their own events (including drafts/inactive)
DROP POLICY IF EXISTS "Organisers can manage own events" ON public.events;
CREATE POLICY "Organisers can manage own events" 
ON public.events FOR ALL 
USING (auth.uid() = organiser_id);

-- 3. Ensure ORGANISERS table is partially visible to authenticated users 
-- (Necessary for AuthContext to fetch roles correctly)
DROP POLICY IF EXISTS "Users can view organiser public info" ON public.organisers;
CREATE POLICY "Users can view organiser public info" 
ON public.organisers FOR SELECT 
USING (auth.role() = 'authenticated');

-- 4. Enable organisers to update their own records
DROP POLICY IF EXISTS "Organisers can update own profile" ON public.organisers;
CREATE POLICY "Organisers can update own profile" 
ON public.organisers FOR UPDATE 
USING (auth.uid() = id);

-- 5. Correct RLS for BOOKINGS (Organisers must be able to see bookings for their events)
DROP POLICY IF EXISTS "Organisers can view bookings for their events" ON public.bookings;
CREATE POLICY "Organisers can view bookings for their events" 
ON public.bookings FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.events 
    WHERE events.id = bookings.event_id 
    AND events.organiser_id = auth.uid()
  )
);

-- 6. Ensure system_config is visible to everybody (needed for home page layout)
ALTER TABLE public.system_config ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can view system config" ON public.system_config;
CREATE POLICY "Public can view system config" ON public.system_config FOR SELECT USING (true);
