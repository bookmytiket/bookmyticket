-- Migration: Total Staff Table Repair
-- This migration standardizes the staff table schema to ensure it works with the latest API.

-- 1. Ensure extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Repair 'staff' table
DO $$ 
BEGIN
    -- Rename if it exists but is old/wrong (optional safety)
    -- ALTER TABLE IF EXISTS public.staff RENAME TO staff_legacy;
    
    -- Create the table with correct PK and defaults
    CREATE TABLE IF NOT EXISTS public.staff (
        id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
        auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
        organiser_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
        name TEXT,
        email TEXT UNIQUE,
        role TEXT DEFAULT 'staff',
        permissions JSONB DEFAULT '[]',
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- Ensure Columns exist (if table already existed)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='staff' AND column_name='auth_user_id') THEN
        ALTER TABLE public.staff ADD COLUMN auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='staff' AND column_name='organiser_id') THEN
        ALTER TABLE public.staff ADD COLUMN organiser_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;

    -- Standardize organiser_id FK (Point to profiles instead of organisers for maximum flexibility)
    ALTER TABLE public.staff DROP CONSTRAINT IF EXISTS staff_organiser_id_fkey;
    ALTER TABLE public.staff ADD CONSTRAINT staff_organiser_id_fkey FOREIGN KEY (organiser_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

    -- Ensure id FK is to profiles
    ALTER TABLE public.staff DROP CONSTRAINT IF EXISTS staff_id_fkey;
    ALTER TABLE public.staff ADD CONSTRAINT staff_id_fkey FOREIGN KEY (id) REFERENCES public.profiles(id) ON DELETE CASCADE;

END $$;

-- 3. Enable RLS
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;

-- 4. Re-apply Policies
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Organisers can view their own staff" ON public.staff;
    DROP POLICY IF EXISTS "Organisers can create staff" ON public.staff;
    DROP POLICY IF EXISTS "Organisers can update their own staff" ON public.staff;
    DROP POLICY IF EXISTS "Staff can view own record" ON public.staff;
    
    CREATE POLICY "Organisers can view their own staff" ON public.staff FOR SELECT USING (organiser_id = auth.uid());
    CREATE POLICY "Organisers can create staff" ON public.staff FOR INSERT WITH CHECK (organiser_id = auth.uid());
    CREATE POLICY "Organisers can update their own staff" ON public.staff FOR UPDATE USING (organiser_id = auth.uid());
    CREATE POLICY "Staff can view own record" ON public.staff FOR SELECT USING (id = auth.uid());
END $$;
