-- Migration: Staff Management System Setup (REPAIR & SYNC)
-- This creates/updates the staff table and associated security policies.

-- 1. Ensure Staff Table exists and has correct columns
CREATE TABLE IF NOT EXISTS public.staff (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4()
);

-- Add missing columns if they were skipped by IF NOT EXISTS
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='staff' AND column_name='auth_user_id') THEN
        ALTER TABLE public.staff ADD COLUMN auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='staff' AND column_name='organiser_id') THEN
        ALTER TABLE public.staff ADD COLUMN organiser_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='staff' AND column_name='name') THEN
        ALTER TABLE public.staff ADD COLUMN name TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='staff' AND column_name='email') THEN
        ALTER TABLE public.staff ADD COLUMN email TEXT UNIQUE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='staff' AND column_name='is_active') THEN
        ALTER TABLE public.staff ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='staff' AND column_name='role') THEN
        ALTER TABLE public.staff ADD COLUMN role TEXT DEFAULT 'staff';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='staff' AND column_name='created_at') THEN
        ALTER TABLE public.staff ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='staff' AND column_name='updated_at') THEN
        ALTER TABLE public.staff ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;

-- 2. Enable RLS
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies for Staff Table
-- We drop existing policies first to re-apply with the correct column references
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Organisers can view their own staff" ON public.staff;
    DROP POLICY IF EXISTS "Organisers can create staff" ON public.staff;
    DROP POLICY IF EXISTS "Organisers can update their own staff" ON public.staff;
    DROP POLICY IF EXISTS "Staff can view own record" ON public.staff;
END $$;

-- Organisers can see their own staff
CREATE POLICY "Organisers can view their own staff" 
ON public.staff FOR SELECT 
USING (organiser_id = auth.uid());

-- Organisers can create staff
CREATE POLICY "Organisers can create staff" 
ON public.staff FOR INSERT 
WITH CHECK (organiser_id = auth.uid());

-- Organisers can update their own staff
CREATE POLICY "Organisers can update their own staff" 
ON public.staff FOR UPDATE 
USING (organiser_id = auth.uid());

-- Staff can view their own record
CREATE POLICY "Staff can view own record" 
ON public.staff FOR SELECT 
USING (auth_user_id = auth.uid());

-- 4. Extend Events Policies for Staff Access
-- Allow staff to view events created by their linked organiser
DO $$ BEGIN DROP POLICY IF EXISTS "Staff can view their organiser's events" ON public.events; END $$;
CREATE POLICY "Staff can view their organiser's events" 
ON public.events FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.staff 
        WHERE staff.auth_user_id = auth.uid() 
        AND staff.organiser_id = events.organiser_id
    )
);

-- 5. Extend Bookings/Scans Policies for Staff
-- Allow staff to perform scans for their organiser's events
DO $$ BEGIN DROP POLICY IF EXISTS "Staff can insert scans for organiser events" ON public.bookings; END $$;
-- Note: Applying to bookings since pwa_scans might be consolidated or missing
CREATE POLICY "Staff can update bookings for verification" 
ON public.bookings FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.staff 
        WHERE staff.auth_user_id = auth.uid() 
        AND EXISTS (
            SELECT 1 FROM public.events 
            WHERE events.id = bookings.event_id 
            AND events.organiser_id = staff.organiser_id
        )
    )
);

-- 6. Add comment for documentation
COMMENT ON TABLE public.staff IS 'Stores staff members created by organisers to perform ticket scanning and other restricted tasks.';
